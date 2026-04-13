'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { buildSLDepreciation, buildDBDepreciation } from '@/components/charts/DepreciationChart'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, ChevronDown } from 'lucide-react'

const DepreciationBarChart = dynamic(
  () => import('@/components/charts/DepreciationChart').then(m => ({ default: m.DepreciationBarChart })),
  { ssr: false }
)
const DepreciationLineChart = dynamic(
  () => import('@/components/charts/DepreciationChart').then(m => ({ default: m.DepreciationLineChart })),
  { ssr: false }
)

type Method = 'straight-line' | 'declining-balance'

const ASSET_PRESETS = [
  { label: '🏍️ Two-Wheeler (Hero Splendor)', cost: 70000, rate: 15, years: 10, method: 'declining-balance' as Method },
  { label: '💻 Laptop', cost: 60000, rate: 33, years: 5, method: 'declining-balance' as Method },
  { label: '📱 Smartphone', cost: 25000, rate: 35, years: 4, method: 'declining-balance' as Method },
  { label: '📷 DSLR Camera', cost: 40000, rate: 20, years: 7, method: 'declining-balance' as Method },
  { label: '🛵 Scooter', cost: 90000, rate: 12, years: 12, method: 'declining-balance' as Method },
  { label: '🖨️ Printer / Equipment', cost: 15000, rate: 33, years: 4, method: 'straight-line' as Method },
]

