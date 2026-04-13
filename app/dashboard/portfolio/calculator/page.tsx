'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useMemo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useUser } from '@/contexts/UserContext'
import { formatCurrency } from '@/lib/utils'
import { buildSIPGrowthData, GrowthPoint } from '@/components/charts/GrowthLineChart'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import Button from '@/components/ui/Button'

const GrowthLineChart = dynamic(() => import('@/components/charts/GrowthLineChart'), { ssr: false })

// ─── Investment option catalogue ───────────────────────────────────────────────

const OPTIONS: Record<string, {
  label: string; icon: string; defaultRate: number; minRate: number; maxRate: number
  rateLabel: string; investmentType: 'monthly' | 'monthly'; lockIn: string; tag: string
}> = {
  sip:    { label: 'SIP — Mutual Funds',         icon: '📊', defaultRate: 12,  minRate: 8,  maxRate: 18, rateLabel: '10–14% historical', investmentType: 'monthly', lockIn: 'No lock-in', tag: 'Recommended for Beginners' },
  gold:   { label: 'Digital Gold',               icon: '🥇', defaultRate: 8,   minRate: 4,  maxRate: 14, rateLabel: 'Tracks gold price',  investmentType: 'monthly', lockIn: 'Sell anytime', tag: 'Safe & Liquid' },
  liquid: { label: 'Liquid Mutual Funds',         icon: '💧', defaultRate: 6,   minRate: 4,  maxRate: 8,  rateLabel: '5–7% p.a.',          investmentType: 'monthly', lockIn: 'T+1 redemption', tag: 'Emergency Fund' },
  fd:     { label: 'Government RD / FD',          icon: '🏛️', defaultRate: 7,   minRate: 4,  maxRate: 8,  rateLabel: '4.5–7.5% p.a.',      investmentType: 'monthly', lockIn: 'Fixed tenure', tag: 'Zero Risk' },
  index:  { label: 'Index Funds (Nifty 50)',      icon: '📈', defaultRate: 11,  minRate: 8,  maxRate: 15, rateLabel: '10–12% long term',   investmentType: 'monthly', lockIn: 'No lock-in', tag: '5+ Year Horizon' },
  ppf:    { label: 'PPF',                         icon: '💼', defaultRate: 7.1, minRate: 7,  maxRate: 8,  rateLabel: '7.1% tax-free',      investmentType: 'monthly', lockIn: '15 years', tag: 'Tax Saver' },
}

// ─── Milestone years ──────────────────────────────────────────────────────────

const MILESTONES = [1, 3, 5, 10, 15, 20, 30]

