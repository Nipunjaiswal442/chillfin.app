'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading, router])

  const handleGoogleSignIn = async () => {
    setSigning(true)
    setError(null)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const firebaseUser = result.user

      // Upsert user in Supabase
      await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebase_uid: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
        }),
      })

      router.replace('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed. Please try again.'
      setError(msg)
      setSigning(false)
    }
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center p-4" style={{ position: 'relative', zIndex: 1 }}>
      {/* Orb */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 500, borderRadius: '50%', filter: 'blur(120px)',
        background: 'radial-gradient(circle, rgba(212,168,67,0.1), transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center font-playfair font-black text-2xl text-bg-deep shadow-[0_0_30px_rgba(212,168,67,0.3)] mb-4">
            C
          </div>
          <h1 className="font-playfair font-bold text-2xl text-gradient-gold">ChillFin</h1>
          <p className="text-text-muted text-sm mt-1 text-center">Your student financial companion</p>
        </div>

        {/* Card */}
        <div className="bg-bg-card border border-metallic-grey rounded-2xl p-8">
          <h2 className="font-playfair font-bold text-xl text-neon-white mb-2">Welcome back</h2>
          <p className="text-text-muted text-sm mb-8 leading-relaxed">
            Sign in with Google to access your financial dashboard. No bank credentials needed.
          </p>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            loading={signing}
            onClick={handleGoogleSignIn}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {signing ? 'Signing in...' : 'Continue with Google'}
          </Button>

          {error && (
            <p className="mt-4 text-xs text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-lg py-2 px-3">
              {error}
            </p>
          )}

          <p className="mt-6 text-xs text-text-muted text-center leading-relaxed">
            By signing in, you agree to our{' '}
            <span className="text-gold-light cursor-pointer hover:underline">Terms of Service</span>
            {' '}and{' '}
            <span className="text-gold-light cursor-pointer hover:underline">Privacy Policy</span>.
            <br />
            <span className="text-[10px] mt-1 block">ChillFin is an educational tool. Not a licensed financial advisor.</span>
          </p>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          &ldquo;Chill on spending. Smarter on saving.&rdquo;
        </p>
      </div>
    </div>
  )
}
