'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/contexts/UserContext'
import { useTransactions } from '@/hooks/useTransactions'
import { formatCurrency, formatCurrencyShort, getCurrentMonthYear, getMonthName } from '@/lib/utils'
import StatCard from '@/components/ui/StatCard'
import { Wallet, PieChart, Target, Calculator, TrendingUp, Bot, ArrowRight, Plus, Wrench, CheckCircle, AlertCircle } from 'lucide-react'

const MonthlyTrendChart = dynamic(() => import('@/components/charts/MonthlyTrendChart'), { ssr: false })

const QUICK_LINKS = [
  { href: '/dashboard/tracker',    icon: Wallet,     label: 'Add Expense',  color: 'text-gold' },
  { href: '/dashboard/budget',     icon: PieChart,   label: 'Budget Plan',  color: 'text-silver' },
  { href: '/dashboard/goals',      icon: Target,     label: 'My Goals',     color: 'text-green-400' },
  { href: '/dashboard/emi',        icon: Calculator, label: 'EMI Advisor',  color: 'text-orange-400' },
  { href: '/dashboard/portfolio',  icon: TrendingUp, label: 'Investments',  color: 'text-blue-400' },
  { href: '/dashboard/tools',      icon: Wrench,     label: 'Tools',        color: 'text-purple-400' },
  { href: '/dashboard/advisor',    icon: Bot,        label: 'AI Advisor',   color: 'text-pink-400' },
]

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <div className="bg-bg-card border border-[rgba(212,168,67,0.06)] rounded-2xl p-5 animate-pulse">
      <div className="h-3 w-16 bg-metallic-grey/50 rounded mb-3" />
      <div className="h-7 w-24 bg-metallic-grey/50 rounded mb-2" />
      <div className="h-2.5 w-20 bg-metallic-grey/30 rounded" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth()
  const { profile, goals, budgetPlan, profileLoading, totalGoalsSaved, setMonthlyIncomeAndBudget } = useUser()
  const { transactions, totalIncome, totalExpense, balance, loading: txLoading } = useTransactions(user?.uid)
  const { month, year } = getCurrentMonthYear()

  // Quick income setup state (shown inline when income = 0)
  const [incomeInput, setIncomeInput] = useState('')
  const [settingIncome, setSettingIncome] = useState(false)
  const [incomeSet, setIncomeSet] = useState(false)

  // This month's expenses
  const thisMonthExpense = transactions
    .filter(t => { const d = new Date(t.date); return t.type === 'expense' && d.getMonth() + 1 === month && d.getFullYear() === year })
    .reduce((s, t) => s + Number(t.amount), 0)

  const monthlyIncome = Number(profile?.monthly_pocket_money ?? 0)

  const spendingBudget = budgetPlan
    ? budgetPlan.needs_amount + budgetPlan.wants_amount
    : Math.round(monthlyIncome * 0.8)

  const savingsBudget = budgetPlan?.savings_amount ?? Math.round(monthlyIncome * 0.2)

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

  // Handle quick income setup
  const handleSetIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseFloat(incomeInput)
    if (!val || val <= 0) return
    setSettingIncome(true)
    await setMonthlyIncomeAndBudget(val)
    setSettingIncome(false)
    setIncomeSet(true)
  }

  // Financial health score (0–100)
  const healthScore = (() => {
    if (monthlyIncome === 0) return 0
    let score = 0
    if (budgetPlan) score += 25                                              // has budget
    if (totalGoalsSaved > 0) score += 20                                     // saving for goals
    if (thisMonthExpense <= spendingBudget && spendingBudget > 0) score += 25 // on budget
    if (goals.length > 0) score += 15                                         // has goals
    if (balance > 0) score += 15                                              // positive balance
    return Math.min(100, score)
  })()

  const healthLabel = healthScore >= 80 ? { text: 'Excellent', color: 'text-green-400' }
    : healthScore >= 60 ? { text: 'Good', color: 'text-gold-light' }
    : healthScore >= 40 ? { text: 'Fair', color: 'text-orange-400' }
    : { text: 'Getting Started', color: 'text-text-muted' }

  return (
    <div className="space-y-8">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-muted text-sm uppercase tracking-widest">{getMonthName(month)} {year}</p>
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
          <Plus size={14} /> Add Transaction
        </Link>
      </div>

      {/* ─── Quick Income Setup (shown when income = 0) ─────────────────── */}
      {!profileLoading && monthlyIncome === 0 && !incomeSet && (
        <div className="bg-gradient-to-r from-gold/8 to-transparent border border-gold/20 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-sm font-bold text-neon-white">Set your monthly pocket money</p>
              <p className="text-xs text-text-muted mt-0.5">
                We&apos;ll instantly generate a personalised 50/30/20 budget plan — no need to go to the Budget page.
              </p>
            </div>
          </div>
          <form onSubmit={handleSetIncome} className="flex gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-bold">₹</span>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={incomeInput}
                onChange={e => setIncomeInput(e.target.value)}
                min="1"
                className="w-full bg-bg-card border border-metallic-grey/40 rounded-xl pl-8 pr-4 py-2.5 text-sm text-neon-white focus:outline-none focus:border-gold/50 placeholder:text-text-muted"
              />
            </div>
            <button
              type="submit"
              disabled={settingIncome}
              className="px-5 py-2.5 bg-gold text-bg-deep rounded-xl text-sm font-bold hover:bg-gold-light transition-all disabled:opacity-60"
            >
              {settingIncome ? 'Saving…' : 'Auto-Generate Budget →'}
            </button>
          </form>
        </div>
      )}

      {/* Budget auto-generated success */}
      {incomeSet && (
        <div className="flex items-center gap-3 bg-green-500/8 border border-green-500/20 rounded-2xl px-5 py-3">
          <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-400">Budget plan auto-generated! Check the <Link href="/dashboard/budget" className="underline font-semibold">Budget page</Link> for details.</p>
        </div>
      )}

      {/* ─── Stats row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {profileLoading || txLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Balance" value={formatCurrencyShort(balance)} sub="Total remaining" icon="💰" trend={balance >= 0 ? 'up' : 'down'} />
            <StatCard label="This Month" value={formatCurrencyShort(thisMonthExpense)} sub={spendingBudget > 0 ? `of ${formatCurrencyShort(spendingBudget)} budget` : 'No budget set'} icon="📊" trend={spendingBudget > 0 ? (thisMonthExpense <= spendingBudget ? 'up' : 'down') : undefined} />
            <StatCard label="Total Income" value={formatCurrencyShort(totalIncome)} sub="All time" icon="📈" />
            <StatCard label="Goals" value={String(goals.length)} sub={`${goals.filter(g => Number(g.saved_amount) >= Number(g.target_amount)).length} completed`} icon="🎯" />
          </>
        )}
      </div>

      {/* ─── Connected Financial Health Panel ───────────────────────────── */}
      {!profileLoading && monthlyIncome > 0 && (
        <div className="bg-bg-card border border-[rgba(212,168,67,0.06)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-playfair font-bold text-base text-neon-white">Financial Health</h2>
            <span className={`text-sm font-bold ${healthLabel.color}`}>{healthLabel.text} · {healthScore}/100</span>
          </div>

          {/* Health bar */}
          <div className="h-2 bg-metallic-grey rounded-full overflow-hidden mb-5">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${healthScore}%`,
                background: healthScore >= 80 ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                  : healthScore >= 60 ? 'linear-gradient(90deg, #D4A843, #F2D06B)'
                  : 'linear-gradient(90deg, #f97316, #fb923c)',
              }}
            />
          </div>

          {/* Connected totals grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: 'Monthly Income',
                value: formatCurrency(monthlyIncome),
                sub: 'from profile',
                icon: '💵',
                link: '/dashboard/budget',
              },
              {
                label: 'Spending Budget',
                value: formatCurrency(spendingBudget),
                sub: budgetPlan ? '50%+30% plan' : '80% estimate',
                icon: '📋',
                link: '/dashboard/budget',
              },
              {
                label: 'Saved in Goals',
                value: formatCurrency(totalGoalsSaved),
                sub: `${goals.length} active goal${goals.length !== 1 ? 's' : ''}`,
                icon: '🎯',
                link: '/dashboard/goals',
              },
              {
                label: 'Investable Surplus',
                value: formatCurrency(savingsBudget),
                sub: budgetPlan ? '20% savings allocation' : '20% estimate',
                icon: '💎',
                link: '/dashboard/portfolio',
              },
            ].map(item => (
              <Link key={item.label} href={item.link} className="group bg-metallic-grey/20 hover:bg-metallic-grey/40 border border-metallic-grey/20 hover:border-gold/15 rounded-xl p-3 transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{item.icon}</span>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{item.label}</p>
                </div>
                <p className="text-sm font-bold text-neon-white group-hover:text-gold-light transition-colors">{item.value}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{item.sub}</p>
              </Link>
            ))}
          </div>

          {/* Health checklist */}
          <div className="mt-4 pt-4 border-t border-metallic-grey/20 grid sm:grid-cols-2 gap-2">
            {[
              { done: !!budgetPlan,         label: 'Budget plan generated' },
              { done: totalGoalsSaved > 0,  label: 'Saving towards goals' },
              { done: goals.length > 0,     label: 'At least one goal set' },
              { done: thisMonthExpense <= spendingBudget && spendingBudget > 0, label: 'On budget this month' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                {item.done
                  ? <CheckCircle size={12} className="text-green-400 flex-shrink-0" />
                  : <AlertCircle size={12} className="text-text-muted flex-shrink-0" />}
                <p className={`text-xs ${item.done ? 'text-green-400' : 'text-text-muted'}`}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Budget bar ─────────────────────────────────────────────────── */}
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

      {/* ─── Monthly Trend Chart ─────────────────────────────────────────── */}
      {!txLoading && hasTrendData && (
        <div className="bg-bg-card border border-[rgba(212,168,67,0.06)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-playfair font-bold text-base text-neon-white">6-Month Spending Trend</h2>
            <span className="text-xs text-text-muted">Income vs Expenses</span>
          </div>
          <MonthlyTrendChart data={trendData} />
        </div>
      )}

      {/* ─── Quick Access + Recent Transactions ─────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-[rgba(212,168,67,0.06)] rounded-2xl p-5">
          <h2 className="font-playfair font-bold text-base text-neon-white mb-4">Quick Access</h2>
          <div className="grid grid-cols-4 gap-3">
            {QUICK_LINKS.map(({ href, icon: Icon, label, color }) => (
              <Link key={href} href={href}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-metallic-grey/30 hover:bg-metallic-grey/60 border border-transparent hover:border-gold/10 transition-all duration-200">
                <Icon size={18} className={color} />
                <span className="text-[10px] text-text-muted text-center leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-bg-card border border-[rgba(212,168,67,0.06)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-playfair font-bold text-base text-neon-white">Recent Transactions</h2>
            <Link href="/dashboard/tracker" className="text-xs text-gold flex items-center gap-1 hover:text-gold-light">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {txLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-metallic-grey/30 rounded-xl animate-pulse" />)}
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
              {recentTx.map(tx => (
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

      {/* ─── Goals Preview ───────────────────────────────────────────────── */}
      {goals.length > 0 && (
        <div className="bg-bg-card border border-[rgba(212,168,67,0.06)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-playfair font-bold text-base text-neon-white">Goal Vaults</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted">
                {formatCurrency(totalGoalsSaved)} saved total
              </span>
              <Link href="/dashboard/goals" className="text-xs text-gold flex items-center gap-1 hover:text-gold-light">
                View all <ArrowRight size={12} />
              </Link>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {goals.slice(0, 4).map(goal => {
              const pct = Math.min(100, (Number(goal.saved_amount) / Number(goal.target_amount)) * 100)
              return (
                <div key={goal.id} className="p-4 bg-metallic-grey/20 rounded-xl border border-metallic-grey/40">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span>{goal.emoji}</span>
                      <span className="text-sm font-semibold text-neon-white">{goal.name}</span>
                    </div>
                    {pct >= 100 && <span className="text-[10px] text-green-400 font-bold">✓ Done</span>}
                  </div>
                  <div className="h-1.5 bg-metallic-grey rounded-full overflow-hidden mb-1">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 100 ? '#22c55e' : 'linear-gradient(90deg, #D4A843, #F2D06B)' }} />
                  </div>
                  <p className="text-xs text-text-muted">{formatCurrency(Number(goal.saved_amount))} / {formatCurrency(Number(goal.target_amount))} · {pct.toFixed(0)}%</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
