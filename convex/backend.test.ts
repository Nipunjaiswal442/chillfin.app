// @vitest-environment edge-runtime
/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { afterEach, describe, expect, test } from 'vitest'
import schema from './schema'
import { api } from './_generated/api'

const modules = import.meta.glob('./**/*.ts')

function setup() {
  const t = convexTest(schema, modules)
  const alice = t.withIdentity({ subject: 'uid-alice', name: 'Alice', email: 'alice@example.com' })
  const bob = t.withIdentity({ subject: 'uid-bob', name: 'Bob', email: 'bob@example.com' })
  return { t, alice, bob }
}

const expense = { type: 'expense' as const, amount: 250, category: 'food', date: '2026-10-05' }

describe('auth boundary', () => {
  test('signed-out callers get empty reads and rejected writes', async () => {
    const { t } = setup()
    expect(await t.query(api.users.me, {})).toBeNull()
    expect(await t.query(api.transactions.list, {})).toEqual([])
    expect(await t.query(api.goals.list, {})).toEqual([])
    await expect(t.mutation(api.transactions.add, expense)).rejects.toThrow(/Not signed in/)
    await expect(t.mutation(api.advisor.beginChat, { today: '2026-10-18' })).rejects.toThrow(/Not signed in/)
  })

  test("users only ever see and change their own rows", async () => {
    const { alice, bob } = setup()
    const tx = await alice.mutation(api.transactions.add, expense)
    const goal = await alice.mutation(api.goals.create, { name: 'Laptop', target_amount: 60000, emoji: '💻' })

    expect(await bob.query(api.transactions.list, {})).toEqual([])
    expect(await bob.query(api.goals.list, {})).toEqual([])
    await expect(bob.mutation(api.transactions.remove, { id: tx._id })).rejects.toThrow(/not found/)
    await expect(bob.mutation(api.goals.addSavings, { id: goal._id, amount: 100 })).rejects.toThrow(/not found/)
    await expect(bob.mutation(api.goals.remove, { id: goal._id })).rejects.toThrow(/not found/)

    expect(await alice.query(api.transactions.list, {})).toHaveLength(1)
    expect((await alice.query(api.goals.list, {}))[0].saved_amount).toBe(0)
  })
})

describe('profile + budget', () => {
  test('signing in again does not reset monthly pocket money', async () => {
    const { alice } = setup()
    await alice.mutation(api.users.ensure, {})
    await alice.mutation(api.budget.setIncomeAndRegenerate, { income: 5000, month: 10, year: 2026 })
    await alice.mutation(api.users.ensure, {}) // second sign-in

    const me = await alice.query(api.users.me, {})
    expect(me).toMatchObject({ name: 'Alice', email: 'alice@example.com', monthly_pocket_money: 5000 })
  })

  test('setIncomeAndRegenerate writes one 50/30/20 plan per month', async () => {
    const { alice } = setup()
    await alice.mutation(api.budget.setIncomeAndRegenerate, { income: 5000, month: 10, year: 2026 })
    await alice.mutation(api.budget.setIncomeAndRegenerate, { income: 8000, month: 10, year: 2026 })

    const plan = await alice.query(api.budget.get, { month: 10, year: 2026 })
    expect(plan).toMatchObject({ needs_amount: 4000, wants_amount: 2400, savings_amount: 1600 })
    await alice.run(async (ctx) => {
      expect(await ctx.db.query('budget_plans').collect()).toHaveLength(1)
    })
  })

  test('ensureForPeriod only creates a plan once income is set', async () => {
    const { alice } = setup()
    await alice.mutation(api.users.ensure, {})
    expect(await alice.mutation(api.budget.ensureForPeriod, { month: 11, year: 2026 })).toBeNull()

    await alice.mutation(api.budget.setIncomeAndRegenerate, { income: 6000, month: 10, year: 2026 })
    await alice.mutation(api.budget.ensureForPeriod, { month: 11, year: 2026 })
    expect(await alice.query(api.budget.get, { month: 11, year: 2026 })).toMatchObject({ savings_amount: 1200 })
  })

  test('rejects invalid income and periods', async () => {
    const { alice } = setup()
    await expect(alice.mutation(api.budget.setIncomeAndRegenerate, { income: -1, month: 10, year: 2026 })).rejects.toThrow()
    await expect(alice.mutation(api.budget.setIncomeAndRegenerate, { income: 5000, month: 13, year: 2026 })).rejects.toThrow()
  })
})

