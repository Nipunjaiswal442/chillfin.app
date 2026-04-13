'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import { ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading, router])

  const handleGoogleSignIn = async () => {
    if (!agreed) return
    setSigning(true)
    setError(null)

    if (!auth || !googleProvider) {
      setError('Application misconfigured: Missing environment variables.')
      setSigning(false)
      return
    }

    try {
      const result = await signInWithPopup(auth, googleProvider)
      const firebaseUser = result.user

      // Get Firebase ID token to authenticate /api/user call
      const idToken = await firebaseUser.getIdToken()

      // Upsert user in Supabase (uid is sourced server-side from the token)
      await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
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
          <p className="text-text-muted text-sm mb-6 leading-relaxed">
            Sign in with Google to access your financial dashboard. No bank credentials needed.
          </p>

          {/* Terms & Conditions */}
          <div className="mb-6">
            {/* Collapsible T&C content */}
            <div className="mb-3">
              <button
                type="button"
                onClick={() => setTermsOpen((p) => !p)}
                className="flex items-center justify-between w-full text-xs text-text-muted hover:text-neon-white transition-colors pb-2 border-b border-metallic-grey/50"
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-gold" />
                  Terms of Service &amp; Privacy Policy
                </span>
                {termsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {termsOpen && (
                <div className="mt-3 max-h-44 overflow-y-auto pr-1 space-y-3 text-[11px] text-text-muted leading-relaxed scrollbar-thin">
                  <p><strong className="text-neon-white">1. Educational Purpose Only</strong><br />
                  ChillFin is an educational financial tool designed for Indian students. It is not a licensed financial advisor, stockbroker, or portfolio manager. Nothing on this platform constitutes financial advice.</p>

                  <p><strong className="text-neon-white">2. Not SEBI-Registered</strong><br />
                  ChillFin is not registered with SEBI or any other financial regulatory body. All investment information, AI responses, and projections are strictly illustrative and for educational purposes only.</p>

                  <p><strong className="text-neon-white">3. Data Usage</strong><br />
                  We store your name, email, and financial data (transactions, budgets, goals) to power your dashboard. Your data is never sold to third parties. AI conversations may be processed by NVIDIA's API subject to their privacy policy.</p>

                  <p><strong className="text-neon-white">4. No Liability</strong><br />
                  ChillFin and its creators are not liable for any financial losses arising from use of this application. Always consult a SEBI-registered advisor before making investment decisions.</p>

                  <p><strong className="text-neon-white">5. Accuracy of Projections</strong><br />
                  Investment return projections shown in the portfolio calculator are hypothetical and based on historical averages. Actual returns may differ significantly. Past performance does not guarantee future results.</p>

                  <p><strong className="text-neon-white">6. Age Requirement</strong><br />
                  You must be at least 13 years old to use ChillFin. By signing in, you confirm you meet this requirement.</p>

                  <p><strong className="text-neon-white">7. Changes to Terms</strong><br />
                  These terms may be updated at any time. Continued use of ChillFin constitutes acceptance of the revised terms.</p>
                </div>
              )}
            </div>

            {/* Checkbox */}
            <label className={`flex items-start gap-3 cursor-pointer group select-none transition-all ${agreed ? 'opacity-100' : 'opacity-90'}`}>
              <div
                onClick={() => setAgreed((p) => !p)}
                className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                  agreed ? 'bg-gold border-gold' : 'bg-transparent border-metallic-grey group-hover:border-gold/50'
                }`}
              >
                {agreed && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5L3.5 6L8 1" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span onClick={() => setAgreed((p) => !p)} className="text-xs text-text-muted leading-relaxed">
                I have read and agree to ChillFin&apos;s{' '}
                <span
                  className="text-gold-light hover:underline cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); setTermsOpen(true) }}
                >
                  Terms of Service
                </span>
                {' '}and{' '}
                <span
                  className="text-gold-light hover:underline cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); setTermsOpen(true) }}
                >
                  Privacy Policy
                </span>
                . I understand ChillFin is an educational tool and not a financial advisor.
              </span>
            </label>
          </div>

          <Button
            variant="primary"
            size="lg"
            className={`w-full transition-all duration-300 ${!agreed ? 'opacity-40 cursor-not-allowed' : ''}`}
            loading={signing}
            onClick={handleGoogleSignIn}
            disabled={!agreed}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {signing ? 'Signing in...' : agreed ? 'Continue with Google' : 'Accept Terms to Continue'}
          </Button>

          {!agreed && (
            <p className="mt-2 text-[11px] text-text-muted text-center">
              Please accept the terms above to enable sign-in
            </p>
          )}

          {error && (
            <p className="mt-4 text-xs text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-lg py-2 px-3">
              {error}
            </p>
          )}

          <p className="mt-6 text-[10px] text-text-muted text-center leading-relaxed">
            <span className="block">ChillFin is an educational tool. Not a licensed financial advisor.</span>
          </p>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          &ldquo;Chill on spending. Smarter on saving.&rdquo;
        </p>
      </div>
    </div>
  )
}
