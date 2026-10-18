import { v } from 'convex/values'
import { mutation, query, MutationCtx, QueryCtx } from './_generated/server'
import { assertAmount, assertPeriod, getOrCreateProfile, getProfile, getUid, requireUid } from './helpers'
import { generateBudget } from '../lib/utils'

const period = { month: v.number(), year: v.number() }

async function findPlan(ctx: QueryCtx | MutationCtx, uid: string, month: number, year: number) {
  return await ctx.db
    .query('budget_plans')
    .withIndex('by_user_period', (q) => q.eq('firebase_uid', uid).eq('year', year).eq('month', month))
    .unique()
}

async function writePlan(ctx: MutationCtx, uid: string, month: number, year: number, income: number) {
  const amounts = generateBudget(income)
  const existing = await findPlan(ctx, uid, month, year)
  if (existing) {
    await ctx.db.patch(existing._id, amounts)
    return existing._id
  }
  return await ctx.db.insert('budget_plans', {
    firebase_uid: uid,
    month,
    year,
    ...amounts,
    created_at: Date.now(),
  })
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export const get = query({
  args: period,
  handler: async (ctx, { month, year }) => {
    const uid = await getUid(ctx)
    if (!uid) return null
    return await findPlan(ctx, uid, month, year)
  },
})

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Saves monthly pocket money and (re)generates the period's 50/30/20 plan atomically. */
export const setIncomeAndRegenerate = mutation({
  args: { income: v.number(), ...period },
  handler: async (ctx, { income, month, year }) => {
    const uid = await requireUid(ctx)
    assertAmount(income, 'Monthly income')
    assertPeriod(month, year)
    const profile = await getOrCreateProfile(ctx)
    await ctx.db.patch(profile._id, { monthly_pocket_money: income, updated_at: Date.now() })
    return await writePlan(ctx, uid, month, year, income)
  },
})

/** Creates the period's plan from the saved income if the user doesn't have one yet. */
export const ensureForPeriod = mutation({
  args: period,
  handler: async (ctx, { month, year }) => {
    const uid = await requireUid(ctx)
    assertPeriod(month, year)
    const existing = await findPlan(ctx, uid, month, year)
    if (existing) return existing._id
    const profile = await getProfile(ctx, uid)
    if (!profile || profile.monthly_pocket_money <= 0) return null
    return await writePlan(ctx, uid, month, year, profile.monthly_pocket_money)
  },
})
