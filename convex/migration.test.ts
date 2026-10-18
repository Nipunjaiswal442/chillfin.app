// @vitest-environment edge-runtime
/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import schema from './schema'
import { internal } from './_generated/api'
import { TABLES, stats, transforms } from '../scripts/supabase-to-convex.mjs'

const modules = import.meta.glob('./**/*.ts')

// Rows as PostgREST returns them: NUMERIC may arrive as strings, nullable columns as null
const supabaseRows: Record<string, Record<string, unknown>[]> = {
  users: [
    { id: 'u1', firebase_uid: 'uid-a', name: 'Asha', email: 'a@x.in', college: null, monthly_pocket_money: '5000.00', created_at: '2026-04-05T10:00:00+00:00', updated_at: null },
  ],
  transactions: [
    { id: 't1', firebase_uid: 'uid-a', type: 'expense', amount: '120.50', category: 'food', description: null, date: '2026-04-06', created_at: '2026-04-06T08:00:00+00:00' },
    { id: 't2', firebase_uid: 'uid-a', type: 'income', amount: 5000, category: 'pocket_money', description: 'April', date: '2026-04-01', created_at: '2026-04-01T08:00:00+00:00' },
    { id: 't3', firebase_uid: 'uid-a', type: 'expense', amount: null, category: 'misc', description: null, date: '2026-04-07', created_at: '2026-04-07T08:00:00+00:00' },
  ],
  budget_plans: [
    { id: 'b1', firebase_uid: 'uid-a', month: 4, year: 2026, needs_amount: '2500.00', wants_amount: '1500.00', savings_amount: '1000.00', created_at: '2026-04-05T10:00:00+00:00' },
  ],
  goals: [
    { id: 'g1', firebase_uid: 'uid-a', name: 'Laptop', target_amount: '60000.00', saved_amount: '1500.00', target_date: null, emoji: '💻', created_at: '2026-04-05T10:00:00+00:00' },
  ],
  emi_calculations: [
    { id: 'e1', firebase_uid: 'uid-a', item_name: null, principal: '20000.00', interest_rate: '12.00', tenure_months: 12, monthly_emi: '1776.98', total_cost: '21323.76', affordability_score: 36, created_at: '2026-04-05T10:00:00+00:00' },
  ],
}

test('transformed Supabase rows satisfy the Convex schema and stats match', async () => {
  const t = convexTest(schema, modules)
  const docsByTable: Record<string, Record<string, unknown>[]> = {}
  for (const table of TABLES) {
    docsByTable[table] = supabaseRows[table].map((r) => (transforms as Record<string, (r: unknown) => unknown>)[table](r)).filter(Boolean) as Record<string, unknown>[]
  }
  expect(docsByTable.transactions).toHaveLength(2) // row with null amount skipped

  // convex-test validates every insert against the schema
  await t.run(async (ctx) => {
    for (const table of TABLES) {
      for (const doc of docsByTable[table]) await ctx.db.insert(table as never, doc as never)
    }
  })

  const imported = await t.query(internal.migration.stats, {})
  expect(imported).toEqual(stats(docsByTable))
  expect(imported).toMatchObject({ totalIncome: 5000, totalExpense: 120.5, totalGoalSavings: 1500 })
})
