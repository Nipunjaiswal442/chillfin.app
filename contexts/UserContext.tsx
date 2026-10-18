'use client'

/**
 * UserContext — shared state for the authenticated user's profile, goals,
 * budget plan, and derived financial totals. Wraps all dashboard pages.
 *
 * Backed by Convex reactive queries: any change (from this tab, another tab,
 * or another device) updates every page automatically — no manual refetch.
 *
 * Also exposes `setMonthlyIncomeAndBudget` which updates the user's income
 * AND auto-generates (or regenerates) the 50/30/20 budget plan for the
 * current month in one atomic mutation — used by the Overview quick-setup
 * panel and the Budget page.
 */

import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Doc } from '@/convex/_generated/dataModel'
import { getCurrentMonthYear } from '@/lib/utils'

export type UserProfile = Doc<'users'>
export type Goal = Doc<'goals'>
export type BudgetPlan = Doc<'budget_plans'>

interface UserContextValue {
  profile: UserProfile | null
  goals: Goal[]
  budgetPlan: BudgetPlan | null
  profileLoading: boolean
  goalsLoading: boolean
  /** Sum of saved_amount across all goals */
  totalGoalsSaved: number
  /**
   * Update monthly pocket-money AND auto-generate / override the current
   * month's 50/30/20 budget plan. Throws on validation errors.
   */
  setMonthlyIncomeAndBudget: (income: number) => Promise<void>
}

const UserContext = createContext<UserContextValue>({
  profile: null,
  goals: [],
  budgetPlan: null,
  profileLoading: true,
  goalsLoading: true,
  totalGoalsSaved: 0,
  setMonthlyIncomeAndBudget: async () => {},
})

export function UserProvider({ children }: { children: ReactNode }) {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth()
  const { month, year } = getCurrentMonthYear()

  const args = isAuthenticated ? {} : 'skip'
  const profile = useQuery(api.users.me, args)
  const goals = useQuery(api.goals.list, args)
  const budgetPlan = useQuery(api.budget.get, isAuthenticated ? { month, year } : 'skip')

  const ensureProfile = useMutation(api.users.ensure)
  const ensureBudget = useMutation(api.budget.ensureForPeriod)
  const setIncome = useMutation(api.budget.setIncomeAndRegenerate)

  // Once per session: create the profile on first sign-in, then this month's
  // plan from the saved income (so a new month starts with a budget).
  useEffect(() => {
    if (!isAuthenticated) return
    ensureProfile({})
      .then(() => ensureBudget({ month, year }))
      .catch((err) => console.error('[ChillFin] profile setup failed', err))
  }, [isAuthenticated, month, year, ensureProfile, ensureBudget])

  const setMonthlyIncomeAndBudget = useCallback(async (income: number) => {
    if (income <= 0) return
    await setIncome({ income, month, year })
  }, [setIncome, month, year])

  const goalList = goals ?? []
  /** Sum of all goal saved_amounts */
  const totalGoalsSaved = goalList.reduce((s, g) => s + g.saved_amount, 0)

  return (
    <UserContext.Provider
      value={{
        profile: profile ?? null,
        goals: goalList,
        budgetPlan: budgetPlan ?? null,
        profileLoading: profile === undefined || budgetPlan === undefined,
        goalsLoading: goals === undefined,
        totalGoalsSaved,
        setMonthlyIncomeAndBudget,
      }}
    >
      {/* Signed in with Google, but Convex rejected the token (usually a missing
          FIREBASE_PROJECT_ID on the Convex deployment) — say so instead of
          showing loading skeletons forever */}
      {!authLoading && !isAuthenticated && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)] bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl px-4 py-3 backdrop-blur">
          ⚠️ We couldn&apos;t connect your account to the database. Please sign out and sign in again.
        </div>
      )}
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
