-- ─────────────────────────────────────────────────────────────────────
-- ChillFin — Row Level Security Migration
-- Run this in: Supabase Dashboard → SQL Editor
--
-- PREREQUISITE: You must first configure Supabase to accept Firebase JWTs:
--   1. Go to Supabase Dashboard → Authentication → JWT Settings
--   2. Set "JWT Secret" to your Firebase project's Web API Key
--      (Firebase Console → Project Settings → General → Web API Key)
--   3. Then run this SQL.
--
-- Until you complete the prerequisite, data access continues to work
-- through the anon key exactly as before. This SQL is safe to run
-- at any time; it just won't enforce per-user isolation until JWTs
-- are verified by Supabase.
-- ─────────────────────────────────────────────────────────────────────

-- ─── Step 1: Enable RLS on all tables ─────────────────────────────────

ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_plans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals               ENABLE ROW LEVEL SECURITY;
ALTER TABLE emi_calculations    ENABLE ROW LEVEL SECURITY;

-- ─── Step 2: Drop old permissive policies (if any exist) ──────────────

DROP POLICY IF EXISTS "anon_access_users"            ON users;
DROP POLICY IF EXISTS "anon_access_transactions"     ON transactions;
DROP POLICY IF EXISTS "anon_access_budget_plans"     ON budget_plans;
DROP POLICY IF EXISTS "anon_access_goals"            ON goals;
DROP POLICY IF EXISTS "anon_access_emi_calculations" ON emi_calculations;

-- ─── Step 3: Create per-user policies ─────────────────────────────────
--
-- These policies extract the Firebase UID from the JWT sub claim.
-- They only become effective after the JWT Secret is configured (Step 0).
--
-- Until the JWT is configured, Supabase treats anonymous requests as
-- having no auth() context, so the policies below won't match —
-- add the permissive fallback policies in Step 4 to maintain access.

CREATE POLICY "users_own_data" ON users
  FOR ALL USING (firebase_uid = (auth.jwt() ->> 'sub'));

CREATE POLICY "transactions_own_data" ON transactions
  FOR ALL USING (firebase_uid = (auth.jwt() ->> 'sub'));

CREATE POLICY "budget_plans_own_data" ON budget_plans
  FOR ALL USING (firebase_uid = (auth.jwt() ->> 'sub'));

CREATE POLICY "goals_own_data" ON goals
  FOR ALL USING (firebase_uid = (auth.jwt() ->> 'sub'));

CREATE POLICY "emi_own_data" ON emi_calculations
  FOR ALL USING (firebase_uid = (auth.jwt() ->> 'sub'));

-- ─── Step 4: Permissive fallback for anon key (MVP safety net) ─────────
--
-- Remove these once you've validated JWT-based access works end-to-end.
-- While these exist, authenticated users AND anonymous requests have
-- read/write access — the per-user policies above narrow it per-user.

CREATE POLICY "anon_access_users" ON users
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_access_transactions" ON transactions
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_access_budget_plans" ON budget_plans
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_access_goals" ON goals
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_access_emi_calculations" ON emi_calculations
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ─── Verification ──────────────────────────────────────────────────────
-- After running, confirm with:
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public';
-- All 5 tables should show rowsecurity = true.
