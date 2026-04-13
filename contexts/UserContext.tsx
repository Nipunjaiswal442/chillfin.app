'use client'

/**
 * UserContext — shared state for the authenticated user's profile, goals,
 * budget plan, and derived financial totals. Wraps all dashboard pages.
 *
 * Also exposes `setMonthlyIncomeAndBudget` which updates the user's income
 * AND auto-generates (or regenerates) the 50/30/20 budget plan for the
 * current month in one call — used by the Overview quick-setup panel.
 */

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  getUser, getGoals, getBudgetPlan, updateUser, upsertBudgetPlan,
  UserProfile, Goal, BudgetPlan,
} from '@/lib/supabase'
import { getCurrentMonthYear, generateBudget } from '@/lib/utils'

interface UserContextValue {
  profile: UserProfile | null
  goals: Goal[]
  budgetPlan: BudgetPlan | null
  profileLoading: boolean
  /** Sum of saved_amount across all goals */
  totalGoalsSaved: number
  refetchProfile: () => void
  refetchGoals: () => void
  /**
   * Update monthly pocket-money AND auto-generate / override the current
   * month's 50/30/20 budget plan. Updates context optimistically.
   */
  setMonthlyIncomeAndBudget: (income: number) => Promise<void>
}

const UserContext = createContext<UserContextValue>({
  profile: null,
  goals: [],
  budgetPlan: null,
  profileLoading: true,
  totalGoalsSaved: 0,
  refetchProfile: () => {},
  refetchGoals: () => {},
  setMonthlyIncomeAndBudget: async () => {},
})

export function UserProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { month, year } = getCurrentMonthYear()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [budgetPlan, setBudgetPlan] = useState<BudgetPlan | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    if (!user) return
    setProfileLoading(true)
    const [{ data: u }, { data: b }] = await Promise.all([
      getUser(user.uid),
      getBudgetPlan(user.uid, month, year),
    ])
    setProfile(u as UserProfile | null)
    setBudgetPlan(b as BudgetPlan | null)
    setProfileLoading(false)
  }, [user, month, year])

  const fetchGoals = useCallback(async () => {
    if (!user) return
    const { data } = await getGoals(user.uid)
    setGoals((data as Goal[]) || [])
  }, [user])

  useEffect(() => {
    fetchProfile()
    fetchGoals()
  }, [fetchProfile, fetchGoals])

  /** Sum of all goal saved_amounts */
  const totalGoalsSaved = goals.reduce((s, g) => s + Number(g.saved_amount), 0)

  /**
   * One-shot: save income to profile + auto-generate 50/30/20 budget plan.
   * Called from the Dashboard overview "Quick Setup" panel and from the
   * Budget page "Update & Regenerate" button.
   */
  const setMonthlyIncomeAndBudget = useCallback(async (income: number) => {
    if (!user || income <= 0) return
    const generated = generateBudget(income)
    const newPlan: BudgetPlan = {
      firebase_uid: user.uid,
      month,
      year,
      needs_amount: generated.needs_amount,
      wants_amount: generated.wants_amount,
      savings_amount: generated.savings_amount,
    }
    // Optimistic update
    setProfile((prev) => prev ? { ...prev, monthly_pocket_money: income } : prev)
    setBudgetPlan(newPlan)
    // Persist
    await Promise.all([
      updateUser(user.uid, { monthly_pocket_money: income }),
      upsertBudgetPlan(newPlan),
    ])
    // Revalidate from DB
    fetchProfile()
  }, [user, month, year, fetchProfile])

  return (
    <UserContext.Provider
      value={{
        profile,
        goals,
        budgetPlan,
        profileLoading,
        totalGoalsSaved,
        refetchProfile: fetchProfile,
        refetchGoals: fetchGoals,
        setMonthlyIncomeAndBudget,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
