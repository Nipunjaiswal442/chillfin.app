'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface EMIBreakdownProps {
  principal: number
  totalInterest: number
}

const fmt = (v: number) =>
  v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`

export default function EMIBreakdownChart({ principal, totalInterest }: EMIBreakdownProps) {
  const data = [
    { name: 'Principal', value: Math.round(principal) },
    { name: 'Total Interest', value: Math.round(totalInterest) },
  ]
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={52}
          outerRadius={80}
          paddingAngle={4}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
        >
          <Cell fill="#D4A843" />
          <Cell fill="#ef4444" />
        </Pie>
        <Tooltip
          contentStyle={{ background: '#111118', border: '1px solid #2A2A38', borderRadius: 12, color: '#F0F0FF', fontSize: 12 }}
          formatter={(v) => fmt(Number(v ?? 0))}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#8888A0' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
