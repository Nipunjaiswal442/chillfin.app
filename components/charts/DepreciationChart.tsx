'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts'

export interface DepreciationPoint {
  year: number
  bookValue: number
  annualDep: number
}

/** Straight-line depreciation */
export function buildSLDepreciation(cost: number, salvage: number, years: number): DepreciationPoint[] {
  const annualDep = (cost - salvage) / years
  const points: DepreciationPoint[] = []
  for (let y = 1; y <= years; y++) {
    points.push({ year: y, bookValue: Math.max(salvage, Math.round(cost - annualDep * y)), annualDep: Math.round(annualDep) })
  }
  return points
}

/** Declining-balance depreciation */
export function buildDBDepreciation(cost: number, rate: number, years: number): DepreciationPoint[] {
  const r = rate / 100
  const points: DepreciationPoint[] = []
  let prev = cost
  for (let y = 1; y <= years; y++) {
    const dep = Math.round(prev * r)
    const val = Math.max(0, Math.round(prev - dep))
    points.push({ year: y, bookValue: val, annualDep: dep })
    prev = val
  }
  return points
}

const fmt = (v: number) =>
  v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` :
  v >= 1000   ? `₹${(v / 1000).toFixed(0)}K` : `₹${Math.round(v)}`

export function DepreciationBarChart({ data }: { data: DepreciationPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,42,56,0.8)" vertical={false} />
        <XAxis dataKey="year" tickFormatter={v => `Yr ${v}`} tick={{ fill: '#8888A0', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmt} tick={{ fill: '#8888A0', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#111118', border: '1px solid #2A2A38', borderRadius: 12, color: '#F0F0FF', fontSize: 12 }}
          formatter={(v) => fmt(Number(v ?? 0))}
          labelFormatter={l => `Year ${l}`}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: '#8888A0' }} />
        <Bar dataKey="bookValue" name="Book Value" fill="#D4A843" radius={[4, 4, 0, 0]} />
        <Bar dataKey="annualDep" name="Annual Depreciation" fill="#ef444466" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function DepreciationLineChart({ data }: { data: DepreciationPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,42,56,0.8)" />
        <XAxis dataKey="year" tickFormatter={v => `Yr ${v}`} tick={{ fill: '#8888A0', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmt} tick={{ fill: '#8888A0', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#111118', border: '1px solid #2A2A38', borderRadius: 12, color: '#F0F0FF', fontSize: 12 }}
          formatter={(v) => fmt(Number(v ?? 0))}
          labelFormatter={l => `Year ${l}`}
        />
        <Line type="monotone" dataKey="bookValue" name="Book Value" stroke="#D4A843" strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
