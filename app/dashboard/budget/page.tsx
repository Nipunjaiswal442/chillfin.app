'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/contexts/UserContext'
import { useTransactions } from '@/hooks/useTransactions'
import { apiGetUser, apiUpsertUser, apiGetBudgetPlan, apiUpsertBudgetPlan, BudgetPlan } from '@/lib/api-client'
import { formatCurrency, generateBudget, getCurrentMonthYear, getMonthName } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const BudgetBarChart = dynamic(() => import('@/components/charts/BudgetBarChart').then(m => ({ default: m.BudgetBarChart })), { ssr: false })
const AllocationPieChart = dynamic(() => import('@/components/charts/BudgetBarChart').then(m => ({ default: m.AllocationPieChart })), { ssr: false })

interface BudgetCategory {
  key: 'needs' | 'wants' | 'savings'
  label: string
  emoji: string
  description: string
  color: string
  pct: number
}

const BUDGET_CATS: BudgetCategory[] = [
  { key: 'needs', label: 'Needs', emoji: '🏠', description: 'Food, travel, essentials', color: '#D4A843', pct: 50 },
  { key: 'wants', label: 'Wants', emoji: '🎬', description: 'Entertainment, shopping', color: '#C0C0C0', pct: 30 },
  { key: 'savings', label: 'Save / Invest', emoji: '💎', description: 'Goals, investments', color: '#22c55e', pct: 20 },
]

