'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/hooks/useAuth'
import { apiGetUser, apiSaveEMICalculation, apiGetEMIHistory, EMICalculation } from '@/lib/api-client'
import { formatCurrency, formatDate, calculateEMI, calculateAffordabilityScore, getAffordabilityLabel } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { buildAmortisationData } from '@/components/charts/AmortisationChart'

const EMIBreakdownChart = dynamic(() => import('@/components/charts/EMIBreakdownChart'), { ssr: false })
const AmortisationChart = dynamic(() => import('@/components/charts/AmortisationChart'), { ssr: false })

export default function EMIPage() {
  const { user } = useAuth()
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0)
  const [history, setHistory] = useState<EMICalculation[]>([])
  const [calculating, setCalculating] = useState(false)

  const [form, setForm] = useState({
    item_name: '',
    principal: '',
    interest_rate: '',
    tenure_months: '',
  })

  const [result, setResult] = useState<{
    monthlyEMI: number
    totalCost: number
    totalInterest: number
    affordabilityScore: number
    monthlyLeft: number
  } | null>(null)

  useEffect(() => {
    if (!user) return
    apiGetUser().then(({ user: u }) => setMonthlyIncome(Number(u?.monthly_pocket_money ?? 0)))
    apiGetEMIHistory().then(({ emiHistory }) => setHistory(emiHistory || []))
  }, [user])

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    const P = parseFloat(form.principal)
    const r = parseFloat(form.interest_rate)
    const n = parseInt(form.tenure_months)
    if (!P || !n) return

    setCalculating(true)
    const { monthlyEMI, totalCost, totalInterest } = calculateEMI(P, r || 0, n)
    const affordabilityScore = calculateAffordabilityScore(monthlyEMI, monthlyIncome)
    const monthlyLeft = monthlyIncome - monthlyEMI

    setResult({ monthlyEMI, totalCost, totalInterest, affordabilityScore, monthlyLeft })

    // Save to history
    if (user) {
      const calc: Omit<EMICalculation, 'id' | 'created_at' | 'firebase_uid'> = {
        item_name: form.item_name || undefined,
        principal: P,
        interest_rate: r || 0,
        tenure_months: n,
        monthly_emi: monthlyEMI,
        total_cost: totalCost,
        affordability_score: affordabilityScore,
      }
      const { emiCalculation } = await apiSaveEMICalculation(calc)
      if (emiCalculation) setHistory((prev) => [emiCalculation, ...prev.slice(0, 9)])
    }
    setCalculating(false)
  }

  const affordInfo = result ? getAffordabilityLabel(result.affordabilityScore) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-playfair font-bold text-2xl text-neon-white">EMI Advisor</h1>
        <p className="text-text-muted text-sm mt-1">Know the real cost before committing to any EMI</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calculator */}
        <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-6">
          <h2 className="font-playfair font-bold text-base text-neon-white mb-4">EMI Calculator</h2>
          <form onSubmit={handleCalculate} className="space-y-4">
            <Input
              label="What are you buying? (optional)"
              placeholder="e.g. Laptop, Bike, Phone"
              value={form.item_name}
              onChange={(e) => setForm((f) => ({ ...f, item_name: e.target.value }))}
            />
            <Input
              label="Loan Amount (₹)"
              type="number"
              placeholder="50000"
              prefix="₹"
              value={form.principal}
              onChange={(e) => setForm((f) => ({ ...f, principal: e.target.value }))}
              required
            />
            <Input
              label="Annual Interest Rate (%)"
              type="number"
              placeholder="12"
              step="0.1"
              value={form.interest_rate}
              onChange={(e) => setForm((f) => ({ ...f, interest_rate: e.target.value }))}
            />
            <Input
              label="Tenure (months)"
              type="number"
              placeholder="12"
              value={form.tenure_months}
              onChange={(e) => setForm((f) => ({ ...f, tenure_months: e.target.value }))}
              required
            />
            {monthlyIncome === 0 && (
              <p className="text-xs text-gold-dark bg-gold/5 border border-gold/15 rounded-lg px-3 py-2">
                💡 Set your monthly pocket money in Budget Planner to get an affordability score.
              </p>
            )}
            <Button type="submit" className="w-full" loading={calculating}>
              Calculate EMI
            </Button>
          </form>
        </div>

        {/* Result */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Affordability score */}
              <div className={`bg-bg-card border rounded-2xl p-5 ${affordInfo && result.affordabilityScore >= 50 ? 'border-green-500/20' : 'border-red-500/20'}`}>
                <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Affordability Score</p>
                <div className="flex items-end gap-3 mb-3">
                  <span className="text-5xl font-playfair font-black" style={{ color: affordInfo?.color }}>
                    {result.affordabilityScore}
                  </span>
                  <span className="text-lg font-bold mb-1" style={{ color: affordInfo?.color }}>/100 — {affordInfo?.label}</span>
                </div>
                <div className="h-3 bg-metallic-grey rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${result.affordabilityScore}%`, background: affordInfo?.color }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-2">
                  {result.affordabilityScore >= 75 ? 'This EMI fits comfortably within your income.' :
                    result.affordabilityScore >= 50 ? 'Manageable but will impact your budget.' :
                    result.affordabilityScore >= 25 ? 'Risky — this will strain your finances.' :
                    'This EMI exceeds safe borrowing limits for your income.'}
                </p>
              </div>

              {/* Breakdown */}
              <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Breakdown</p>
                {[
                  { label: 'Monthly EMI', value: formatCurrency(result.monthlyEMI), highlight: true },
                  { label: 'Total Amount Paid', value: formatCurrency(result.totalCost) },
                  { label: 'Total Interest', value: formatCurrency(result.totalInterest), color: 'text-red-400' },
                  ...(monthlyIncome > 0 ? [{ label: 'Monthly Left After EMI', value: formatCurrency(result.monthlyLeft), color: result.monthlyLeft >= 0 ? 'text-green-400' : 'text-red-400' }] : []),
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-metallic-grey/20 last:border-0">
                    <span className="text-sm text-text-muted">{row.label}</span>
                    <span className={`text-sm font-bold ${row.highlight ? 'text-gold-light' : row.color ?? 'text-neon-white'}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
              {/* EMI Charts */}
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-5">
                  <h3 className="font-playfair font-bold text-sm text-neon-white mb-3">Principal vs Interest</h3>
                  <EMIBreakdownChart principal={parseFloat(form.principal) || 0} totalInterest={result.totalInterest} />
                </div>
                <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-5">
                  <h3 className="font-playfair font-bold text-sm text-neon-white mb-3">Balance Over Time</h3>
                  <AmortisationChart data={buildAmortisationData(
                    parseFloat(form.principal) || 0,
                    parseFloat(form.interest_rate) || 0,
                    parseInt(form.tenure_months) || 1
                  )} />
                </div>
              </div>
            </>
          ) : (
            <div className="h-full min-h-[280px] bg-bg-card border border-metallic-grey/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center">
              <span className="text-4xl">⚡</span>
              <p className="text-neon-white font-semibold">Enter loan details to calculate</p>
              <p className="text-text-muted text-sm">You&apos;ll see your monthly EMI, total cost, interest paid, and a personalised affordability score.</p>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-5">
          <h2 className="font-playfair font-bold text-base text-neon-white mb-4">Recent Calculations</h2>
          <div className="space-y-2">
            {history.map((h) => {
              const info = getAffordabilityLabel(h.affordability_score)
              return (
                <div key={h.id} className="flex items-center justify-between py-3 border-b border-metallic-grey/20 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-neon-white">{h.item_name || 'Loan'}</p>
                    <p className="text-xs text-text-muted">
                      {formatCurrency(h.principal)} · {h.tenure_months}m · {h.interest_rate}% p.a.
                    </p>
                    {h.created_at && <p className="text-xs text-text-muted">{formatDate(h.created_at)}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gold-light">{formatCurrency(h.monthly_emi)}/mo</p>
                    <p className="text-xs font-semibold" style={{ color: info.color }}>{info.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-bg-deep border border-metallic-grey/20 rounded-xl p-4">
        <p className="text-xs font-mono text-platinum leading-relaxed">
          ⚠ EMI calculations are for educational purposes only. Actual EMIs may vary based on lender terms, processing fees, and credit score. Always read the full loan agreement before signing.
        </p>
      </div>
    </div>
  )
}
