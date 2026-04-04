import { createClient, SupabaseClient } from '@supabase/supabase-js'

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id?: string
  firebase_uid: string
  name: string | null
  email: string | null
  college: string | null
  monthly_pocket_money: number
  created_at?: string
}

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

export interface BudgetPlan {
  id?: string
  firebase_uid: string
  month: number
  year: number
  needs_amount: number
  wants_amount: number
  savings_amount: number
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

// ─── User helpers ─────────────────────────────────────────────────────────────

export async function upsertUser(profile: UserProfile) {
  const supabase = getSupabase()
  if (!supabase) return { data: null, error: new Error('Supabase environment variables not configured') }
  const { data, error } = await supabase
    .from('users')
    .upsert({ ...profile, updated_at: new Date().toISOString() }, { onConflict: 'firebase_uid' })
    .select()
    .single()
  return { data, error }
}

export async function getUser(firebaseUid: string) {
  const supabase = getSupabase()
  if (!supabase) return { data: null, error: new Error('Supabase environment variables not configured') }
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .single()
  return { data, error }
}

export async function updateUser(firebaseUid: string, updates: Partial<UserProfile>) {
  const supabase = getSupabase()
  if (!supabase) return { data: null, error: new Error('Supabase environment variables not configured') }
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('firebase_uid', firebaseUid)
    .select()
    .single()
  return { data, error }
}

// ─── Transaction helpers ──────────────────────────────────────────────────────

export async function getTransactions(firebaseUid: string, limit = 50) {
  const supabase = getSupabase()
  if (!supabase) return { data: null, error: new Error('Supabase environment variables not configured') }
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .order('date', { ascending: false })
    .limit(limit)
  return { data, error }
}

export async function addTransaction(tx: Transaction) {
  const supabase = getSupabase()
  if (!supabase) return { data: null, error: new Error('Supabase environment variables not configured') }
  const { data, error } = await supabase.from('transactions').insert(tx).select().single()
  return { data, error }
}

export async function deleteTransaction(id: string) {
  const supabase = getSupabase()
  if (!supabase) return { error: new Error('Supabase environment variables not configured') }
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  return { error }
}

// ─── Budget helpers ───────────────────────────────────────────────────────────

export async function getBudgetPlan(firebaseUid: string, month: number, year: number) {
  const supabase = getSupabase()
  if (!supabase) return { data: null, error: new Error('Supabase environment variables not configured') }
  const { data, error } = await supabase
    .from('budget_plans')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .eq('month', month)
    .eq('year', year)
    .maybeSingle()
  return { data, error }
}

export async function upsertBudgetPlan(plan: BudgetPlan) {
  const supabase = getSupabase()
  if (!supabase) return { data: null, error: new Error('Supabase environment variables not configured') }
  const { data, error } = await supabase
    .from('budget_plans')
    .upsert(plan, { onConflict: 'firebase_uid,month,year' })
    .select()
    .single()
  return { data, error }
}

// ─── Goal helpers ─────────────────────────────────────────────────────────────

export async function getGoals(firebaseUid: string) {
  const supabase = getSupabase()
  if (!supabase) return { data: null, error: new Error('Supabase environment variables not configured') }
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .order('created_at', { ascending: true })
  return { data, error }
}

export async function addGoal(goal: Goal) {
  const supabase = getSupabase()
  if (!supabase) return { data: null, error: new Error('Supabase environment variables not configured') }
  const { data, error } = await supabase.from('goals').insert(goal).select().single()
  return { data, error }
}

export async function updateGoalSaved(id: string, saved_amount: number) {
  const supabase = getSupabase()
  if (!supabase) return { data: null, error: new Error('Supabase environment variables not configured') }
  const { data, error } = await supabase
    .from('goals')
    .update({ saved_amount })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteGoal(id: string) {
  const supabase = getSupabase()
  if (!supabase) return { error: new Error('Supabase environment variables not configured') }
  const { error } = await supabase.from('goals').delete().eq('id', id)
  return { error }
}

// ─── EMI helpers ──────────────────────────────────────────────────────────────

export async function saveEMICalculation(calc: EMICalculation) {
  const supabase = getSupabase()
  if (!supabase) return { data: null, error: new Error('Supabase environment variables not configured') }
  const { data, error } = await supabase.from('emi_calculations').insert(calc).select().single()
  return { data, error }
}

export async function getEMIHistory(firebaseUid: string) {
  const supabase = getSupabase()
  if (!supabase) return { data: null, error: new Error('Supabase environment variables not configured') }
  const { data, error } = await supabase
    .from('emi_calculations')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .order('created_at', { ascending: false })
    .limit(10)
  return { data, error }
}

