import { mutation, query } from './_generated/server'
import { getOrCreateProfile, getProfile, getUid } from './helpers'

// ─── Queries ──────────────────────────────────────────────────────────────────

export const me = query({
  args: {},
  handler: async (ctx) => {
    const uid = await getUid(ctx)
    if (!uid) return null
    return await getProfile(ctx, uid)
  },
})

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Called once per session. Creates the profile on first sign-in and fills in a
 * missing name/email — but never touches monthly_pocket_money, so signing in
 * again no longer resets the user's income to 0.
 */
export const ensure = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = (await ctx.auth.getUserIdentity())!
    const profile = await getOrCreateProfile(ctx)
    const patch: { name?: string; email?: string } = {}
    if (!profile.name && identity.name) patch.name = identity.name
    if (!profile.email && identity.email) patch.email = identity.email
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(profile._id, { ...patch, updated_at: Date.now() })
    }
    return profile._id
  },
})
