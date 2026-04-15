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
  apiGetUser,
  apiUpsertUser,
  apiGetGoals,
  apiGetBudgetPlan,
  apiUpsertBudgetPlan,
  UserProfile,
  Goal,
  BudgetPlan,
} from '@/lib/api-client'
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
    try {
      const [{ user: u }, { budgetPlan: b }] = await Promise.all([
        apiGetUser(),
        apiGetBudgetPlan(month, year),
      ])
      setProfile(u as UserProfile | null)
      setBudgetPlan(b as BudgetPlan | null)
    } catch {
      // silently ignore — user may not have a profile yet
    }
    setProfileLoading(false)
  }, [user, month, year])

  const fetchGoals = useCallback(async () => {
    if (!user) return
    try {
      const { goals: data } = await apiGetGoals()
      setGoals(data || [])
    } catch {
      // ignore
    }
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
    const newPlan: Omit<BudgetPlan, 'id' | 'firebase_uid'> = {
      month,
      year,
      needs_amount: generated.needs_amount,
      wants_amount: generated.wants_amount,
      savings_amount: generated.savings_amount,
    }
    // Optimistic update
    setProfile((prev) => prev ? { ...prev, monthly_pocket_money: income } : prev)
    setBudgetPlan({ firebase_uid: user.uid, ...newPlan })
    // Persist via API routes
    await Promise.all([
      apiUpsertUser({ monthly_pocket_money: income }),
      apiUpsertBudgetPlan(newPlan),
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