describe('transactions', () => {
  test('validates amount, date and category', async () => {
    const { alice } = setup()
    await expect(alice.mutation(api.transactions.add, { ...expense, amount: 0 })).rejects.toThrow(/Amount/)
    await expect(alice.mutation(api.transactions.add, { ...expense, amount: Number.NaN })).rejects.toThrow(/Amount/)
    await expect(alice.mutation(api.transactions.add, { ...expense, date: '05/10/2026' })).rejects.toThrow(/Date/)
    await expect(alice.mutation(api.transactions.add, { ...expense, category: 'pocket_money' })).rejects.toThrow(/category/)
  })

  test('lists newest first and is not capped at 500 rows', async () => {
    const { alice } = setup()
    await alice.run(async (ctx) => {
      for (let i = 0; i < 520; i++) {
        await ctx.db.insert('transactions', {
          firebase_uid: 'uid-alice', type: 'income', amount: 1, category: 'gift',
          date: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`, created_at: i,
        })
      }
    })
    await alice.mutation(api.transactions.add, { ...expense, date: '2026-10-05' })
    const list = await alice.query(api.transactions.list, {})
    expect(list).toHaveLength(521)
    expect(list[0].date).toBe('2026-10-05')
  })
})

describe('goals', () => {
  test('addSavings increments on the server', async () => {
    const { alice } = setup()
    const goal = await alice.mutation(api.goals.create, { name: '  Trip  ', target_amount: 10000, emoji: '✈️' })
    await Promise.all([
      alice.mutation(api.goals.addSavings, { id: goal._id, amount: 300 }),
      alice.mutation(api.goals.addSavings, { id: goal._id, amount: 200 }),
    ])
    const [saved] = await alice.query(api.goals.list, {})
    expect(saved).toMatchObject({ name: 'Trip', saved_amount: 500 })
  })
})

describe('emi', () => {
  test('save recomputes EMI and affordability from the stored income', async () => {
    const { alice } = setup()
    await alice.mutation(api.budget.setIncomeAndRegenerate, { income: 10000, month: 10, year: 2026 })
    const calc = await alice.mutation(api.emi.save, { principal: 12000, interest_rate: 0, tenure_months: 12 })
    expect(calc.monthly_emi).toBe(1000)
    expect(calc.affordability_score).toBe(82) // 10% of income → 100 - 0.1*180
    expect(await alice.query(api.emi.history, {})).toHaveLength(1)
  })
})

describe('advisor', () => {
  afterEach(() => {
    delete process.env.ADVISOR_HOURLY_LIMIT
  })

  test('builds context from the caller’s own data', async () => {
    const { alice, bob } = setup()
    await alice.mutation(api.budget.setIncomeAndRegenerate, { income: 5000, month: 10, year: 2026 })
    await alice.mutation(api.transactions.add, { ...expense, amount: 1200, date: '2026-10-02' })
    await alice.mutation(api.transactions.add, { ...expense, amount: 999, date: '2026-09-30' }) // last month
    await bob.mutation(api.transactions.add, { ...expense, amount: 777 })

    const res = await alice.mutation(api.advisor.beginChat, { today: '2026-10-18' })
    expect(res.allowed).toBe(true)
    if (!res.allowed) return
    expect(res.context).toContain('Monthly pocket money: ₹5000')
    expect(res.context).toContain('Spent so far this month (as of 2026-10-18): ₹1200')
    expect(res.context).not.toContain('999')
    expect(res.context).not.toContain('777')
  })

  test('enforces the hourly quota', async () => {
    process.env.ADVISOR_HOURLY_LIMIT = '2'
    const { alice } = setup()
    expect((await alice.mutation(api.advisor.beginChat, { today: '2026-10-18' })).allowed).toBe(true)
    expect((await alice.mutation(api.advisor.beginChat, { today: '2026-10-18' })).allowed).toBe(true)
    const third = await alice.mutation(api.advisor.beginChat, { today: '2026-10-18' })
    expect(third).toMatchObject({ allowed: false })
  })
})
