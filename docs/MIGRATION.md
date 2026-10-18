# Migration runbook: Supabase + Netlify → Convex + Vercel

This branch already contains the code side of the migration. This runbook covers what has to happen in the dashboards, and moving the data.

> **Status of verification:** the Convex functions, the export script and the advisor route are covered by automated tests (`npm test`). I could **not** run anything against a real Convex deployment from the environment where this was built, because `api.convex.dev` was blocked by that environment's network policy. Step 2 below (a rehearsal on the dev deployment) is therefore the first end-to-end check. Don't skip it.

## What changes

```
Before:  Browser ─► Next.js on Netlify ─► /api/* (firebase-admin verifies token) ─► Supabase (service-role key)
After:   Browser ◄─websocket─► Convex  (Convex verifies the Firebase ID token itself)
         Browser ─► Vercel /api/advisor ─► Convex (auth + quota + context) ─► LLM provider
```

- **Auth stays on Firebase.** Users keep their Google sign-in and UIDs, so imported rows match up automatically.
- **No more server secrets for data access.** `SUPABASE_SERVICE_ROLE_KEY` and `FIREBASE_ADMIN_SERVICE_ACCOUNT` are gone.
- **Data is live.** Pages update automatically when data changes, in any tab and on any device.

## Prerequisites

