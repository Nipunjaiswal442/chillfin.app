'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts'

export interface InflationPoint {
  year: number
  purchasingPower: number   // real value of original ₹ amount
  requiredSavings: number   // how much needed to match today's value
}

/** Build year-by-year inflation erosion data */
export function buildInflationData(amount: number, rate: number, years: number): InflationPoint[] {
  const r = rate / 100
  return Array.from({ length: years }, (_, i) => {
    const y = i + 1
    return {
      year: y,
      purchasingPower: Math.round(amount / Math.pow(1 + r, y)),
      requiredSavings: Math.round(amount * Math.pow(1 + r, y)),
    }
  })
}

const fmt = (v: number) =>
  v >= 10000000 ? `₹${(v / 10000000).toFixed(1)}Cr` :
  v >= 100000   ? `₹${(v / 100000).toFixed(1)}L` :
  v >= 1000     ? `₹${(v / 1000).toFixed(0)}K` : `₹${Math.round(v)}`

export default function InflationChart({ data }: { data: InflationPoint[] }) {
  if (!data.length) return null
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,42,56,0.8)" />
        <XAxis dataKey="year" tickFormatter={v => `Yr ${v}`} tick={{ fill: '#8888A0', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmt} tick={{ fill: '#8888A0', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#111118', border: '1px solid #2A2A38', borderRadius: 12, color: '#F0F0FF', fontSize: 12 }}
          formatter={(v) => fmt(Number(v ?? 0))}
          labelFormatter={l => `Year ${l}`}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: '#8888A0' }} />
        <Line type="monotone" dataKey="purchasingPower" name="Purchasing Power" stroke="#ef4444" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="requiredSavings" name="Amount Needed (Future)" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={false} />
        <ReferenceLine y={data[0]?.purchasingPower ?? 0} stroke="#2A2A38" strokeDasharray="4 4" />
      </LineChart>
    </ResponsiveContainer>
  )
}
