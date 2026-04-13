'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Wallet,
  PieChart,
  Target,
  Calculator,
  TrendingUp,
  Bot,
  LogOut,
  Menu,
  X,
  Wrench,
} from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard',           label: 'Overview',   icon: LayoutDashboard, exact: true },
  { href: '/dashboard/tracker',   label: 'Tracker',    icon: Wallet,          exact: false },
  { href: '/dashboard/budget',    label: 'Budget',     icon: PieChart,        exact: false },
  { href: '/dashboard/goals',     label: 'Goals',      icon: Target,          exact: false },
  { href: '/dashboard/emi',       label: 'EMI Advisor',icon: Calculator,      exact: false },
  { href: '/dashboard/portfolio', label: 'Portfolio',  icon: TrendingUp,      exact: false },
  { href: '/dashboard/tools',     label: 'Tools',      icon: Wrench,          exact: false },
  { href: '/dashboard/advisor',   label: 'AI Advisor', icon: Bot,             exact: false },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-metallic-grey">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center font-playfair font-black text-bg-deep text-base">
          C
        </div>
        <span className="font-playfair font-bold text-lg bg-gradient-to-r from-gold-light to-gold bg-clip-text text-transparent">
          ChillFin
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-gradient-to-r from-gold/15 to-gold-dark/10 text-gold-light border border-gold/15'
                  : 'text-text-muted hover:text-neon-white hover:bg-metallic-grey/50'
              )}
            >
              <Icon size={16} />
              {label}
              {label === 'AI Advisor' && (
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-gold bg-gold/10 border border-gold/20 px-1.5 py-0.5 rounded-full">
                  Pro
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-metallic-grey">
        {user && (
          <div className="flex items-center gap-3 px-2 mb-3">
            {user.photoURL ? (
              <img src={user.photoURL} alt="avatar" className="w-7 h-7 rounded-full" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-bold">
                {user.displayName?.[0] ?? 'U'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-neon-white truncate">{user.displayName}</p>
              <p className="text-[10px] text-text-muted truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden bg-bg-card border border-metallic-grey rounded-xl p-2 text-text-muted hover:text-gold"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-40 w-56 bg-bg-card border-r border-metallic-grey flex flex-col transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-56 bg-bg-card border-r border-metallic-grey flex-col z-30">
        <NavContent />
      </aside>
    </>
  )
}
