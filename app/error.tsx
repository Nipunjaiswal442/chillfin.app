'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[ChillFin Global Error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-3xl mx-auto mb-6">
          ⚠️
        </div>
        <h1 className="font-playfair font-bold text-2xl text-neon-white mb-2">
          Something went wrong
        </h1>
        <p className="text-text-muted text-sm leading-relaxed mb-6">
          {error.message || 'An unexpected error occurred. Please try refreshing the page.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-gold/15 border border-gold/25 text-gold-light rounded-xl text-sm font-semibold hover:bg-gold/20 transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
