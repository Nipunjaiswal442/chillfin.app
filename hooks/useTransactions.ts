'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTransactions, addTransaction, deleteTransaction, Transaction } from '@/lib/supabase'

export function useTransactions(firebaseUid: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    if (!firebaseUid) return
    setLoading(true)
    const { data, error } = await getTransactions(firebaseUid)
    if (error) {
      setError(error.message)
    } else {
      setTransactions((data as Transaction[]) || [])
    }
    setLoading(false)
  }, [firebaseUid])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const add = async (tx: Omit<Transaction, 'id' | 'created_at'>) => {
    const { data, error } = await addTransaction(tx)
    if (error) return { error }
    setTransactions((prev) => [data as Transaction, ...prev])
    return { data }
  }

  const remove = async (id: string) => {
    const { error } = await deleteTransaction(id)
    if (!error) {
      setTransactions((prev) => prev.filter((t) => t.id !== id))
    }
    return { error }
  }

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const balance = totalIncome - totalExpense

  return {
    transactions,
    loading,
    error,
    add,
    remove,
    refetch: fetchTransactions,
    totalIncome,
    totalExpense,
    balance,
  }
}
