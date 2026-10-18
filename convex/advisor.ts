import { v } from 'convex/values'
import { mutation, MutationCtx } from './_generated/server'
import { assertISODate, getProfile, requireUid } from './helpers'
import { getCategoryLabel } from '../lib/utils'

const WINDOW_MS = 60 * 60 * 1000

/** Plain rupee formatting (no Intl) so it behaves the same in every runtime. */
const inr = (n: number) => `₹${Math.round(n)}`

/** Fixed-window counter: returns minutes until reset when the limit is hit, else 0. */
async function consumeQuota(ctx: MutationCtx, key: string, limit: number): Promise<number> {
  const now = Date.now()
  const bucket = await ctx.db
    .query('rate_limits')
    .withIndex('by_key', (q) => q.eq('key', key))
    .unique()
  if (!bucket) {
    await ctx.db.insert('rate_limits', { key, window_start: now, count: 1 })
    return 0
  }
  if (now - bucket.window_start >= WINDOW_MS) {
    await ctx.db.patch(bucket._id, { window_start: now, count: 1 })
    return 0
  }
  if (bucket.count >= limit) {
    return Math.max(1, Math.ceil((bucket.window_start + WINDOW_MS - now) / 60_000))
  }
  await ctx.db.patch(bucket._id, { count: bucket.count + 1 })
  return 0
}

/** Compact, server-trusted summary of the user's finances for the system prompt. */
async function buildContext(ctx: MutationCtx, uid: string, today: string): Promise<string> {
  const ym = today.slice(0, 7)
  const [year, month] = ym.split('-').map(Number)

  const profile = await getProfile(ctx, uid)
  const plan = await ctx.db
    .query('budget_plans')
    .withIndex('by_user_period', (q) => q.eq('firebase_uid', uid).eq('year', year).eq('month', month))
    .unique()
  const monthTx = await ctx.db
    .query('transactions')
    .withIndex('by_user_date', (q) => q.eq('firebase_uid', uid).gte('date', `${ym}-01`).lte('date', `${ym}-31`))
    .collect()
  const goals = await ctx.db
    .query('goals')
    .withIndex('by_user', (q) => q.eq('firebase_uid', uid))
    .take(5)

  const lines: string[] = []
  const income = profile?.monthly_pocket_money ?? 0
  lines.push(income > 0 ? `Monthly pocket money: ${inr(income)}` : 'Monthly pocket money: not set yet')
  if (plan) {
    lines.push(`This month's 50/30/20 plan: needs ${inr(plan.needs_amount)}, wants ${inr(plan.wants_amount)}, savings ${inr(plan.savings_amount)}`)
  }

  const byCategory = new Map<string, number>()
  let spent = 0
  let earned = 0
  for (const t of monthTx) {
    if (t.type === 'expense') {
      spent += t.amount
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount)
    } else {
      earned += t.amount
    }
  }
  const top = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([c, amt]) => `${getCategoryLabel(c)} ${inr(amt)}`)
    .join(', ')
  lines.push(`Spent so far this month (as of ${today}): ${inr(spent)}${top ? ` — ${top}` : ''}`)
  if (earned > 0) lines.push(`Income logged this month: ${inr(earned)}`)

  if (goals.length > 0) {
    const g = goals
      .map((x) => `${x.name} ${inr(x.saved_amount)} of ${inr(x.target_amount)}${x.target_date ? ` by ${x.target_date}` : ''}`)
      .join('; ')
    lines.push(`Savings goals: ${g}`)
  }
  return lines.join('\n')
}

/**
 * Called by /api/advisor before each LLM request: authenticates the caller via
 * their Firebase ID token, enforces the hourly quota, and returns context.
 */
export const beginChat = mutation({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const uid = await requireUid(ctx)
    assertISODate(today, 'today')
    const limit = Number(process.env.ADVISOR_HOURLY_LIMIT ?? 30)
    const retryAfterMinutes = await consumeQuota(ctx, `advisor:${uid}`, limit)
    if (retryAfterMinutes > 0) return { allowed: false as const, retryAfterMinutes }
    return { allowed: true as const, context: await buildContext(ctx, uid, today) }
  },
})