export default function DepreciationCalculatorPage() {
  const [assetName, setAssetName] = useState('My Laptop')
  const [cost, setCost] = useState(60000)
  const [salvage, setSalvage] = useState(5000)
  const [rate, setRate] = useState(33)
  const [years, setYears] = useState(5)
  const [method, setMethod] = useState<Method>('declining-balance')
  const [showPresets, setShowPresets] = useState(false)

  const data = useMemo(() =>
    method === 'straight-line'
      ? buildSLDepreciation(cost, salvage, years)
      : buildDBDepreciation(cost, rate, years),
    [cost, salvage, rate, years, method]
  )

  const totalDep = cost - (data[data.length - 1]?.bookValue ?? 0)
  const finalValue = data[data.length - 1]?.bookValue ?? 0
  const retentionPct = ((finalValue / cost) * 100).toFixed(1)

  const fmt = (v: number) =>
    v >= 100000 ? `₹${(v / 100000).toFixed(2)} L` :
    v >= 1000   ? `₹${(v / 1000).toFixed(1)} K` : `₹${Math.round(v)}`

  const applyPreset = (p: typeof ASSET_PRESETS[0]) => {
    setAssetName(p.label.slice(3))
    setCost(p.cost)
    setRate(p.rate)
    setYears(p.years)
    setMethod(p.method)
    setSalvage(Math.round(p.cost * 0.05))
    setShowPresets(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/tools" className="w-9 h-9 rounded-xl bg-metallic-grey/40 hover:bg-metallic-grey/60 flex items-center justify-center text-text-muted hover:text-neon-white transition-all">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <p className="text-text-muted text-xs uppercase tracking-widest">Tools</p>
          <h1 className="font-playfair font-bold text-2xl text-neon-white">📉 Asset Depreciation</h1>
        </div>
      </div>

      <p className="text-text-muted text-sm leading-relaxed">
        Track how your asset loses value each year. Use this to plan resale timing, replacement costs, or account for real ownership costs.
      </p>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ─── Inputs ────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Presets */}
          <div className="relative">
            <button
              onClick={() => setShowPresets(p => !p)}
              className="w-full flex items-center justify-between px-4 py-3 bg-bg-card border border-metallic-grey/20 rounded-xl text-sm text-text-muted hover:text-neon-white transition-all"
            >
              <span>📦 Load Asset Preset</span>
              <ChevronDown size={14} className={`transition-transform ${showPresets ? 'rotate-180' : ''}`} />
            </button>
            {showPresets && (
              <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-bg-card border border-metallic-grey/30 rounded-xl overflow-hidden shadow-2xl">
                {ASSET_PRESETS.map(p => (
                  <button key={p.label} onClick={() => applyPreset(p)}
                    className="w-full text-left px-4 py-2.5 text-xs text-text-muted hover:text-neon-white hover:bg-metallic-grey/30 transition-colors border-b border-metallic-grey/15 last:border-0">
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-5 space-y-4">
            <h2 className="font-playfair font-bold text-base text-neon-white">Asset Details</h2>

            {/* Asset name */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted block mb-1.5">Asset Name</label>
              <input
                type="text" value={assetName} onChange={e => setAssetName(e.target.value)}
                placeholder="e.g. Hero Splendor"
                className="w-full bg-bg-deep border border-metallic-grey/40 rounded-xl px-4 py-2.5 text-sm text-neon-white focus:outline-none focus:border-gold/50 placeholder:text-text-muted"
              />
            </div>

            {/* Method */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted block mb-1.5">Depreciation Method</label>
              <div className="flex rounded-xl overflow-hidden border border-metallic-grey/40">
                {(['straight-line', 'declining-balance'] as Method[]).map(m => (
                  <button key={m} onClick={() => setMethod(m)}
                    className={`flex-1 py-2 text-xs font-semibold transition-all ${method === m ? 'bg-gold/15 text-gold-light' : 'text-text-muted hover:text-neon-white'}`}>
                    {m === 'straight-line' ? 'Straight Line' : 'Declining Balance'}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-text-muted mt-1">
                {method === 'straight-line' ? 'Equal amount deducted each year. Common for furniture & equipment.' : 'Fixed % of current value each year. Common for vehicles & electronics.'}
              </p>
            </div>

            {/* Purchase cost */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Purchase Cost</label>
                <span className="text-sm font-bold text-neon-white">{formatCurrency(cost)}</span>
              </div>
              <input type="range" min={1000} max={1000000} step={1000} value={cost}
                onChange={e => setCost(Number(e.target.value))} className="w-full accent-gold" />
            </div>

            {/* Rate (only for declining balance) */}
            {method === 'declining-balance' ? (
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Dep. Rate (%/year)</label>
                  <span className="text-sm font-bold text-neon-white">{rate}%</span>
                </div>
                <input type="range" min={5} max={50} step={1} value={rate}
                  onChange={e => setRate(Number(e.target.value))} className="w-full accent-gold" />
                <div className="flex justify-between text-[10px] text-text-muted mt-1"><span>5%</span><span>50%</span></div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Salvage Value</label>
                  <span className="text-sm font-bold text-neon-white">{formatCurrency(salvage)}</span>
                </div>
                <input type="range" min={0} max={Math.round(cost * 0.5)} step={500} value={salvage}
                  onChange={e => setSalvage(Number(e.target.value))} className="w-full accent-gold" />
              </div>
            )}

            {/* Years */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Useful Life</label>
                <span className="text-sm font-bold text-neon-white">{years} years</span>
              </div>
              <input type="range" min={1} max={20} step={1} value={years}
                onChange={e => setYears(Number(e.target.value))} className="w-full accent-gold" />
              <div className="flex justify-between text-[10px] text-text-muted mt-1"><span>1 yr</span><span>20 yrs</span></div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-bg-card border border-gold/10 rounded-2xl p-5 space-y-3">
            <h2 className="font-playfair font-bold text-base text-neon-white mb-3">{assetName} — Summary</h2>
            {[
              { label: 'Purchase Cost', val: fmt(cost), color: 'text-neon-white' },
              { label: `Value After ${years} Yrs`, val: fmt(finalValue), color: 'text-gold-light' },
              { label: 'Total Depreciation', val: fmt(totalDep), color: 'text-red-400' },
              { label: 'Value Retention', val: `${retentionPct}%`, color: Number(retentionPct) > 40 ? 'text-green-400' : 'text-orange-400' },
            ].map(r => (
              <div key={r.label} className="flex justify-between py-2 border-b border-metallic-grey/20 last:border-0">
                <span className="text-sm text-text-muted">{r.label}</span>
                <span className={`text-sm font-bold ${r.color}`}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Charts + table ──────────────────── */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-5">
            <h2 className="font-playfair font-bold text-sm text-neon-white mb-4">Book Value Over Time</h2>
            <DepreciationLineChart data={data} />
          </div>
          <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-5">
            <h2 className="font-playfair font-bold text-sm text-neon-white mb-4">Annual Book Value vs Depreciation</h2>
            <DepreciationBarChart data={data} />
          </div>

          {/* Year table */}
          <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-5">
            <h2 className="font-playfair font-bold text-sm text-neon-white mb-4">Year-by-Year Schedule</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-text-muted border-b border-metallic-grey/30">
                    <th className="text-left pb-2">Year</th>
                    <th className="text-right pb-2">Annual Dep.</th>
                    <th className="text-right pb-2">Book Value</th>
                    <th className="text-right pb-2">% of Original</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(row => (
                    <tr key={row.year} className="border-b border-metallic-grey/15 hover:bg-metallic-grey/10">
                      <td className="py-1.5 text-text-muted">Yr {row.year}</td>
                      <td className="py-1.5 text-right text-red-400 font-medium">{fmt(row.annualDep)}</td>
                      <td className="py-1.5 text-right text-gold-light font-medium">{fmt(row.bookValue)}</td>
                      <td className="py-1.5 text-right text-text-muted">{((row.bookValue / cost) * 100).toFixed(1)}%</td>
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
