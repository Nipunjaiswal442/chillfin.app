'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

export interface GrowthPoint {
  year: number
  invested: number
  value: number
}

const fmt = (v: number) =>
  v >= 10000000 ? `₹${(v / 10000000).toFixed(1)}Cr` :
  v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` :
  v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`

/** Builds year-by-year SIP compounding data */
export function buildSIPGrowthData(monthly: number, annualRate: number, years: number): GrowthPoint[] {
  const r = annualRate / 100 / 12
  const points: GrowthPoint[] = []
  for (let y = 1; y <= years; y++) {
    const n = y * 12
    const value = r === 0
      ? monthly * n
      : monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
    points.push({ year: y, invested: Math.round(monthly * n), value: Math.round(value) })
  }
  return points
}

/** Builds year-by-year lump-sum compounding data */
export function buildLumpSumGrowthData(lump: number, annualRate: number, years: number): GrowthPoint[] {
  const r = annualRate / 100
  return Array.from({ length: years }, (_, i) => ({
    year: i + 1,
    invested: lump,
    value: Math.round(lump * Math.pow(1 + r, i + 1)),
  }))
}

export default function GrowthLineChart({ data }: { data: GrowthPoint[] }) {
  if (!data.length) return null
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D4A843" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#C0C0C0" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#C0C0C0" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,42,56,0.8)" />
        <XAxis
          dataKey="year"
          tickFormatter={(v) => `Yr ${v}`}
          tick={{ fill: '#8888A0', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tickFormatter={fmt} tick={{ fill: '#8888A0', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#111118', border: '1px solid #2A2A38', borderRadius: 12, color: '#F0F0FF', fontSize: 12 }}
          formatter={(v) => fmt(Number(v ?? 0))}
          labelFormatter={(l) => `Year ${l}`}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: '#8888A0' }} />
        <Area type="monotone" dataKey="invested" name="Total Invested" stroke="#C0C0C0" strokeWidth={1.5} fill="url(#investedGrad)" dot={false} />
        <Area type="monotone" dataKey="value" name="Portfolio Value" stroke="#D4A843" strokeWidth={2.5} fill="url(#valueGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
