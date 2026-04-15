/**
 * api-client.ts — Client-side helpers that call our secure Next.js API routes.
 *
 * All functions:
 *  1. Get a fresh Firebase ID token from the currently signed-in user.
 *  2. Send it as a Bearer token in the Authorization header.
 *  3. Call our own /api/* routes (which use the Supabase service role key server-side).
 *
 * This means Supabase's public anon key is NEVER used for data reads/writes —
 * only the server-side service role key touches the database, with RLS enabled.
 */

import { getAuth } from 'firebase/auth'

// ─── Auth header helper ───────────────────────────────────────────────────────

async function authHeader(): Promise<HeadersInit> {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) throw new Error('Not signed in')
  const token = await user.getIdToken()
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, options)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'API error')
  return json as T
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function apiGetTransactions() {
  const headers = await authHeader()
  return apiFetch<{ transactions: Transaction[] }>('/api/transactions', { headers })
}

export async function apiAddTransaction(tx: Omit<Transaction, 'id' | 'created_at' | 'firebase_uid'>) {
  const headers = await authHeader()
  return apiFetch<{ transaction: Transaction }>('/api/transactions', {
    method: 'POST',
    headers,
    body: JSON.stringify(tx),
  })
}

export async function apiDeleteTransaction(id: string) {
  const headers = await authHeader()
  return apiFetch<{ ok: boolean }>(`/api/transactions?id=${id}`, {
    method: 'DELETE',
    headers,
  })
}

// ─── User ─────────────────────────────────────────────────────────────────────

export async function apiGetUser() {
  const headers = await authHeader()
  return apiFetch<{ user: UserProfile | null }>('/api/user', { headers })
}

export async function apiUpsertUser(profile: Partial<UserProfile>) {
  const headers = await authHeader()
  return apiFetch<{ user: UserProfile }>('/api/user', {
    method: 'POST',
    headers,
    body: JSON.stringify(profile),
  })
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export async function apiGetGoals() {
  const headers = await authHeader()
  return apiFetch<{ goals: Goal[] }>('/api/goals', { headers })
}

export async function apiAddGoal(goal: Omit<Goal, 'id' | 'created_at' | 'firebase_uid'>) {
  const headers = await authHeader()
  return apiFetch<{ goal: Goal }>('/api/goals', {
    method: 'POST',
    headers,
    body: JSON.stringify(goal),
  })
}

export async function apiUpdateGoalSaved(id: string, saved_amount: number) {
  const headers = await authHeader()
  return apiFetch<{ goal: Goal }>(`/api/goals?id=${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ saved_amount }),
  })
}

export async function apiDeleteGoal(id: string) {
  const headers = await authHeader()
  return apiFetch<{ ok: boolean }>(`/api/goals?id=${id}`, {
    method: 'DELETE',
    headers,
  })
}

// ─── Budget ───────────────────────────────────────────────────────────────────

export async function apiGetBudgetPlan(month: number, year: number) {
  const headers = await authHeader()
  return apiFetch<{ budgetPlan: BudgetPlan | null }>(`/api/budget?month=${month}&year=${year}`, { headers })
}

export async function apiUpsertBudgetPlan(plan: Omit<BudgetPlan, 'id' | 'firebase_uid'>) {
  const headers = await authHeader()
  return apiFetch<{ budgetPlan: BudgetPlan }>('/api/budget', {
    method: 'POST',
    headers,
    body: JSON.stringify(plan),
  })
}

// ─── EMI ──────────────────────────────────────────────────────────────────────

export async function apiGetEMIHistory() {
  const headers = await authHeader()
  return apiFetch<{ emiHistory: EMICalculation[] }>('/api/emi', { headers })
}

export async function apiSaveEMICalculation(calc: Omit<EMICalculation, 'id' | 'created_at' | 'firebase_uid'>) {
  const headers = await authHeader()
  return apiFetch<{ emiCalculation: EMICalculation }>('/api/emi', {
    method: 'POST',
    headers,
    body: JSON.stringify(calc),
  })
}

// ─── Shared types (re-exported for convenience) ───────────────────────────────

export interface Transaction {
  id?: string
  firebase_uid: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description?: string
  date: string
  created_at?: string
}

export interface UserProfile {
  id?: string
  firebase_uid: string
  name: string | null
  email: string | null
  college: string | null
  monthly_pocket_money: number
  created_at?: string
}

export interface Goal {
  id?: string
  firebase_uid: string
  name: string
  target_amount: number
  saved_amount: number
  target_date?: string | null
  emoji: string
  created_at?: string
}

export interface BudgetPlan {
  id?: string
  firebase_uid: string
  month: number
  year: number
  needs_amount: number
  wants_amount: number
  savings_amount: number
}

export interface EMICalculation {
  id?: string
  firebase_uid: string
  item_name?: string
  principal: number
  interest_rate: number
  tenure_months: number
  monthly_emi: number
  total_cost: number
  affordability_score: number
  created_at?: string
}
