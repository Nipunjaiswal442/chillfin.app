'use client'

import { ReactNode, useCallback, useMemo } from 'react'
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react'
import { useAuth } from '@/hooks/useAuth'

// Set automatically by `npx convex deploy` on Vercel and by `npx convex dev` locally.
// Guarded so a missing URL shows a message instead of failing the static build.
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null

/** Adapts Firebase Auth to the shape ConvexProviderWithAuth expects. */
function useFirebaseAuthForConvex() {
  const { user, loading } = useAuth()

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) =>
      user ? user.getIdToken(forceRefreshToken) : null,
    [user]
  )

  return useMemo(
    () => ({ isLoading: loading, isAuthenticated: !!user, fetchAccessToken }),
    [loading, user, fetchAccessToken]
  )
}

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center p-6">
        <p className="max-w-sm text-center text-sm text-text-muted">
          ⚠️ <strong className="text-neon-white">Deployment Error:</strong> <code>NEXT_PUBLIC_CONVEX_URL</code> is not set.
          Run <code>npx convex dev</code> locally, or build with <code>npx convex deploy --cmd &apos;npm run build&apos;</code>.
        </p>
      </div>
    )
  }
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useFirebaseAuthForConvex}>
      {children}
    </ConvexProviderWithAuth>
  )
}
