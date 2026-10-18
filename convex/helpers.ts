import { ConvexError } from 'convex/values'
import { MutationCtx, QueryCtx } from './_generated/server'

// ─── Auth ─────────────────────────────────────────────────────────────────────

/** Firebase UID of the caller, or null when the request has no valid ID token. */
export async function getUid(ctx: QueryCtx | MutationCtx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity()
  return identity?.subject ?? null
}

export async function requireUid(ctx: QueryCtx | MutationCtx): Promise<string> {
  const uid = await getUid(ctx)
  if (!uid) throw new ConvexError('Not signed in')
  return uid
}

export async function getProfile(ctx: QueryCtx | MutationCtx, uid: string) {
  return await ctx.db
    .query('users')
    .withIndex('by_firebase_uid', (q) => q.eq('firebase_uid', uid))
    .unique()
}

/** Returns the caller's profile, creating it from the token's name/email if missing. */
export async function getOrCreateProfile(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new ConvexError('Not signed in')
  const existing = await getProfile(ctx, identity.subject)
  if (existing) return existing
  const now = Date.now()
  const id = await ctx.db.insert('users', {
    firebase_uid: identity.subject,
    name: identity.name ?? null,
    email: identity.email ?? null,
    college: null,
    monthly_pocket_money: 0,
    created_at: now,
    updated_at: now,
  })
  return (await ctx.db.get(id))!
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** Matches the old NUMERIC(10,2) column limit. */
export const MAX_AMOUNT = 99_999_999

export function assertAmount(value: number, label: string, { allowZero = false } = {}) {
  const tooSmall = allowZero ? value < 0 : value <= 0
  if (!Number.isFinite(value) || tooSmall || value > MAX_AMOUNT) {
    throw new ConvexError(`${label} must be a positive amount up to ₹9,99,99,999`)
  }
}

export function assertMaxLength(value: string, label: string, max: number) {
  if (value.length > max) throw new ConvexError(`${label} must be at most ${max} characters`)
}

export function assertISODate(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new ConvexError(`${label} must be a date in YYYY-MM-DD format`)
  }
}

export function assertPeriod(month: number, year: number) {
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new ConvexError('Invalid month or year')
  }
}
