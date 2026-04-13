'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

const fmt = (v: number) =>
  v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`

interface BudgetBarData {
  name: string
  budgeted: number
  actual: number
  color: string
}

interface AllocationData {
  name: string
  value: number
}

// ─── Actual vs Budget bar chart ────────────────────────────────────────────────

export function BudgetBarChart({ data }: { data: BudgetBarData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,42,56,0.8)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: '#8888A0', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmt} tick={{ fill: '#8888A0', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#111118', border: '1px solid #2A2A38', borderRadius: 12, color: '#F0F0FF', fontSize: 12 }}
          formatter={(v) => fmt(Number(v ?? 0))}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: '#8888A0' }} />
        <Bar dataKey="budgeted" name="Budget" fill="#2A2A38" radius={[4, 4, 0, 0]} />
        <Bar dataKey="actual" name="Spent" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.actual > d.budgeted ? '#ef4444' : '#D4A843'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Allocation pie (50/30/20) ─────────────────────────────────────────────────

const PIE_COLORS = ['#D4A843', '#C0C0C0', '#22c55e']

export function AllocationPieChart({ data }: { data: AllocationData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={4}
          dataKey="value"
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={{ stroke: '#2A2A38' }}
        >
          {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#111118', border: '1px solid #2A2A38', borderRadius: 12, color: '#F0F0FF', fontSize: 12 }}
          formatter={(v) => fmt(Number(v ?? 0))}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
