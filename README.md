# ChillFin 💰
### The Student Financial Companion

> **Track spending. Plan budgets. Save for goals. Learn to invest.**  
> Built for Indian college students (17–24) — free, SEBI-aware, and student-first.

---

## ✨ Features

| Module | What it does |
|---|---|
| **Pocket Money Tracker** | Log income & expenses with categories, filter by type, see real-time balance |
| **Smart Budget Planner** | Auto-generated 50/30/20 budget anchored to your actual pocket money |
| **Goal Vaults** | Save toward named goals (laptop, trip, gadget) with visual progress bars |
| **EMI Advisor** | Calculate real EMI cost + affordability score (0–100) before committing |
| **Investment Portfolio** | Beginner-safe, SEBI-aligned investment options (SIP, gold, liquid funds, PPF) |
| **AI Financial Advisor** | Streaming AI chat powered by Qwen 3.5-122B — SEBI-aware, student-focused |

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) + TypeScript |
| **Auth** | Firebase Auth (Google OAuth) |
| **Database** | Supabase (PostgreSQL) |
| **AI** | NVIDIA NIM — Qwen 3.5-122B (SSE streaming) |
| **Styling** | Tailwind CSS with custom design tokens |
| **Deployment** | Netlify (`@netlify/plugin-nextjs`) |
| **Icons** | Lucide React |
| **Fonts** | Playfair Display · DM Sans · JetBrains Mono |

---

## 🏗️ Architecture

```
Browser → Next.js App (Netlify)
              ├── Firebase Auth (Google Sign-In)
              ├── Supabase (PostgreSQL) ← direct client + API routes
              └── /api/advisor → NVIDIA NIM (Qwen 3.5-122B) → SSE stream
```

- **Auth**: Firebase UID is the universal foreign key across all Supabase tables  
- **Security**: All API routes verify Firebase ID tokens via `firebase-admin` SDK  
- **State**: `UserContext` provides shared profile/goals/budgetPlan across dashboard  
- **Streaming AI**: Server proxies NVIDIA NIM SSE stream token-by-token to the browser  

---

## 📁 Project Structure

```
├── app/
│   ├── page.tsx                  # Public landing page
│   ├── login/                    # Google sign-in
│   ├── api/
│   │   ├── user/route.ts         # User CRUD (token-verified)
│   │   └── advisor/route.ts      # NVIDIA AI proxy (token-verified)
│   └── dashboard/
│       ├── page.tsx              # Overview — stats, budget bar, recent tx
│       ├── tracker/              # Expense / income logger
│       ├── budget/               # 50/30/20 monthly planner
│       ├── goals/                # Savings goal vaults
│       ├── emi/                  # EMI calculator + history
│       ├── portfolio/            # Investment education hub
│       └── advisor/              # AI chat interface
├── components/
│   ├── AuthGuard.tsx             # Route protection
│   ├── dashboard/Sidebar.tsx     # Responsive nav
│   └── ui/                       # Button, Input, Modal, StatCard
├── contexts/
│   └── UserContext.tsx           # Shared profile/goals/budget state
├── hooks/
│   ├── useAuth.ts                # Firebase auth state
│   └── useTransactions.ts        # Supabase CRUD + derived totals
├── lib/
│   ├── firebase.ts               # Firebase client (browser-only)
│   ├── firebase-admin.ts         # Firebase Admin SDK (server-only)
│   ├── supabase.ts               # Supabase client + DB helpers + types
│   └── utils.ts                  # EMI math, formatters, categories
└── supabase/
    ├── schema.sql                # Full DB schema + indexes
    └── rls_migration.sql         # RLS policies (run in Supabase SQL Editor)
```

---

## 🗄️ Database Schema

```sql
users           — firebase_uid (PK), name, email, college, monthly_pocket_money
transactions    — firebase_uid, type (income|expense), amount, category, date
budget_plans    — firebase_uid, month, year, needs_amount, wants_amount, savings_amount
goals           — firebase_uid, name, target_amount, saved_amount, target_date, emoji
emi_calculations — firebase_uid, principal, interest_rate, tenure_months, monthly_emi, affordability_score
```

---

## ⚙️ Local Setup

### 1. Clone & install

```bash
git clone https://github.com/Nipunjaiswal442/chillfin.app.git
cd chillfin.app
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your credentials (see [Environment Variables](#-environment-variables) below).

### 3. Set up Supabase database

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/schema.sql`
3. Optionally run `supabase/rls_migration.sql` to enable Row Level Security

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Environment Variables

Create a `.env.local` file in the root:

```env
# Firebase (get from Firebase Console → Project Settings → General)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Supabase (get from Supabase Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# NVIDIA NIM (get from build.nvidia.com)
NVIDIA_API_KEY=

# Firebase Admin SDK — SERVER ONLY, never prefix with NEXT_PUBLIC_
# Get from: Firebase Console → Project Settings → Service Accounts → Generate new private key
# Paste the entire JSON as a single-line string
FIREBASE_ADMIN_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

---

## 🚢 Deployment (Netlify)

1. Connect the repo to Netlify
2. Build command: `npm run build`  
3. Publish directory: `.next`
4. Add all environment variables from `.env.local` to **Netlify → Site → Environment Variables**
5. The `@netlify/plugin-nextjs` plugin is already configured in `netlify.toml`

> **Important:** The `FIREBASE_ADMIN_SERVICE_ACCOUNT` must be set in Netlify env vars for API token verification to work in production.

---

## 🔐 Security

- **Firebase ID tokens** are verified server-side on every API route using `firebase-admin`
- **UID is never trusted from the request body** — always sourced from the verified token
- **RLS-ready** — `supabase/rls_migration.sql` enables per-user row policies
- **`.env.local` is gitignored** — secrets never reach the repository

---

## 🤖 AI Advisor Details

- **Model:** Qwen 3.5-122B-A10B via [NVIDIA NIM](https://build.nvidia.com)
- **Streaming:** Token-by-token SSE stream proxied through `/api/advisor`
- **Context-aware:** User's monthly pocket money injected into system prompt
- **SEBI-compliant:** Never recommends specific stocks; always adds educational disclaimers
- **Thinking mode disabled** — `enable_thinking: false` for clean, direct responses

---

## 📐 Design System

| Token | Value | Usage |
|---|---|---|
| `gold` | `#D4A843` | Primary accent |
| `bg-deep` | `#0A0A0F` | Main background |
| `bg-card` | `#111118` | Card surfaces |
| `neon-white` | `#F0F0FF` | Primary text |
| `text-muted` | `#8888A0` | Secondary text |

Dark luxury / fintech aesthetic with animations: `orbFloat`, `marquee`, `fadeUp`, `coinFall`

---

## ⚠️ Disclaimer

ChillFin is an **educational tool only**. It is not a SEBI-registered investment advisor. All investment information provided is for educational purposes. Past returns do not guarantee future performance. Always consult a SEBI-registered financial advisor for personalised investment advice.

---

## 📄 License

MIT © 2025 ChillFin

---

<p align="center">
  <em>"Chill on spending. Smarter on saving. Cooler on investing."</em>
</p>