export default function BudgetPage() {
  const { user } = useAuth()
  const { refetchProfile } = useUser()
  const { transactions } = useTransactions(user?.uid)
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0)
  const [incomeInput, setIncomeInput] = useState('')
  const [plan, setPlan] = useState<BudgetPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { month, year } = getCurrentMonthYear()

  useEffect(() => {
    if (!user) return
    Promise.all([
      apiGetUser(),
      apiGetBudgetPlan(month, year),
    ]).then(([{ user: u }, { budgetPlan: b }]) => {
      const income = Number(u?.monthly_pocket_money ?? 0)
      setMonthlyIncome(income)
      setIncomeInput(String(income))
      if (b) {
        setPlan(b as BudgetPlan)
      } else if (income > 0) {
        const generated = generateBudget(income)
        const newPlan: Omit<BudgetPlan, 'id' | 'firebase_uid'> = {
          month,
          year,
          needs_amount: generated.needs_amount,
          wants_amount: generated.wants_amount,
          savings_amount: generated.savings_amount,
        }
        apiUpsertBudgetPlan(newPlan).then(({ budgetPlan: data }) => {
          if (data) setPlan(data as BudgetPlan)
        })
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user, month, year])

  const handleUpdateIncome = async () => {
    if (!user) return
    const income = parseFloat(incomeInput)
    if (!income || income <= 0) return
    setSaving(true)
    const generated = generateBudget(income)
    const newPlan: Omit<BudgetPlan, 'id' | 'firebase_uid'> = {
      month,
      year,
      needs_amount: generated.needs_amount,
      wants_amount: generated.wants_amount,
      savings_amount: generated.savings_amount,
    }
    await Promise.all([
      apiUpsertUser({ monthly_pocket_money: income }),
      apiUpsertBudgetPlan(newPlan),
    ])
    setMonthlyIncome(income)
    setPlan({ firebase_uid: user.uid, ...newPlan })
    setSaving(false)
    refetchProfile()   // sync shared UserContext so dashboard reflects new budget
  }

  // Actual spending this month by category mapping
  const thisMonthTx = transactions.filter((t) => {
    const d = new Date(t.date)
    return t.type === 'expense' && d.getMonth() + 1 === month && d.getFullYear() === year
  })

  const needsCats = ['food', 'travel', 'health', 'education']
  const wantsCats = ['entertainment', 'shopping', 'misc']

  const actualNeeds = thisMonthTx
    .filter((t) => needsCats.includes(t.category))
    .reduce((s, t) => s + Number(t.amount), 0)

  const actualWants = thisMonthTx
    .filter((t) => wantsCats.includes(t.category))
    .reduce((s, t) => s + Number(t.amount), 0)

  const totalSpent = thisMonthTx.reduce((s, t) => s + Number(t.amount), 0)
  const actualSaved = Math.max(0, monthlyIncome - totalSpent)

  const actuals = {
    needs: actualNeeds,
    wants: actualWants,
    savings: actualSaved,
  }
  const budgeted = {
    needs: plan?.needs_amount ?? 0,
    wants: plan?.wants_amount ?? 0,
    savings: plan?.savings_amount ?? 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-playfair font-bold text-2xl text-neon-white">Smart Budget Planner</h1>
        <p className="text-text-muted text-sm mt-1">50/30/20 rule — personalised to your pocket money</p>
      </div>

      {/* Income input */}
      <div className="bg-bg-card border border-gold/10 rounded-2xl p-5">
        <h2 className="font-semibold text-sm text-neon-white mb-3">Monthly Pocket Money</h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              label="Monthly Income (₹)"
              type="number"
              placeholder="e.g. 5000"
              value={incomeInput}
              onChange={(e) => setIncomeInput(e.target.value)}
              prefix="₹"
            />
          </div>
          <Button onClick={handleUpdateIncome} loading={saving} size="md">
            {monthlyIncome > 0 ? 'Update & Regenerate' : 'Generate Budget'}
          </Button>
        </div>
        <p className="text-xs text-text-muted mt-2">
          We&apos;ll auto-generate a personalised 50/30/20 budget based on your income.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-bg-card rounded-2xl animate-pulse border border-metallic-grey/30" />)}
        </div>
      ) : !plan || monthlyIncome === 0 ? (
        <div className="text-center py-16 bg-bg-card border border-metallic-grey/20 rounded-2xl">
          <p className="text-4xl mb-4">📊</p>
          <p className="text-neon-white font-semibold">Set your monthly income above to generate a budget</p>
        </div>
      ) : (
        <>
          {/* Budget cards */}
          <div className="grid lg:grid-cols-3 gap-4">
            {BUDGET_CATS.map((cat) => {
              const budget = budgeted[cat.key]
              const spent = actuals[cat.key]
              const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
              const over = spent > budget
              return (
                <div key={cat.key} className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">{cat.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-neon-white">{cat.label}</p>
                      <p className="text-xs text-text-muted">{cat.pct}% · {cat.description}</p>
                    </div>
                    <span className="ml-auto text-xs font-bold" style={{ color: cat.color }}>
                      {cat.pct}%
                    </span>
                  </div>

                  <p className="text-2xl font-playfair font-bold text-neon-white mb-1">{formatCurrency(budget)}</p>
                  <p className="text-xs text-text-muted mb-3">
                    Spent: {formatCurrency(spent)} · Left: {formatCurrency(Math.max(0, budget - spent))}
                  </p>

                  <div className="h-2 bg-metallic-grey rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: over ? '#ef4444' : `linear-gradient(90deg, ${cat.color}, ${cat.color}aa)`,
                      }}
                    />
                  </div>

                  {over && (
                    <p className="text-xs text-red-400 mt-2">⚠ Over budget by {formatCurrency(spent - budget)}</p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-5">
            <h2 className="font-playfair font-bold text-base text-neon-white mb-4">{getMonthName(month)} {year} Summary</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-metallic-grey/20 rounded-xl">
                <p className="text-xs text-text-muted mb-1">Total Income</p>
                <p className="text-lg font-bold text-neon-white">{formatCurrency(monthlyIncome)}</p>
              </div>
              <div className="text-center p-4 bg-metallic-grey/20 rounded-xl">
                <p className="text-xs text-text-muted mb-1">Total Spent</p>
                <p className="text-lg font-bold text-red-400">{formatCurrency(totalSpent)}</p>
              </div>
              <div className="text-center p-4 bg-metallic-grey/20 rounded-xl">
                <p className="text-xs text-text-muted mb-1">Remaining</p>
                <p className={`text-lg font-bold ${monthlyIncome - totalSpent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(monthlyIncome - totalSpent)}
                </p>
              </div>
              <div className="text-center p-4 bg-metallic-grey/20 rounded-xl">
                <p className="text-xs text-text-muted mb-1">Savings Goal</p>
                <p className="text-lg font-bold text-gold-light">{formatCurrency(plan.savings_amount)}</p>
              </div>
            </div>
          </div>

          {/* Charts section */}
          {plan && monthlyIncome > 0 && (
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-5">
                <h2 className="font-playfair font-bold text-sm text-neon-white mb-4">Budget Allocation (50/30/20)</h2>
                <AllocationPieChart data={[
                  { name: 'Needs 50%', value: plan.needs_amount },
                  { name: 'Wants 30%', value: plan.wants_amount },
                  { name: 'Save 20%', value: plan.savings_amount },
                ]} />
              </div>
              <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-5">
                <h2 className="font-playfair font-bold text-sm text-neon-white mb-4">Actual vs Budget</h2>
                <BudgetBarChart data={[
                  { name: 'Needs', budgeted: plan.needs_amount, actual: actuals.needs, color: '#D4A843' },
                  { name: 'Wants', budgeted: plan.wants_amount, actual: actuals.wants, color: '#C0C0C0' },
                  { name: 'Savings', budgeted: plan.savings_amount, actual: actuals.savings, color: '#22c55e' },
                ]} />
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-bg-deep border border-metallic-grey/20 rounded-xl p-4">
            <p className="text-xs font-mono text-platinum leading-relaxed">
              💡 <strong>50/30/20 Rule:</strong> Allocate 50% to needs (food, rent, travel), 30% to wants (entertainment, shopping), and 20% to savings/investments. Adapted for student income by ChillFin.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
