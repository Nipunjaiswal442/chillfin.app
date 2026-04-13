'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[ChillFin Dashboard Error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-bg-card border border-red-500/15 rounded-2xl p-8 text-center">
        <span className="text-4xl block mb-4">💥</span>
        <h2 className="font-playfair font-bold text-xl text-neon-white mb-2">
          Dashboard Error
        </h2>
        <p className="text-text-muted text-sm leading-relaxed mb-6">
          {error.message || 'Failed to load this page. This could be a database connection issue.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-gold/15 border border-gold/25 text-gold-light rounded-xl text-sm font-semibold hover:bg-gold/20 transition-all"
          >
            Retry
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-metallic-grey/30 border border-metallic-grey text-text-muted rounded-xl text-sm font-semibold hover:text-neon-white transition-all"
          >
            Go to Overview
          </Link>
        </div>
      </div>
    </div>
  )
}