- A Convex account (https://dashboard.convex.dev) and a Vercel account linked to GitHub.
- Access to the Firebase project (unchanged) and to the Supabase project `chillfin`.
- ⚠️ **The Supabase project is currently paused** (status `INACTIVE` when checked on 2026-10-18). Restore it from the Supabase dashboard before exporting. If the dashboard no longer offers a restore, download a backup from *Database → Backups* instead. I don't know the current time limit Supabase applies to restoring paused free-tier projects, so check soon.
- ⚠️ **Netlify is still connected to this repo** and builds every push and PR. **Before merging this branch into `main`:**
  - On Netlify's *Deploys* page, lock the current production deploy (*Lock to stop auto publishing*) so the merge can't overwrite your rollback.
  - Then stop builds (*Site configuration → Build & deploy → Stop builds*).

  Netlify's deploy previews of this branch will show the "`NEXT_PUBLIC_CONVEX_URL` is not set" page. That's expected, because Netlify never runs `convex deploy`.

## Step 1: create the Convex project (dev)

```bash
npm install
npx convex dev            # log in, create project "chillfin"; writes .env.local and regenerates convex/_generated
npx convex env set FIREBASE_PROJECT_ID <your-firebase-project-id>
```

Keep `npx convex dev` running in one terminal and `npm run dev` in another. Sign in at http://localhost:3000. Your profile is created on first load.

> `convex/_generated/` in this branch was generated offline from the Convex CLI's own templates. `npx convex dev` will regenerate it, and the result should be identical or only reformatted. Commit it if it changes.

## Step 2: rehearse the data migration on dev

```bash
# 1. Export from Supabase (service-role key: Supabase → Project Settings → API)
SUPABASE_URL=https://nwylocmilmlteuzpkobs.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service_role key> \
  node scripts/supabase-to-convex.mjs            # writes ./migration-data/*.jsonl (gitignored)

# 2. Import into the dev deployment (skip tables with 0 rows)
npx convex import --table users            migration-data/users.jsonl
npx convex import --table transactions     migration-data/transactions.jsonl
npx convex import --table budget_plans     migration-data/budget_plans.jsonl
npx convex import --table goals            migration-data/goals.jsonl
npx convex import --table emi_calculations migration-data/emi_calculations.jsonl

# 3. Verify: must equal the "Source stats" the export printed
npx convex run migration:stats
```

Then sign in locally with an existing account and check the following: income, budget, goals, transaction history and EMI history are all present. Add and delete a transaction. Re-running an import needs `--replace`.

The script maps every column 1:1. It converts timestamps to epoch milliseconds and turns `NULL` optional fields into absent fields. It **skips** unusable rows (a transaction with no amount, a goal with no target, an EMI with no principal or tenure) and prints how many it skipped.

## Step 3: production Convex deployment and deploy keys

```bash
npx convex deploy                                  # pushes schema + functions to prod
npx convex env set FIREBASE_PROJECT_ID <id> --prod
```

In the Convex dashboard, open *Project Settings*:

- **Deploy keys:** generate a **Production** deploy key and a **Preview** deploy key.
- **Preview environment variables:** also set `FIREBASE_PROJECT_ID` as a default environment variable for preview deployments, if your dashboard offers that. Otherwise sign-in won't work on preview URLs.

## Step 4: Vercel project

1. In Vercel, choose **Add New → Project** and import `Nipunjaiswal442/chillfin.app`. The framework is detected as Next.js, and the build command comes from `vercel.json` (`npx convex deploy --cmd 'npm run build' --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL`). Don't override it in the dashboard.
2. Add the environment variables (*Settings → Environment Variables*):

   | Name | Environment | Value |
   |---|---|---|
   | `CONVEX_DEPLOY_KEY` | Production | Convex **production** deploy key |
   | `CONVEX_DEPLOY_KEY` | Preview | Convex **preview** deploy key (each branch gets its own isolated Convex deployment) |
   | `NEXT_PUBLIC_FIREBASE_*` (7 vars) | All | Same values as on Netlify |
   | `LLM_API_KEY` | Production, Preview | Your NVIDIA NIM key (see [LLM.md](./LLM.md)) |
   | `LLM_MODEL`, `LLM_BASE_URL` | Optional | Only to change model or provider |

   Don't add `NEXT_PUBLIC_CONVEX_URL`, because `convex deploy` injects it at build time. Don't add `SUPABASE_*`, `NVIDIA_API_KEY` (unless you prefer the old name) or `FIREBASE_ADMIN_SERVICE_ACCOUNT` either.
3. Deploy. The Node version comes from `package.json` → `engines.node` (`22.x`).

## Step 5: Firebase authorized domains

In Firebase Console → *Authentication → Settings → Authorized domains*, add `<project>.vercel.app` and your custom domain. If you skip this, Google sign-in fails with `auth/unauthorized-domain`. Preview URLs are unique per deployment, so add the specific ones you want to test sign-in on.

## Step 6: cutover

0. Lock Netlify's production deploy and stop its builds (see Prerequisites), then merge this branch into `main`. Vercel builds production from `main`.
1. With Supabase restored, run the Step 2 export again. Then import with `--prod` (and `--replace` if you rehearsed against prod):
   `npx convex import --prod --table users migration-data/users.jsonl` …
2. Verify with `npx convex run migration:stats --prod`. It must match the export's source stats.
3. Smoke-test on the `*.vercel.app` URL:
   - sign in with an existing account and check that the data is there
   - add and delete a transaction
   - add savings to a goal and check that Overview updates
   - ask the AI advisor a question
4. Move the custom domain: Vercel → *Settings → Domains → Add*, then update DNS as Vercel instructs. If the domain uses Netlify DNS, move the records or nameservers off Netlify first.
5. Delete `migration-data/`. It contains users' personal financial data.

## Step 7: decommission and rotate secrets

- **Netlify:** keep the old site for about 2 weeks as a rollback, then delete it.
- **Supabase:** take a final backup, then delete the project. See the note in [AUDIT.md](./AUDIT.md) about the anon key that older builds shipped to browsers.
- **Firebase Admin service-account key:** no longer used. Delete it in Google Cloud Console → *IAM → Service Accounts → firebase-adminsdk-… → Keys*.
- **NVIDIA key:** rotate it if it was ever pasted anywhere other than the hosting provider's environment variables.
- Optional cleanup once you're confident: remove `supabase/`, `scripts/supabase-to-convex.mjs` and `convex/migration.ts`.

## Rollback

- **Before the DNS move:** nothing to roll back. The old Netlify site keeps working as long as Supabase is active and its production deploy is locked (otherwise merging this branch would replace it).
- **After the DNS move:** point DNS back to Netlify and keep Supabase active. Any writes made in Convex after cutover would need manual reconciliation, which is why the cutover window should be short.

## How the pipeline works after migration

| Event | What runs |
|---|---|
| Pull request | GitHub Actions CI (`.github/workflows/ci.yml`: lint, typecheck, tests, build) **and** a Vercel preview that runs `convex deploy` to an isolated Convex preview deployment |
| Merge to `main` | Vercel production build. `npx convex deploy` pushes schema and functions to Convex prod first. It **fails the build** if the schema doesn't match existing data, so a bad schema can't reach users. Then `next build` runs with the prod `NEXT_PUBLIC_CONVEX_URL`. |

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Page says "`NEXT_PUBLIC_CONVEX_URL` is not set" | The build didn't go through `convex deploy`. Check that no Build Command override is set in Vercel. |
| Signed in, but the dashboard stays empty and Convex logs show token verification errors | `FIREBASE_PROJECT_ID` is missing or wrong on that Convex deployment |
| Vercel build fails at `convex deploy` | `CONVEX_DEPLOY_KEY` is missing for that environment (Production vs Preview) |
| `npx convex import` refuses: table not empty | Add `--replace` (overwrites) or `--append` |
| Google sign-in popup closes with `auth/unauthorized-domain` | Step 5 |
