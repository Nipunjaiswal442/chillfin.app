'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/hooks/useAuth'
import { useTransactions } from '@/hooks/useTransactions'
import { formatCurrency, formatDate, getCategoryEmoji, getCategoryLabel, EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCurrentMonthYear } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import StatCard from '@/components/ui/StatCard'
import { Plus, Trash2, Filter } from 'lucide-react'

const CategoryPieChart = dynamic(() => import('@/components/charts/CategoryPieChart'), { ssr: false })

type TxType = 'expense' | 'income'

export default function TrackerPage() {
  const { user } = useAuth()
  const { transactions, loading, add, remove, totalIncome, totalExpense, balance } = useTransactions(user?.uid)
  const [modalOpen, setModalOpen] = useState(false)
  const [filterType, setFilterType] = useState<'all' | TxType>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    type: 'expense' as TxType,
    amount: '',
    category: 'food',
    description: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [submitting, setSubmitting] = useState(false)

  const { month, year } = getCurrentMonthYear()

  const thisMonthExpense = transactions
    .filter((t) => {
      const d = new Date(t.date)
      return t.type === 'expense' && d.getMonth() + 1 === month && d.getFullYear() === year
    })
    .reduce((s, t) => s + Number(t.amount), 0)

  const filtered = filterType === 'all' ? transactions : transactions.filter((t) => t.type === filterType)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !form.amount) return
    setSubmitting(true)
    await add({
      type: form.type,
      amount: parseFloat(form.amount),
      category: form.category,
      description: form.description,
      date: form.date,
    })
    setForm({ type: 'expense', amount: '', category: 'food', description: '', date: new Date().toISOString().split('T')[0] })
    setSubmitting(false)
    setModalOpen(false)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await remove(id)
    setDeleting(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair font-bold text-2xl text-neon-white">Pocket Money Tracker</h1>
          <p className="text-text-muted text-sm mt-1">Log and track every rupee in and out</p>
        </div>
        <Button onClick={() => setModalOpen(true)} size="sm">
          <Plus size={14} /> Add
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Balance" value={formatCurrency(balance)} icon="💰" trend={balance >= 0 ? 'up' : 'down'} />
        <StatCard label="Total Income" value={formatCurrency(totalIncome)} icon="📈" trend="up" />
        <StatCard label="Total Expenses" value={formatCurrency(totalExpense)} icon="📉" trend="down" />
        <StatCard label="This Month" value={formatCurrency(thisMonthExpense)} icon="📅" />
      </div>

      {/* Expense Breakdown Chart */}
      {(() => {
        const expenseTx = transactions.filter(t => t.type === 'expense')
        if (!expenseTx.length) return null
        const catMap: Record<string, number> = {}
        expenseTx.forEach(t => { catMap[getCategoryLabel(t.category)] = (catMap[getCategoryLabel(t.category)] || 0) + Number(t.amount) })
        const pieData = Object.entries(catMap).map(([name, value]) => ({ name, value }))
        return (
          <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-5">
            <h2 className="font-playfair font-bold text-base text-neon-white mb-4">Spending by Category</h2>
            <CategoryPieChart data={pieData} />
          </div>
        )
      })()}

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'income', 'expense'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
              filterType === f
                ? 'bg-gold/15 text-gold-light border border-gold/25'
                : 'text-text-muted border border-metallic-grey hover:border-gold/20 hover:text-neon-white'
            }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-1 text-xs text-text-muted">
          <Filter size={12} /> {filtered.length} entries
        </span>
      </div>

      {/* Transaction list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-bg-card rounded-xl animate-pulse border border-metallic-grey/30" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-bg-card border border-metallic-grey/30 rounded-2xl">
          <p className="text-4xl mb-4">💸</p>
          <p className="text-neon-white font-semibold">No transactions yet</p>
          <p className="text-text-muted text-sm mt-1 mb-4">Start logging your expenses to see your spending habits</p>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Log First Transaction
          </Button>
        </div>
      ) : (
        <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl overflow-hidden">
          {filtered.map((tx, i) => (
            <div key={tx.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-bg-card-hover transition-colors ${i > 0 ? 'border-t border-metallic-grey/20' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-metallic-grey/40 flex items-center justify-center text-lg flex-shrink-0">
                {getCategoryEmoji(tx.category)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neon-white truncate">{tx.description || getCategoryLabel(tx.category)}</p>
                <p className="text-xs text-text-muted">{formatDate(tx.date)} · {getCategoryLabel(tx.category)}</p>
              </div>
              <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                {tx.type === 'income' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
              </span>
              <button
                onClick={() => handleDelete(tx.id!)}
                disabled={deleting === tx.id}
                className="text-text-muted hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Transaction">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-xl overflow-hidden border border-metallic-grey">
            {(['expense', 'income'] as TxType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t, category: t === 'expense' ? 'food' : 'pocket_money' }))}
                className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-all ${
                  form.type === t
                    ? t === 'expense' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                    : 'text-text-muted hover:text-neon-white'
                }`}
              >
                {t === 'expense' ? '📉 Expense' : '📈 Income'}
              </button>
            ))}
          </div>

          <Input
            label="Amount (₹)"
            type="number"
            placeholder="0.00"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="bg-bg-card border border-metallic-grey rounded-xl px-4 py-3 text-neon-white text-sm focus:outline-none focus:border-gold"
            >
              {(form.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((c) => (
                <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>

          <Input
            label="Description (optional)"
            placeholder="e.g. Lunch at canteen"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />

          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={submitting}>
              Add Transaction
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
