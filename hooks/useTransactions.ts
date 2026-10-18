'use client'

import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Doc, Id } from '@/convex/_generated/dataModel'
import { errorMessage } from '@/lib/errors'

export type Transaction = Doc<'transactions'>

type NewTransaction = Pick<Transaction, 'type' | 'amount' | 'category' | 'description' | 'date'>

export function useTransactions() {
  const { isAuthenticated } = useConvexAuth()
  // Convex de-duplicates this subscription across pages and keeps it live
  const data = useQuery(api.transactions.list, isAuthenticated ? {} : 'skip')
  const addMutation = useMutation(api.transactions.add)
  const removeMutation = useMutation(api.transactions.remove)

  const transactions = data ?? []

  const add = async (tx: NewTransaction) => {
    try {
      const transaction = await addMutation(tx)
      return { data: transaction, error: null }
    } catch (err) {
      return { data: null, error: new Error(errorMessage(err)) }
    }
  }

  const remove = async (id: Id<'transactions'>) => {
    try {
      await removeMutation({ id })
      return { error: null }
    } catch (err) {
      return { error: new Error(errorMessage(err)) }
    }
  }

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpense

  return {
    transactions,
    loading: data === undefined,
    add,
    remove,
    totalIncome,
    totalExpense,
    balance,
  }
}
