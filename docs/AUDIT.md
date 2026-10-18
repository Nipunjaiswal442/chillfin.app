# ChillFin audit (2026-10-18)

A review of the app as of commit `92acdf3`, the state before this branch. File and line references point at that commit unless noted.

**How each finding was established:**
- **Reproduced:** demonstrated by running code.
- **Read:** follows directly from the code.
- **Inferred:** likely but unconfirmed.
- **Checked live:** queried from the Supabase project.

**Status:**
- ✅ fixed in this branch
- ⚠️ needs your action
- 📝 open recommendation

## Critical / high

| # | Finding | Evidence | Status |
|---|---|---|---|
| 1 | **The production database is paused.** The Supabase project `chillfin` reports status `INACTIVE`, so every data API in the live app is failing. | Checked live | ⚠️ Restore it to export data ([MIGRATION.md](./MIGRATION.md)) |
| 2 | **Possible exposure of all user data.** Until `92acdf3`, the browser queried Supabase directly with the anon key (e.g. `hooks/useTransactions.ts` at `62da89c`), so that key is in old JS bundles. `supabase/schema.sql:94-98` *disables* RLS, and the README calls `rls_migration.sql` "optional". If RLS was never enabled in production, anyone holding that key could read and write every user's transactions, goals and profile. I couldn't confirm the RLS state because the project is paused. | Read; RLS state unverified | ⚠️ When restoring, run `select tablename, rowsecurity from pg_tables where schemaname='public'`. If any table shows `false`, assume the data was exposed and consider your obligations under the DPDP Act. Deleting the Supabase project after migration removes the risk. |
| 3 | **Next.js 14.2.29 had 29 known advisories**, including 2 critical RCEs (Image Optimization API, Windows hosting) fixed only in 15.5.24+. | `npm audit` | ✅ Upgraded to Next 15.5.27 / React 19. `npm audit --omit=dev`: 33 vulnerabilities (3 critical) → 6 (0 critical). The remaining 6 are unused Firestore gRPC code and build-time PostCSS. |
| 4 | **Signing in reset monthly pocket money to ₹0.** Every Google sign-in POSTed `{name, email}` to `/api/user`, which upserts `monthly_pocket_money: monthly_pocket_money ?? 0` (`app/login/page.tsx:42-52`, `app/api/user/route.ts:32-44`). | Read; regression test added | ✅ |
| 5 | **Updating income wiped name, email and college to NULL.** The Budget page and Overview call `apiUpsertUser({ monthly_pocket_money })`, which upserts `name: name ?? null` and so on (`app/api/user/route.ts:37-40`). | Read | ✅ |
| 6 | **Anyone with a Google account could use your NVIDIA key as a free LLM.** There was no rate limit, `max_tokens: 8192`, and unlimited history. The client could also send `role: "system"` messages, and its free-text `userContext` was pasted into the system prompt (`app/api/advisor/route.ts:73-84`). | Read | ✅ Server-built context, system role dropped, length caps, per-user hourly quota, 2048 tokens by default |
| 7 | **The advisor said "Unauthorized: Please sign in" for any Firebase Admin failure,** including a missing or malformed `FIREBASE_ADMIN_SERVICE_ACCOUNT` (`app/api/advisor/route.ts:54-59`). After moving environments, the AI looks broken for signed-in users. This is the likely cause of "the LLM stopped working". | Read | ✅ The secret is no longer needed, and each failure has a distinct message ([LLM.md](./LLM.md)) |

## Medium

