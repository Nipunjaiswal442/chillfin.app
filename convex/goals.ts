import { ConvexError, v } from 'convex/values'
import { mutation, query, MutationCtx } from './_generated/server'
import { Id } from './_generated/dataModel'
import { assertAmount, assertISODate, assertMaxLength, getUid, requireUid } from './helpers'

async function getOwnGoal(ctx: MutationCtx, uid: string, id: Id<'goals'>) {
  const goal = await ctx.db.get(id)
  if (!goal || goal.firebase_uid !== uid) throw new ConvexError('Goal not found')
  return goal
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export const list = query({
  args: {},
  handler: async (ctx) => {
    const uid = await getUid(ctx)
    if (!uid) return []
    return await ctx.db
      .query('goals')
      .withIndex('by_user', (q) => q.eq('firebase_uid', uid))
      .order('asc')
      .collect()
  },
})

// ─── Mutations ────────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    name: v.string(),
    target_amount: v.number(),
    target_date: v.optional(v.string()),
    emoji: v.string(),
  },
  handler: async (ctx, { name, target_amount, target_date, emoji }) => {
    const uid = await requireUid(ctx)
    const trimmed = name.trim()
    if (!trimmed) throw new ConvexError('Goal name is required')
    assertMaxLength(trimmed, 'Goal name', 60)
    assertMaxLength(emoji, 'Emoji', 16)
    assertAmount(target_amount, 'Target amount')
    if (target_date) assertISODate(target_date, 'Target date')

    const id = await ctx.db.insert('goals', {
      firebase_uid: uid,
      name: trimmed,
      target_amount,
      saved_amount: 0,
      target_date: target_date || undefined,
      emoji: emoji || '🎯',
      created_at: Date.now(),
    })
    return (await ctx.db.get(id))!
  },
})

/** Adds to saved_amount server-side, so two tabs adding at once can't lose an update. */
export const addSavings = mutation({
  args: { id: v.id('goals'), amount: v.number() },
  handler: async (ctx, { id, amount }) => {
    const uid = await requireUid(ctx)
    assertAmount(amount, 'Amount')
    const goal = await getOwnGoal(ctx, uid, id)
    await ctx.db.patch(id, { saved_amount: goal.saved_amount + amount })
  },
})

export const remove = mutation({
  args: { id: v.id('goals') },
  handler: async (ctx, { id }) => {
    const uid = await requireUid(ctx)
    await getOwnGoal(ctx, uid, id)
    await ctx.db.delete(id)
  },
})
