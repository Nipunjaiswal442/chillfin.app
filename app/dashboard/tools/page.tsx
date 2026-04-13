'use client'

import Link from 'next/link'
import { TrendingDown, Flame } from 'lucide-react'

const TOOLS = [
  {
    href: '/dashboard/tools/inflation',
    icon: '🔥',
    title: 'Inflation Calculator',
    desc: 'See how inflation silently erodes your purchasing power over time and how much you need to beat it.',
    badge: 'India avg 6% p.a.',
    badgeColor: 'border-red-400/20 bg-red-500/8 text-red-400',
    lucide: Flame,
  },
  {
    href: '/dashboard/tools/depreciation',
    icon: '📉',
    title: 'Asset Depreciation',
    desc: 'Track how your bike, laptop, or phone loses value each year. Plan resale timing and replacement costs.',
    badge: 'Straight-line & Declining',
    badgeColor: 'border-gold/20 bg-gold/8 text-gold-light',
    lucide: TrendingDown,
  },
]

export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-playfair font-bold text-2xl text-neon-white">Financial Tools</h1>
        <p className="text-text-muted text-sm mt-1">Calculators to help you understand the true cost and value of money</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {TOOLS.map(tool => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group bg-bg-card border border-metallic-grey/20 rounded-2xl p-6 hover:border-gold/20 hover:bg-bg-card-hover transition-all duration-300 flex flex-col gap-4"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gold/8 border border-gold/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {tool.icon}
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border ${tool.badgeColor}`}>
                {tool.badge}
              </span>
            </div>
            <div>
              <h2 className="font-playfair font-bold text-lg text-neon-white group-hover:text-gold-light transition-colors mb-1">{tool.title}</h2>
              <p className="text-xs text-text-muted leading-relaxed">{tool.desc}</p>
            </div>
            <span className="text-xs text-gold-light flex items-center gap-1 mt-auto">
              Open Calculator →
            </span>
          </Link>
        ))}
      </div>

      <div className="bg-gradient-to-br from-gold/5 to-transparent border border-gold/10 rounded-2xl p-5">
        <p className="text-xs text-text-muted font-mono leading-relaxed">
          💡 <strong className="text-gold-light">Pro tip:</strong> Use the Inflation Calculator alongside the Portfolio Calculator — invest at a rate that beats inflation to build real wealth over time. Even a 6% SIP return doesn&apos;t grow your wealth if inflation is also 6%.
        </p>
      </div>
    </div>
  )
}
