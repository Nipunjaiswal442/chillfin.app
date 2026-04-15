-- ─────────────────────────────────────────────────────────────────────
-- ChillFin — Row Level Security (Production)
-- Run this in: Supabase Dashboard → SQL Editor
--
-- ARCHITECTURE:
--   The app uses Firebase for auth and Supabase for storage.
--   All DB writes go through Next.js API routes that:
--     1. Verify the Firebase ID token (Firebase Admin SDK)
--     2. Query Supabase using the service_role key (bypasses RLS)
--   The anon key is NO LONGER used for any data operations.
--
-- WHY WE STILL ENABLE RLS:
--   Defence-in-depth. Even if a bug exposed the anon key, RLS blocks
--   direct table access since no anon-permissive policies exist.
-- ─────────────────────────────────────────────────────────────────────

-- ─── Step 1: Enable RLS on all tables ─────────────────────────────────

ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_plans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emi_calculations    ENABLE ROW LEVEL SECURITY;

-- ─── Step 2: Drop any old permissive/fallback policies ────────────────

DROP POLICY IF EXISTS "anon_access_users"            ON public.users;
DROP POLICY IF EXISTS "anon_access_transactions"     ON public.transactions;
DROP POLICY IF EXISTS "anon_access_budget_plans"     ON public.budget_plans;
DROP POLICY IF EXISTS "anon_access_goals"            ON public.goals;
DROP POLICY IF EXISTS "anon_access_emi_calculations" ON public.emi_calculations;

DROP POLICY IF EXISTS "users_own_data"            ON public.users;
DROP POLICY IF EXISTS "transactions_own_data"     ON public.transactions;
DROP POLICY IF EXISTS "budget_plans_own_data"     ON public.budget_plans;
DROP POLICY IF EXISTS "goals_own_data"            ON public.goals;
DROP POLICY IF EXISTS "emi_own_data"              ON public.emi_calculations;

-- ─── Step 3: No anon policies — service_role bypasses RLS ─────────────
--
-- The service_role key used by our API routes automatically bypasses
-- ALL Row Level Security policies. No policies are needed. Any direct
-- request using the anon/public key will be BLOCKED by default (RLS
-- denies all access when no matching policy exists).
--
-- This gives us defence-in-depth:
--   • API routes (service_role) → always works ✓
--   • Direct anon key access    → blocked by RLS ✓
--   • Anyone without a key      → blocked by Supabase auth ✓

-- ─── Verification ──────────────────────────────────────────────────────
-- Run after applying to confirm RLS is enabled on all tables:
--
--   SELECT tablename, rowsecurity
--   FROM pg_tables
--   WHERE schemaname = 'public'
--   ORDER BY tablename;
--
-- All 5 tables should show rowsecurity = true.
-- Policy list should be empty (no anon policies).