| # | Finding | Evidence | Status |
|---|---|---|---|
| 8 | Transactions were capped at 500 (`app/api/transactions/route.ts:32`). After that, Balance and "Total Income: All time" are **silently wrong**. | Read; test with 521 rows | ✅ |
| 9 | The 6-month trend chart **duplicates and skips months** on the 29th–31st, because `setMonth` overflows (`app/dashboard/page.tsx:64-73`). On Oct 31 it shows *May, Jul, Jul, Aug, Oct, Oct*. | Reproduced | ✅ |
| 10 | New transactions defaulted to the **UTC date**: before 05:30 IST the form pre-fills *yesterday* (`app/dashboard/tracker/page.tsx:31`). Month filters also parsed `YYYY-MM-DD` as UTC. | Reproduced | ✅ |
| 11 | The AI chat **dropped words** whenever an SSE line was split across network chunks (`app/dashboard/advisor/page.tsx:91-115`). For example, "Hello there! Save 20%" rendered as "Hello! Save 20%". | Reproduced; test for every split point | ✅ |
| 12 | Overview goal totals went **stale** after changes on the Goals page. The page kept its own state, and the context fetched goals only once per session. The README claims they're synced. | Read | ✅ Reactive Convex queries |
| 13 | **Failed saves were lost silently.** The Tracker modal closed and cleared the form on error. The Goals "create" swallowed errors. The EMI and Budget spinners stuck forever if a request failed. Delete failures were unhandled. | Read | ✅ |
| 14 | "Add savings" computed the new total in the browser and PATCHed the absolute value, so two tabs could lose an update. | Read | ✅ Server-side increment; concurrency test |
| 15 | No server-side validation: negative, NaN or huge amounts, any category or type string, and unbounded text were all accepted. EMI results were trusted from the client. | Read | ✅ Validated in Convex; EMI recomputed on the server |
| 16 | `npm run lint` had no ESLint config, so it opened an interactive prompt (that hangs CI). There was also 1 lint error (`app/login/page.tsx:116`). No tests, no CI. | Ran it | ✅ `.eslintrc.json`, 37 tests, GitHub Actions |
| 17 | The Firebase SDK 10 dependency tree carried critical `protobufjs` and `websocket-driver` advisories. | `npm audit` | ✅ Firebase 12 |
| 18 | `netlify.toml` turned off Netlify's secret scanner for `FIREBASE_ADMIN_SERVICE_ACCOUNT`, which is a real secret. | Read | ✅ Netlify and that secret are both removed |
| 19 | The AI's upstream request kept generating (and billing) after the student left the page. The UI greeting was sent as the first turn, which providers that require user-first conversations reject. | Read | ✅ |
| 20 | Node 20 (pinned in `netlify.toml`) reached end-of-life in April 2026. | Node release schedule | ✅ `engines.node: 22.x` |

## Low / recommendations

| # | Finding | Evidence | Status |
|---|---|---|---|
| 21 | Sign-in uses `signInWithPopup` only. Popups are often blocked in in-app browsers (Instagram, WhatsApp), and Google refuses OAuth inside embedded webviews. Students often open links there. | Inferred | 📝 Detect in-app browsers and suggest "Open in Chrome", or fall back to `signInWithRedirect` |
| 22 | The Terms checkbox on the login page is a clickable `<div>`, so keyboard and screen-reader users can't tick it. | Read | 📝 Use a real `<input type="checkbox">` |
| 23 | **Compliance:** the audience is 17–24 and the Terms allow 13+. India's DPDP Act 2023 requires verifiable parental consent for under-18s. The AI now also receives a financial summary (see [LLM.md](./LLM.md)). | Read; not legal advice | 📝 Have the Terms and onboarding reviewed |
| 24 | The depreciation calculator keeps a salvage value larger than a newly lowered cost, so book value can exceed purchase cost. | Read | 📝 Clamp salvage when cost changes |
| 25 | The portfolio calculator shows one constant-return curve, which overstates certainty. | Read | 📝 Monte Carlo range ([ML_ROADMAP.md](./ML_ROADMAP.md) #5) |
| 26 | `profile.college` is displayed but can't be set anywhere in the UI. | Read | 📝 Add a profile settings page |
| 27 | No security headers (CSP, `frame-ancestors`, `Referrer-Policy`). | Read | 📝 Add them in `next.config.js` `headers()` |
| 28 | Money is stored as floating-point numbers. That's fine for budgeting, but use integer paise if you ever do exact accounting. | Read | 📝 |
| 29 | `/favicon.ico` returned 404 because the SVG icon wasn't declared. The Sidebar avatar uses a plain `<img>` (lint warning). | Reproduced | ✅ icon declared; 📝 `<img>` left as is |
| 30 | `transactions.list` returns full history on every change. That's fine at student scale; with many thousands of rows per user, switch to pagination and stored aggregates. | Read | 📝 |
