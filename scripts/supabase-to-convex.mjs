#!/usr/bin/env node
/**
 * Exports ChillFin's Supabase tables to JSONL files shaped for Convex.
 *
 *   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/supabase-to-convex.mjs [outDir=migration-data]
 *
 * Then import each file (add --prod for the production deployment):
 *   npx convex import --table users migration-data/users.jsonl
 *   ...
 * and compare the printed stats with `npx convex run migration:stats`.
 *
 * The output contains users' personal financial data — it is gitignored;
 * delete it once the import is verified.
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const TABLES = ['users', 'transactions', 'budget_plans', 'goals', 'emi_calculations']

const ms = (ts) => (ts ? Date.parse(ts) : Date.now())
const num = (x) => (x === null || x === undefined ? null : Number(x))
/** Drops keys whose value is null/undefined (Convex optional fields must be absent, not null). */
const compact = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== undefined))

/** Maps one Supabase row to a Convex document, or null if the row is unusable. */
export const transforms = {
  users: (r) => ({
    firebase_uid: r.firebase_uid,
    name: r.name ?? null,
    email: r.email ?? null,
    college: r.college ?? null,
    monthly_pocket_money: num(r.monthly_pocket_money) ?? 0,
    created_at: ms(r.created_at),
    updated_at: ms(r.updated_at ?? r.created_at),
  }),
  transactions: (r) => {
    const amount = num(r.amount)
    if (!r.firebase_uid || !amount || !['income', 'expense'].includes(r.type)) return null
    return compact({
      firebase_uid: r.firebase_uid,
      type: r.type,
      amount,
      category: r.category || 'misc',
      description: r.description || null,
      date: String(r.date ?? r.created_at ?? new Date().toISOString()).slice(0, 10),
      created_at: ms(r.created_at),
    })
  },
  budget_plans: (r) => ({
    firebase_uid: r.firebase_uid,
    month: Number(r.month),
    year: Number(r.year),
    needs_amount: num(r.needs_amount) ?? 0,
    wants_amount: num(r.wants_amount) ?? 0,
    savings_amount: num(r.savings_amount) ?? 0,
    created_at: ms(r.created_at),
  }),
  goals: (r) => {
    const target = num(r.target_amount)
    if (!r.firebase_uid || !r.name || !target) return null
    return compact({
      firebase_uid: r.firebase_uid,
      name: r.name,
      target_amount: target,
      saved_amount: num(r.saved_amount) ?? 0,
      target_date: r.target_date || null,
      emoji: r.emoji || '🎯',
      created_at: ms(r.created_at),
    })
  },
  emi_calculations: (r) => {
    const principal = num(r.principal)
    const tenure = num(r.tenure_months)
    if (!r.firebase_uid || !principal || !tenure) return null
    return compact({
      firebase_uid: r.firebase_uid,
      item_name: r.item_name || null,
      principal,
      interest_rate: num(r.interest_rate) ?? 0,
      tenure_months: tenure,
      monthly_emi: num(r.monthly_emi) ?? 0,
      total_cost: num(r.total_cost) ?? 0,
      affordability_score: num(r.affordability_score) ?? 0,
      created_at: ms(r.created_at),
    })
  },
}

/** Same shape as `npx convex run migration:stats`, for a side-by-side check. */
export function stats(docsByTable) {
  const tx = docsByTable.transactions ?? []
  const sum = (type) => Math.round(tx.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0) * 100) / 100
  return {
    counts: Object.fromEntries(TABLES.map((t) => [t, (docsByTable[t] ?? []).length])),
    totalIncome: sum('income'),
    totalExpense: sum('expense'),
    totalGoalSavings: Math.round((docsByTable.goals ?? []).reduce((s, g) => s + g.saved_amount, 0) * 100) / 100,
  }
}

async function fetchAll(baseUrl, key, table) {
  const rows = []
  const pageSize = 1000
  for (let offset = 0; ; offset += pageSize) {
    const url = `${baseUrl}/rest/v1/${table}?select=*&order=created_at.asc&limit=${pageSize}&offset=${offset}`
    const res = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
    if (!res.ok) throw new Error(`${table}: HTTP ${res.status} ${await res.text()}`)
    const page = await res.json()
    rows.push(...page)
    if (page.length < pageSize) return rows
  }
}

async function main() {
  const baseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!baseUrl || !key) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (Supabase Dashboard → Project Settings → API).')
    process.exit(1)
  }
  const outDir = path.resolve(process.argv[2] || 'migration-data')
  fs.mkdirSync(outDir, { recursive: true })

  const docsByTable = {}
  for (const table of TABLES) {
    const rows = await fetchAll(baseUrl, key, table)
    const docs = rows.map(transforms[table]).filter(Boolean)
    docsByTable[table] = docs
    fs.writeFileSync(path.join(outDir, `${table}.jsonl`), docs.map((d) => JSON.stringify(d)).join('\n') + (docs.length ? '\n' : ''))
    const skipped = rows.length - docs.length
    console.log(`${table.padEnd(17)} ${String(docs.length).padStart(6)} rows${skipped ? `  (skipped ${skipped} incomplete)` : ''}`)
  }

  console.log('\nSource stats (compare with `npx convex run migration:stats`):')
  console.log(JSON.stringify(stats(docsByTable), null, 2))
  console.log('\nImport (add --prod for production; --replace to re-run):')
  for (const table of TABLES) {
    console.log(`  npx convex import --table ${table} ${path.relative(process.cwd(), path.join(outDir, `${table}.jsonl`))}`)
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
