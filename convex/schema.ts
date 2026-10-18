import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

/**
 * Mirrors the old Supabase tables (supabase/schema.sql) so data can be
 * imported 1:1. `firebase_uid` is the owner key on every table and always
 * comes from the verified Firebase ID token (ctx.auth), never from args.
 * Timestamps are epoch milliseconds.
 */
export default defineSchema({
  users: defineTable({
    firebase_uid: v.string(),
    name: v.union(v.string(), v.null()),
    email: v.union(v.string(), v.null()),
    college: v.union(v.string(), v.null()),
    monthly_pocket_money: v.number(),
    created_at: v.number(),
    updated_at: v.number(),
  }).index('by_firebase_uid', ['firebase_uid']),

  transactions: defineTable({
    firebase_uid: v.string(),
    type: v.union(v.literal('income'), v.literal('expense')),
    amount: v.number(),
    category: v.string(),
    description: v.optional(v.string()),
    /** Calendar date as YYYY-MM-DD (no timezone). */
    date: v.string(),
    created_at: v.number(),
  }).index('by_user_date', ['firebase_uid', 'date']),

  budget_plans: defineTable({
    firebase_uid: v.string(),
    month: v.number(),
    year: v.number(),
    needs_amount: v.number(),
    wants_amount: v.number(),
    savings_amount: v.number(),
    created_at: v.number(),
  }).index('by_user_period', ['firebase_uid', 'year', 'month']),

  goals: defineTable({
    firebase_uid: v.string(),
    name: v.string(),
    target_amount: v.number(),
    saved_amount: v.number(),
    target_date: v.optional(v.string()),
    emoji: v.string(),
    created_at: v.number(),
  }).index('by_user', ['firebase_uid', 'created_at']),

  emi_calculations: defineTable({
    firebase_uid: v.string(),
    item_name: v.optional(v.string()),
    principal: v.number(),
    interest_rate: v.number(),
    tenure_months: v.number(),
    monthly_emi: v.number(),
    total_cost: v.number(),
    affordability_score: v.number(),
    created_at: v.number(),
  }).index('by_user', ['firebase_uid', 'created_at']),

  /** Fixed-window counters used to cap AI advisor usage per user. */
  rate_limits: defineTable({
    key: v.string(),
    window_start: v.number(),
    count: v.number(),
  }).index('by_key', ['key']),
})
