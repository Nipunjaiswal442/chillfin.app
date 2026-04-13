'use client'

/**
 * UserContext — shared state for the authenticated user's profile, goals, and
 * current-month budget plan. Wraps all dashboard pages so each page doesn't
 * need to independently call getUser() on mount.
 */

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getUser, getGoals, getBudgetPlan, UserProfile, Goal, BudgetPlan } from '@/lib/supabase'
import { getCurrentMonthYear } from '@/lib/utils'

interface UserContextValue {
  profile: UserProfile | null
  goals: Goal[]
  budgetPlan: BudgetPlan | null
  profileLoading: boolean
  refetchProfile: () => void
  refetchGoals: () => void
}

const UserContext = createContext<UserContextValue>({
  profile: null,
  goals: [],
  budgetPlan: null,
  profileLoading: true,
  refetchProfile: () => {},
  refetchGoals: () => {},
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

  return (
    <UserContext.Provider
      value={{
        profile,
        goals,
        budgetPlan,
        profileLoading,
        refetchProfile: fetchProfile,
        refetchGoals: fetchGoals,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
