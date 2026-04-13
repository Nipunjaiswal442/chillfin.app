'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { buildInflationData } from '@/components/charts/InflationChart'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, TrendingDown } from 'lucide-react'

const InflationChart = dynamic(() => import('@/components/charts/InflationChart'), { ssr: false })

const INDIA_INFLATION_RATE = 6   // average CPI India

export default function InflationCalculatorPage() {
  const [amount, setAmount] = useState(10000)
  const [rate, setRate] = useState(INDIA_INFLATION_RATE)
  const [years, setYears] = useState(10)

  const data = useMemo(() => buildInflationData(amount, rate, years), [amount, rate, years])

  const finalPower  = data[data.length - 1]?.purchasingPower ?? amount
  const finalNeeded = data[data.length - 1]?.requiredSavings ?? amount
  const erosion     = amount - finalPower
  const erosionPct  = ((erosion / amount) * 100).toFixed(1)

  const fmt = (v: number) =>
    v >= 10000000 ? `₹${(v / 10000000).toFixed(2)} Cr` :
    v >= 100000   ? `₹${(v / 100000).toFixed(2)} L` :
    v >= 1000     ? `₹${(v / 1000).toFixed(2)} K` : `₹${Math.round(v)}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/tools" className="w-9 h-9 rounded-xl bg-metallic-grey/40 hover:bg-metallic-grey/60 flex items-center justify-center text-text-muted hover:text-neon-white transition-all">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <p className="text-text-muted text-xs uppercase tracking-widest">Tools</p>
          <h1 className="font-playfair font-bold text-2xl text-neon-white">🔥 Inflation Calculator</h1>
        </div>
        <span className="ml-auto text-xs px-2.5 py-1 rounded-full border border-red-400/20 bg-red-500/8 text-red-400">
          India avg: {INDIA_INFLATION_RATE}% p.a.
        </span>
      </div>

      <p className="text-text-muted text-sm leading-relaxed">
        Understand how inflation silently erodes your money&apos;s purchasing power over time — and how much you need to earn just to stay even.
      </p>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ─── Inputs ────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-5 space-y-5">
            <h2 className="font-playfair font-bold text-base text-neon-white">Settings</h2>

            {/* Amount */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Today&apos;s Amount</label>
                <span className="text-sm font-bold text-neon-white">{formatCurrency(amount)}</span>
              </div>
              <input type="range" min={500} max={1000000} step={500} value={amount}
                onChange={e => setAmount(Number(e.target.value))} className="w-full accent-red-400" />
              <div className="flex justify-between text-[10px] text-text-muted mt-1"><span>₹500</span><span>₹10 L</span></div>
            </div>

            {/* Inflation rate */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Annual Inflation Rate</label>
                <span className="text-sm font-bold text-neon-white">{rate}%</span>
              </div>
              <input type="range" min={2} max={15} step={0.5} value={rate}
                onChange={e => setRate(Number(e.target.value))} className="w-full accent-red-400" />
              <div className="flex justify-between text-[10px] text-text-muted mt-1"><span>2%</span><span>15%</span></div>
            </div>

            {/* Years */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Time Horizon</label>
                <span className="text-sm font-bold text-neon-white">{years} years</span>
              </div>
              <input type="range" min={1} max={40} step={1} value={years}
                onChange={e => setYears(Number(e.target.value))} className="w-full accent-red-400" />
              <div className="flex justify-between text-[10px] text-text-muted mt-1"><span>1 yr</span><span>40 yrs</span></div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-bg-card border border-red-400/10 rounded-2xl p-5 space-y-3">
            <h2 className="font-playfair font-bold text-base text-neon-white mb-4">After {years} Year{years > 1 ? 's' : ''}</h2>
            {[
              { label: "Today's Value", val: fmt(amount), color: 'text-neon-white' },
              { label: 'Purchasing Power Left', val: fmt(finalPower), color: 'text-red-400' },
              { label: 'Purchasing Power Lost', val: `${fmt(erosion)} (${erosionPct}%)`, color: 'text-red-400' },
              { label: 'Amount Needed to Match', val: fmt(finalNeeded), color: 'text-green-400' },
            ].map(r => (
              <div key={r.label} className="flex justify-between py-2 border-b border-metallic-grey/20 last:border-0">
                <span className="text-sm text-text-muted">{r.label}</span>
                <span className={`text-sm font-bold ${r.color}`}>{r.val}</span>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="bg-bg-deep border border-metallic-grey/20 rounded-xl p-4">
            <p className="text-[10px] font-mono text-platinum leading-relaxed">
              ⚠ India&apos;s CPI inflation has averaged ~6% p.a. over 2015–2024. These are estimates only. Actual inflation varies by category and year.
            </p>
          </div>
        </div>

        {/* ─── Chart + milestone table ─────────────── */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown size={16} className="text-red-400" />
              <h2 className="font-playfair font-bold text-base text-neon-white">Purchasing Power vs Required Savings</h2>
            </div>
            <InflationChart data={data} />
          </div>

          {/* Year milestones */}
          <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-5">
            <h2 className="font-playfair font-bold text-base text-neon-white mb-4">Year-by-Year Snapshot</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-text-muted border-b border-metallic-grey/30">
                    <th className="text-left pb-2">Year</th>
                    <th className="text-right pb-2">Purchasing Power</th>
                    <th className="text-right pb-2">Amount Needed</th>
                    <th className="text-right pb-2">Power Lost</th>
                  </tr>
                </thead>
                <tbody>
                  {data.filter((_, i) => [0, 1, 2, 4, 9, 14, 19, 29, 39].includes(i)).map(row => (
                    <tr key={row.year} className="border-b border-metallic-grey/15 hover:bg-metallic-grey/10">
                      <td className="py-2 text-text-muted">Yr {row.year}</td>
                      <td className="py-2 text-right text-red-400 font-medium">{fmt(row.purchasingPower)}</td>
                      <td className="py-2 text-right text-green-400 font-medium">{fmt(row.requiredSavings)}</td>
                      <td className="py-2 text-right text-text-muted">{fmt(amount - row.purchasingPower)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
