'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/contexts/UserContext'
import { useTransactions } from '@/hooks/useTransactions'
import { formatCurrency, formatCurrencyShort, getCurrentMonthYear, getMonthName } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'
import { Wallet, PieChart, Target, Calculator, TrendingUp, Bot, ArrowRight, Plus } from 'lucide-react'

const MonthlyTrendChart = dynamic(() => import('@/components/charts/MonthlyTrendChart'), { ssr: false })

const QUICK_LINKS = [
  { href: '/dashboard/tracker', icon: Wallet, label: 'Add Expense', color: 'text-gold' },
  { href: '/dashboard/budget', icon: PieChart, label: 'Budget Plan', color: 'text-silver' },
  { href: '/dashboard/goals', icon: Target, label: 'My Goals', color: 'text-green-400' },
  { href: '/dashboard/emi', icon: Calculator, label: 'EMI Advisor', color: 'text-orange-400' },
  { href: '/dashboard/portfolio', icon: TrendingUp, label: 'Investments', color: 'text-blue-400' },
  { href: '/dashboard/advisor', icon: Bot, label: 'AI Advisor', color: 'text-purple-400' },
]

// ─── Skeleton component ────────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <div className="bg-bg-card border border-[rgba(212,168,67,0.06)] rounded-2xl p-5 animate-pulse">
      <div className="h-3 w-16 bg-metallic-grey/50 rounded mb-3" />
      <div className="h-7 w-24 bg-metallic-grey/50 rounded mb-2" />
      <div className="h-2.5 w-20 bg-metallic-grey/30 rounded" />
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { profile, goals, budgetPlan, profileLoading } = useUser()
  const { transactions, totalIncome, totalExpense, balance, loading: txLoading } = useTransactions(user?.uid)
  const { month, year } = getCurrentMonthYear()

  // This month's expenses
  const thisMonthExpense = transactions
    .filter((t) => {
      const d = new Date(t.date)
      return t.type === 'expense' && d.getMonth() + 1 === month && d.getFullYear() === year
    })
    .reduce((s, t) => s + Number(t.amount), 0)

  const monthlyIncome = Number(profile?.monthly_pocket_money ?? 0)

  // Use DB budget plan if it exists, otherwise derive from monthly income (50/30/20)
  const spendingBudget = budgetPlan
    ? budgetPlan.needs_amount + budgetPlan.wants_amount
    : Math.round(monthlyIncome * 0.8)

  // Build last-6-months trend data
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const m = d.getMonth() + 1
    const y = d.getFullYear()
    const label = d.toLocaleString('default', { month: 'short' })
    const income = transactions.filter(t => { const td = new Date(t.date); return t.type === 'income' && td.getMonth() + 1 === m && td.getFullYear() === y }).reduce((s, t) => s + Number(t.amount), 0)
    const expense = transactions.filter(t => { const td = new Date(t.date); return t.type === 'expense' && td.getMonth() + 1 === m && td.getFullYear() === y }).reduce((s, t) => s + Number(t.amount), 0)
    return { month: label, income, expense }
  })
  const hasTrendData = trendData.some(d => d.income > 0 || d.expense > 0)
  const recentTx = transactions.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-muted text-sm uppercase tracking-widest">
            {getMonthName(month)} {year}
          </p>
          <h1 className="font-playfair font-bold text-3xl text-neon-white mt-1">
            Hey, {user?.displayName?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="text-text-muted text-sm mt-1">
            {profileLoading
              ? <span className="inline-block h-3 w-36 bg-metallic-grey/40 rounded animate-pulse" />
              : profile?.college ? `${profile.college} · Your financial snapshot` : 'Your financial snapshot'}
          </p>
        </div>
        <Link
          href="/dashboard/tracker"
          className="flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/20 text-gold-light rounded-xl text-sm font-medium hover:bg-gold/15 transition-all"
        >
          <Plus size={14} />
          Add Transaction
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {profileLoading || txLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Balance"
              value={formatCurrencyShort(balance)}
              sub="Total remaining"
              icon="💰"
              trend={balance >= 0 ? 'up' : 'down'}
            />
            <StatCard
              label="This Month"
              value={formatCurrencyShort(thisMonthExpense)}
              sub={spendingBudget > 0 ? `of ${formatCurrencyShort(spendingBudget)} budget` : 'No budget set'}
              icon="📊"
              trend={spendingBudget > 0 ? (thisMonthExpense <= spendingBudget ? 'up' : 'down') : undefined}
            />
            <StatCard
              label="Total Income"
              value={formatCurrencyShort(totalIncome)}
              sub="All time"
              icon="📈"
            />
            <StatCard
              label="Goals"
              value={String(goals.length)}
              sub={`${goals.filter((g) => Number(g.saved_amount) >= Number(g.target_amount)).length} completed`}
              icon="🎯"
            />
          </>
        )}
      </div>

      {/* Budget bar — only when we have income and a budget plan */}
      {!profileLoading && monthlyIncome > 0 && spendingBudget > 0 && (
        <div className="bg-bg-card border border-[rgba(212,168,67,0.06)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-neon-white">Monthly Budget — {getMonthName(month)}</span>
            <Link href="/dashboard/budget" className="text-xs text-gold flex items-center gap-1 hover:text-gold-light">
              Details <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex justify-between text-xs text-text-muted mb-2">
            <span>Spent: {formatCurrency(thisMonthExpense)}</span>
            <span>Budget: {formatCurrency(spendingBudget)}</span>
          </div>
          <div className="h-2 bg-metallic-grey rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (thisMonthExpense / spendingBudget) * 100)}%`,
                background: thisMonthExpense > spendingBudget
                  ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                  : 'linear-gradient(90deg, #D4A843, #F2D06B)',
              }}
            />
          </div>
          <p className="text-xs text-text-muted mt-2">
            {spendingBudget - thisMonthExpense >= 0
              ? `${formatCurrency(spendingBudget - thisMonthExpense)} remaining`
              : `${formatCurrency(thisMonthExpense - spendingBudget)} over budget`}
          </p>
        </div>
      )}

      {/* Monthly Trend Chart */}
      {!txLoading && hasTrendData && (
        <div className="bg-bg-card border border-[rgba(212,168,67,0.06)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-playfair font-bold text-base text-neon-white">6-Month Spending Trend</h2>
            <span className="text-xs text-text-muted">Income vs Expenses</span>
          </div>
          <MonthlyTrendChart data={trendData} />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick links */}
        <div className="bg-bg-card border border-[rgba(212,168,67,0.06)] rounded-2xl p-5">
          <h2 className="font-playfair font-bold text-base text-neon-white mb-4">Quick Access</h2>
          <div className="grid grid-cols-3 gap-3">
            {QUICK_LINKS.map(({ href, icon: Icon, label, color }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-metallic-grey/30 hover:bg-metallic-grey/60 border border-transparent hover:border-gold/10 transition-all duration-200"
              >
                <Icon size={18} className={color} />
                <span className="text-[11px] text-text-muted text-center leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-bg-card border border-[rgba(212,168,67,0.06)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-playfair font-bold text-base text-neon-white">Recent Transactions</h2>
            <Link href="/dashboard/tracker" className="text-xs text-gold flex items-center gap-1 hover:text-gold-light">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {txLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-metallic-grey/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentTx.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-muted text-sm">No transactions yet.</p>
              <Link href="/dashboard/tracker" className="text-gold-light text-xs mt-2 inline-block hover:underline">
                Add your first transaction →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-metallic-grey/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{tx.type === 'income' ? '💰' : '💸'}</span>
                    <div>
                      <p className="text-sm text-neon-white capitalize">{tx.description || tx.category}</p>
                      <p className="text-xs text-text-muted">{tx.date}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Goals preview */}
      {goals.length > 0 && (
        <div className="bg-bg-card border border-[rgba(212,168,67,0.06)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-playfair font-bold text-base text-neon-white">Goal Vaults</h2>
            <Link href="/dashboard/goals" className="text-xs text-gold flex items-center gap-1 hover:text-gold-light">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {goals.slice(0, 4).map((goal) => {
              const pct = Math.min(100, (Number(goal.saved_amount) / Number(goal.target_amount)) * 100)
              return (
                <div key={goal.id} className="p-4 bg-metallic-grey/20 rounded-xl border border-metallic-grey/40">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{goal.emoji}</span>
                    <span className="text-sm font-semibold text-neon-white">{goal.name}</span>
                  </div>
                  <div className="h-1.5 bg-metallic-grey rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-text-muted">{formatCurrency(Number(goal.saved_amount))} / {formatCurrency(Number(goal.target_amount))}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Setup prompt if no income set */}
      {!profileLoading && !txLoading && monthlyIncome === 0 && (
        <div className="bg-gold/5 border border-gold/15 rounded-2xl p-5 flex items-center gap-4">
          <span className="text-2xl">⚡</span>
          <div>
            <p className="text-sm font-semibold text-neon-white">Set your monthly pocket money</p>
            <p className="text-xs text-text-muted mt-0.5">We&apos;ll auto-generate a personalised budget for you.</p>
          </div>
          <Link href="/dashboard/budget" className="ml-auto text-xs text-gold border border-gold/30 px-3 py-1.5 rounded-lg hover:bg-gold/10 transition-all whitespace-nowrap">
            Set Up →
          </Link>
        </div>
      )}
    </div>
  )
}
