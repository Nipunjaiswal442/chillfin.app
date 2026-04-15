'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  apiGetTransactions,
  apiAddTransaction,
  apiDeleteTransaction,
  Transaction,
} from '@/lib/api-client'
import { useAuth } from '@/hooks/useAuth'

export function useTransactions(firebaseUid: string | undefined) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    if (!firebaseUid || !user) return
    setLoading(true)
    try {
      const { transactions: data } = await apiGetTransactions()
      setTransactions(data || [])
    } catch (err) {
      setError(String(err))
    }
    setLoading(false)
  }, [firebaseUid, user])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const add = async (tx: Omit<Transaction, 'id' | 'created_at' | 'firebase_uid'>) => {
    try {
      const { transaction } = await apiAddTransaction(tx)
      setTransactions((prev) => [transaction, ...prev])
      return { data: transaction, error: null }
    } catch (err) {
      return { data: null, error: new Error(String(err)) }
    }
  }

  const remove = async (id: string) => {
    try {
      await apiDeleteTransaction(id)
      setTransactions((prev) => prev.filter((t) => t.id !== id))
      return { error: null }
    } catch (err) {
      return { error: new Error(String(err)) }
    }
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
