import { ConvexError, v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { assertAmount, assertMaxLength, getProfile, getUid, requireUid } from './helpers'
import { calculateAffordabilityScore, calculateEMI } from '../lib/utils'

// ─── Queries ──────────────────────────────────────────────────────────────────

/** The caller's 10 most recent EMI calculations. */
export const history = query({
  args: {},
  handler: async (ctx) => {
    const uid = await getUid(ctx)
    if (!uid) return []
    return await ctx.db
      .query('emi_calculations')
      .withIndex('by_user', (q) => q.eq('firebase_uid', uid))
      .order('desc')
      .take(10)
  },
})

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Saves a calculation. EMI and affordability are recomputed here, not trusted from the client. */
export const save = mutation({
  args: {
    item_name: v.optional(v.string()),
    principal: v.number(),
    interest_rate: v.number(),
    tenure_months: v.number(),
  },
  handler: async (ctx, { item_name, principal, interest_rate, tenure_months }) => {
    const uid = await requireUid(ctx)
    assertAmount(principal, 'Loan amount')
    if (!Number.isFinite(interest_rate) || interest_rate < 0 || interest_rate > 100) {
      throw new ConvexError('Interest rate must be between 0% and 100%')
    }
    if (!Number.isInteger(tenure_months) || tenure_months < 1 || tenure_months > 600) {
      throw new ConvexError('Tenure must be between 1 and 600 months')
    }
    const name = item_name?.trim()
    if (name) assertMaxLength(name, 'Item name', 60)

    const profile = await getProfile(ctx, uid)
    const { monthlyEMI, totalCost } = calculateEMI(principal, interest_rate, tenure_months)
    const id = await ctx.db.insert('emi_calculations', {
      firebase_uid: uid,
      item_name: name || undefined,
      principal,
      interest_rate,
      tenure_months,
      monthly_emi: monthlyEMI,
      total_cost: totalCost,
      affordability_score: calculateAffordabilityScore(monthlyEMI, profile?.monthly_pocket_money ?? 0),
      created_at: Date.now(),
    })
    return (await ctx.db.get(id))!
  },
})