function fmt(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`
  if (v >= 100000)   return `₹${(v / 100000).toFixed(2)} L`
  if (v >= 1000)     return `₹${(v / 1000).toFixed(1)} K`
  return `₹${Math.round(v)}`
}

// ─── Calculator inner (uses useSearchParams) ──────────────────────────────────

function CalculatorContent() {
  const params = useSearchParams()
  const id = params.get('id') ?? 'sip'
  const option = OPTIONS[id] ?? OPTIONS['sip']
  const { budgetPlan, profile } = useUser()

  const defaultMonthly = budgetPlan
    ? Math.round(Number(budgetPlan.savings_amount))
    : Math.round(Number(profile?.monthly_pocket_money ?? 500) * 0.2) || 500

  const [monthly, setMonthly] = useState(defaultMonthly)
  const [rate, setRate] = useState(option.defaultRate)
  const [years, setYears] = useState(10)

  const data: GrowthPoint[] = useMemo(
    () => buildSIPGrowthData(monthly, rate, years),
    [monthly, rate, years]
  )

  const finalValue = data[data.length - 1]?.value ?? 0
  const totalInvested = monthly * years * 12
  const totalGain = finalValue - totalInvested

  const milestones = MILESTONES.filter((m) => m <= years).map((m) => ({
    year: m,
    point: data.find((d) => d.year === m),
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/portfolio"
          className="w-9 h-9 rounded-xl bg-metallic-grey/40 hover:bg-metallic-grey/60 flex items-center justify-center text-text-muted hover:text-neon-white transition-all"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <p className="text-text-muted text-xs uppercase tracking-widest">Portfolio Calculator</p>
          <h1 className="font-playfair font-bold text-2xl text-neon-white">
            {option.icon} {option.label}
          </h1>
        </div>
        <span className="ml-auto text-xs px-2.5 py-1 rounded-full border border-gold/20 bg-gold/8 text-gold-light">
          {option.tag}
        </span>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ─── Inputs ────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-5 space-y-5">
            <h2 className="font-playfair font-bold text-base text-neon-white">Projection Settings</h2>

            {/* Monthly SIP */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Monthly Investment</label>
                <span className="text-sm font-bold text-gold-light">{formatCurrency(monthly)}</span>
              </div>
              <input
                type="range"
                min={100}
                max={50000}
                step={100}
                value={monthly}
                onChange={(e) => setMonthly(Number(e.target.value))}
                className="w-full accent-gold"
              />
              <div className="flex justify-between text-[10px] text-text-muted mt-1">
                <span>₹100</span><span>₹50,000</span>
              </div>
            </div>

            {/* Expected rate */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Expected Return (%/yr)</label>
                <span className="text-sm font-bold text-neon-white">{rate}%</span>
              </div>
              <input
                type="range"
                min={option.minRate}
                max={option.maxRate}
                step={0.5}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full accent-gold"
              />
              <p className="text-[10px] text-text-muted mt-1">Historical range: {option.rateLabel}</p>
            </div>

            {/* Years */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Duration</label>
                <span className="text-sm font-bold text-neon-white">{years} years</span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-gold"
              />
              <div className="flex justify-between text-[10px] text-text-muted mt-1">
                <span>1 yr</span><span>30 yrs</span>
              </div>
            </div>
          </div>

          {/* Summary stats */}
          <div className="bg-bg-card border border-gold/10 rounded-2xl p-5 space-y-3">
            <h2 className="font-playfair font-bold text-base text-neon-white mb-4">
              After {years} Year{years > 1 ? 's' : ''}
            </h2>
            {[
              { label: 'Total Invested', val: fmt(totalInvested), color: 'text-neon-white' },
              { label: 'Portfolio Value', val: fmt(finalValue), color: 'text-gold-light' },
              { label: 'Total Gains', val: fmt(totalGain), color: totalGain >= 0 ? 'text-green-400' : 'text-red-400' },
              { label: 'Return Multiple', val: `${(finalValue / Math.max(1, totalInvested)).toFixed(2)}×`, color: 'text-purple-400' },
            ].map((row) => (
              <div key={row.label} className="flex justify-between py-2 border-b border-metallic-grey/20 last:border-0">
                <span className="text-sm text-text-muted">{row.label}</span>
                <span className={`text-sm font-bold ${row.color}`}>{row.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Chart + milestones ─────────────────────────────── */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-gold" />
              <h2 className="font-playfair font-bold text-base text-neon-white">Growth Projection</h2>
            </div>
            <GrowthLineChart data={data} />
          </div>

          {/* Milestones */}
          <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-5">
            <h2 className="font-playfair font-bold text-base text-neon-white mb-4">Milestone Projections</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {milestones.map(({ year, point }) => {
                if (!point) return null
                const gain = point.value - point.invested
                return (
                  <div key={year} className="bg-metallic-grey/20 rounded-xl p-3 border border-metallic-grey/30">
                    <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Year {year}</p>
                    <p className="text-base font-playfair font-bold text-gold-light">{fmt(point.value)}</p>
                    <p className="text-[10px] text-green-400 mt-0.5">+{fmt(gain)} gain</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-bg-deep border border-metallic-grey/20 rounded-xl p-4">
            <p className="text-[10px] font-mono text-platinum leading-relaxed">
              ⚠ Projections are illustrative and based on constant returns at the selected rate. Actual returns vary. Mutual fund investments are subject to market risks. Past performance does not guarantee future results. This is not investment advice. Consult a SEBI-registered advisor.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page with Suspense wrapper for useSearchParams ───────────────────────────

export default function PortfolioCalculatorPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-bg-card rounded-xl" />
        <div className="h-80 w-full bg-bg-card rounded-2xl" />
      </div>
    }>
      <CalculatorContent />
    </Suspense>
  )
}
