'use client'

import { useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import { buildInsights, InsightTransaction } from '@/lib/insights'
import { formatCurrency } from '@/lib/utils'

interface SmartInsightsProps {
  transactions: InsightTransaction[]
  /** Needs + wants for this month; 0 when no budget is set */
  spendingBudget: number
}

export default function SmartInsights({ transactions, spendingBudget }: SmartInsightsProps) {
  const { monthEnd, nextMonth, unusual } = useMemo(() => buildInsights(transactions), [transactions])
  if (monthEnd.spentSoFar === 0 && !nextMonth) return null

  const overBy = spendingBudget > 0 ? monthEnd.projected - spendingBudget : 0

  return (
    <div className="bg-bg-card border border-[rgba(212,168,67,0.06)] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-playfair font-bold text-base text-neon-white flex items-center gap-2">
          <Sparkles size={15} className="text-gold" /> Smart Insights
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gold bg-gold/10 border border-gold/20 px-1.5 py-0.5 rounded-full">
          Beta
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="bg-metallic-grey/20 border border-metallic-grey/20 rounded-xl p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">Month-end projection</p>
          <p className="text-lg font-bold text-neon-white">{formatCurrency(monthEnd.projected)}</p>
          <p className="text-[11px] text-text-muted mt-0.5">
            {formatCurrency(monthEnd.spentSoFar)} spent by day {monthEnd.dayOfMonth} of {monthEnd.daysInMonth}
          </p>
          {spendingBudget > 0 && (
            <p className={`text-[11px] mt-1 font-semibold ${overBy > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {overBy > 0
                ? `On pace to exceed budget by ${formatCurrency(overBy)}`
                : `On pace to stay ${formatCurrency(-overBy)} under budget`}
            </p>
          )}
        </div>

        <div className="bg-metallic-grey/20 border border-metallic-grey/20 rounded-xl p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">Next month forecast</p>
          {nextMonth ? (
            <>
              <p className="text-lg font-bold text-neon-white">{formatCurrency(nextMonth.value)}</p>
              <p className="text-[11px] text-text-muted mt-0.5">
                {nextMonth.high > nextMonth.low && `Likely ${formatCurrency(nextMonth.low)}–${formatCurrency(nextMonth.high)} · `}
                based on {nextMonth.basedOnMonths} months
              </p>
            </>
          ) : (
            <p className="text-xs text-text-muted mt-1">Log expenses for 2 full months to unlock a forecast.</p>
          )}
        </div>
      </div>

      {unusual.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {unusual.map((u) => (
            <p key={u.category} className="text-xs text-orange-400">
              ⚠ {u.label} is running high: ~{formatCurrency(u.projected)} this month vs your usual {formatCurrency(u.typical)}
            </p>
          ))}
        </div>
      )}

      <p className="text-[10px] text-text-muted mt-3">Statistical estimates from your own history — not financial advice.</p>
    </div>
  )
}
