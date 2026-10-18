import { ConvexError, v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { assertAmount, assertISODate, assertMaxLength, getUid, requireUid } from './helpers'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../lib/utils'

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * All of the caller's transactions, newest first. Returning the full history
 * (instead of the old 500-row cap) keeps all-time balance and totals correct.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const uid = await getUid(ctx)
    if (!uid) return []
    return await ctx.db
      .query('transactions')
      .withIndex('by_user_date', (q) => q.eq('firebase_uid', uid))
      .order('desc')
      .collect()
  },
})

// ─── Mutations ────────────────────────────────────────────────────────────────

export const add = mutation({
  args: {
    type: v.union(v.literal('income'), v.literal('expense')),
    amount: v.number(),
    category: v.string(),
    description: v.optional(v.string()),
    date: v.string(),
  },
  handler: async (ctx, { type, amount, category, description, date }) => {
    const uid = await requireUid(ctx)
    assertAmount(amount, 'Amount')
    assertISODate(date, 'Date')
    const allowed = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
    if (!allowed.some((c) => c.value === category)) throw new ConvexError('Unknown category')
    const desc = description?.trim()
    if (desc) assertMaxLength(desc, 'Description', 200)

    const id = await ctx.db.insert('transactions', {
      firebase_uid: uid,
      type,
      amount,
      category,
      description: desc || undefined,
      date,
      created_at: Date.now(),
    })
    return (await ctx.db.get(id))!
  },
})

export const remove = mutation({
  args: { id: v.id('transactions') },
  handler: async (ctx, { id }) => {
    const uid = await requireUid(ctx)
    const tx = await ctx.db.get(id)
    if (!tx || tx.firebase_uid !== uid) throw new ConvexError('Transaction not found')
    await ctx.db.delete(id)
  },
})
