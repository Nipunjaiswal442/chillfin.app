'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'

interface GoalBar {
  name: string
  saved: number
  remaining: number
  pct: number
}

const fmt = (v: number) =>
  v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`

export default function GoalProgressChart({ data }: { data: GoalBar[] }) {
  if (!data.length) return null
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 48)}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 40, left: 0, bottom: 0 }}
        barCategoryGap="25%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,42,56,0.8)" horizontal={false} />
        <XAxis type="number" tickFormatter={fmt} tick={{ fill: '#8888A0', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fill: '#8888A0', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
        <Tooltip
          contentStyle={{ background: '#111118', border: '1px solid #2A2A38', borderRadius: 12, color: '#F0F0FF', fontSize: 12 }}
          formatter={(v) => fmt(Number(v ?? 0))}
        />
        <Bar dataKey="saved" name="Saved" stackId="a" radius={[0, 0, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.pct >= 100 ? '#22c55e' : '#D4A843'} />
          ))}
        </Bar>
        <Bar dataKey="remaining" name="Remaining" stackId="a" fill="#2A2A38" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
