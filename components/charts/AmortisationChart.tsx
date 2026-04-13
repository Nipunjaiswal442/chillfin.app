'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

interface AmortisationPoint {
  month: number
  balance: number
}

const fmt = (v: number) =>
  v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`

/** Generates amortisation schedule — outstanding balance per month */
export function buildAmortisationData(principal: number, annualRate: number, months: number): AmortisationPoint[] {
  if (annualRate === 0) {
    return Array.from({ length: months + 1 }, (_, i) => ({
      month: i,
      balance: Math.max(0, principal - (principal / months) * i),
    }))
  }
  const r = annualRate / 100 / 12
  const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
  const points: AmortisationPoint[] = [{ month: 0, balance: principal }]
  let balance = principal
  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + r) - emi
    points.push({ month: m, balance: Math.max(0, balance) })
  }
  // Down-sample to max 60 points for readability
  const step = Math.ceil(points.length / 40)
  return points.filter((_, i) => i % step === 0 || i === points.length - 1)
}

export default function AmortisationChart({ data }: { data: AmortisationPoint[] }) {
  if (!data.length) return null
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,42,56,0.8)" />
        <XAxis
          dataKey="month"
          label={{ value: 'Months', position: 'insideBottom', offset: -2, fill: '#8888A0', fontSize: 10 }}
          tick={{ fill: '#8888A0', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tickFormatter={fmt} tick={{ fill: '#8888A0', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#111118', border: '1px solid #2A2A38', borderRadius: 12, color: '#F0F0FF', fontSize: 12 }}
          formatter={(v) => [`${fmt(Number(v ?? 0))}`, 'Outstanding']}
          labelFormatter={(l) => `Month ${l}`}
        />
        <ReferenceLine y={0} stroke="#2A2A38" />
        <Line type="monotone" dataKey="balance" name="Balance" stroke="#ef4444" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
