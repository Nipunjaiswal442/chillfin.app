import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  icon?: string
  trend?: 'up' | 'down' | 'neutral'
  className?: string
  children?: ReactNode
}

export default function StatCard({ label, value, sub, icon, trend, className, children }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-bg-card border border-[rgba(212,168,67,0.06)] rounded-2xl p-5 hover:border-[rgba(212,168,67,0.15)] hover:bg-bg-card-hover transition-all duration-300',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">{label}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-neon-white font-playfair">{value}</span>
        {trend && (
          <span
            className={cn(
              'text-xs font-semibold mb-1',
              trend === 'up' && 'text-green-400',
              trend === 'down' && 'text-red-400',
              trend === 'neutral' && 'text-text-muted'
            )}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'}
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
      {children}
    </div>
  )
}
