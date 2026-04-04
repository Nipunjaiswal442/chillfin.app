'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

const TAGLINE_ITEMS = [
  'Chill on spending',
  'Smarter on saving',
  'Cooler on investing',
  'Zero cost to start',
  'Built by students, for students',
  'SEBI-aligned guidance',
]

const FEATURES = [
  {
    icon: '💰',
    title: 'Pocket Money Tracker',
    desc: 'Log income and daily expenses. Auto-categorise spending across food, travel, entertainment, and more. See your real-time balance at a glance.',
    tier: 'Free',
  },
  {
    icon: '📊',
    title: 'Smart Budget Planner',
    desc: 'AI-generated monthly budget using a student-adapted 50/30/20 rule — Needs, Wants, Save/Invest. Anchored to your actual income, not wishful thinking.',
    tier: 'Free',
  },
  {
    icon: '🎯',
    title: 'Goal Vaults',
    desc: 'Name your savings goals — a new laptop, a trip, a gadget. Track progress with visual bars and projected completion dates.',
    tier: 'Free',
  },
  {
    icon: '⚡',
    title: 'EMI Advisor',
    desc: 'Before you commit to an EMI, see the real total cost, your monthly cash left, and an affordability score. Know if you can actually afford it.',
    tier: 'Free',
  },
  {
    icon: '📈',
    title: 'Investment Portfolio',
    desc: 'Beginner-friendly, SEBI-aligned portfolio suggestions — SIPs, digital gold, liquid funds, and more. Educational guidance, not financial advice.',
    tier: 'Free',
  },
  {
    icon: '🤖',
    title: 'Advanced AI Advisor',
    desc: 'Personalised robo-advisor portfolio rebalancing, peer benchmarking, credit score simulation, and tax basics — for power users.',
    tier: 'Pro',
  },
]

const STEPS = [
  {
    n: 1,
    title: 'Sign Up Instantly',
    desc: 'One-tap Google login. Enter your name, college, and monthly pocket money. That\'s it — you\'re in.',
  },
  {
    n: 2,
    title: 'Get Your Financial Plan',
    desc: 'ChillFin auto-generates a personalised monthly budget and starter investment suggestions based on your real income.',
  },
  {
    n: 3,
    title: 'Track & Optimise Daily',
    desc: 'Log expenses with one tap. Get smart nudges when you\'re overspending. Watch your goal vaults grow over time.',
  },
  {
    n: 4,
    title: 'Learn to Invest',
    desc: 'When you have surplus, explore beginner-safe investment options — linked directly to official, regulated platforms.',
  },
]

const INVEST_PILLS = [
  { icon: '📊', title: 'SIP via SEBI-registered AMCs', sub: 'Start with as low as ₹100/month' },
  { icon: '🥇', title: 'Digital Gold', sub: 'Regulated platforms like MMTC-PAMP, SafeGold' },
  { icon: '💧', title: 'Liquid Mutual Funds', sub: 'Emergency corpus with easy withdrawal' },
  { icon: '🏛️', title: 'Government RD / FD', sub: 'Zero-risk segment for cautious savers' },
]

export default function LandingPage() {
  const revealRefs = useRef<HTMLDivElement[]>([])
  const coinContainerRef = useRef<HTMLDivElement>(null)

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), i * 80)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )
    revealRefs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Falling coins
  useEffect(() => {
    const container = coinContainerRef.current
    if (!container) return
    const symbols = ['✦', '◆', '●', '✧']

    function spawnCoin() {
      if (!container) return
      const coin = document.createElement('div')
      coin.style.cssText = `
        position: absolute;
        font-size: ${10 + Math.random() * 10}px;
        opacity: 0;
        left: ${Math.random() * 100}%;
        color: ${Math.random() > 0.5 ? 'rgba(212,168,67,0.3)' : 'rgba(192,192,192,0.2)'};
        animation: coinFall ${12 + Math.random() * 18}s ${Math.random() * 5}s linear infinite;
      `
      coin.textContent = symbols[Math.floor(Math.random() * symbols.length)]
      container.appendChild(coin)
      setTimeout(() => coin.remove(), 35000)
    }

    const timeouts: ReturnType<typeof setTimeout>[] = []
    for (let i = 0; i < 15; i++) {
      timeouts.push(setTimeout(spawnCoin, i * 800))
    }
    const interval = setInterval(spawnCoin, 3000)

    return () => {
      timeouts.forEach(clearTimeout)
      clearInterval(interval)
    }
  }, [])

  const addRevealRef = (el: HTMLDivElement | null) => {
    if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el)
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#0A0A0F', color: '#F0F0FF', overflowX: 'hidden' }}>
      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[
          { w: 600, h: 600, color: 'rgba(212,168,67,0.12)', top: '-10%', left: '-10%', delay: '0s', dur: '20s' },
          { w: 500, h: 500, color: 'rgba(192,192,192,0.08)', bottom: '10%', right: '-5%', delay: '-7s', dur: '25s' },
          { w: 400, h: 400, color: 'rgba(212,168,67,0.06)', top: '50%', left: '40%', delay: '-14s', dur: '30s' },
        ].map((orb, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: orb.w,
              height: orb.h,
              background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
              borderRadius: '50%',
              filter: 'blur(120px)',
              ...(orb.top ? { top: orb.top } : {}),
              ...(orb.bottom ? { bottom: (orb as { bottom?: string }).bottom } : {}),
              ...(orb.left ? { left: orb.left } : {}),
              ...(orb.right ? { right: (orb as { right?: string }).right } : {}),
              animation: `orbFloat ${orb.dur} ease-in-out infinite`,
              animationDelay: orb.delay,
            }}
          />
        ))}
      </div>

      {/* Falling coins */}
      <div ref={coinContainerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }} />

      {/* Nav */}
      <nav className="animate-nav-slide" style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 1000,
        padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        backdropFilter: 'blur(20px)', background: 'rgba(10,10,15,0.7)',
        borderBottom: '1px solid rgba(212,168,67,0.08)',
      }}>
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36, background: 'linear-gradient(135deg, #D4A843, #A67C2E)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 18, color: '#0A0A0F',
            boxShadow: '0 0 20px rgba(212,168,67,0.3)',
          }}>C</div>
          <span style={{
            fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700,
            background: 'linear-gradient(135deg, #F2D06B, #D4A843)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: -0.5,
          }}>ChillFin</span>
        </a>
        <ul style={{ display: 'flex', gap: 32, alignItems: 'center', listStyle: 'none' }} className="hidden md:flex">
          <li><a href="#features" style={{ textDecoration: 'none', color: '#8888A0', fontSize: 14, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Features</a></li>
          <li><a href="#how" style={{ textDecoration: 'none', color: '#8888A0', fontSize: 14, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>How It Works</a></li>
          <li><a href="#invest" style={{ textDecoration: 'none', color: '#8888A0', fontSize: 14, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Invest</a></li>
          <li>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', background: 'linear-gradient(135deg, #D4A843, #A67C2E)',
              color: '#0A0A0F', fontWeight: 700, fontSize: 13, borderRadius: 10,
              textDecoration: 'none', border: 'none',
            }}>Open App →</Link>
          </li>
        </ul>
      </nav>

      {/* Hero */}
      <section style={{
        position: 'relative', zIndex: 1, minHeight: '100vh',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        textAlign: 'center', padding: '140px 24px 80px',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px',
          border: '1px solid rgba(212,168,67,0.25)', borderRadius: 100,
          fontSize: 12, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase',
          color: '#F2D06B', background: 'rgba(212,168,67,0.06)', marginBottom: 32,
          animation: 'fadeUp 1s ease-out 0.3s both',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4A843', boxShadow: '0 0 10px #D4A843', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
          Built for Students
        </div>

        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 'clamp(48px,8vw,96px)',
          fontWeight: 900, lineHeight: 1.05, maxWidth: 900,
          animation: 'fadeUp 1s ease-out 0.5s both',
        }}>
          <span style={{ display: 'block', background: 'linear-gradient(135deg, #F0F0FF 0%, #E8E8E8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Your Money,
          </span>
          <span style={{ display: 'block', background: 'linear-gradient(135deg, #F2D06B 0%, #D4A843 40%, #A67C2E 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', position: 'relative' }}>
            Your Rules.
          </span>
        </h1>

        <p style={{
          marginTop: 28, fontSize: 'clamp(16px,2vw,20px)', fontWeight: 300,
          color: '#8888A0', maxWidth: 580, lineHeight: 1.7,
          animation: 'fadeUp 1s ease-out 0.7s both',
        }}>
          The <strong style={{ color: '#E8E8E8', fontWeight: 500 }}>student-first financial companion</strong> that turns your pocket money into a plan.{' '}
          Track spending. Save smarter. Learn to invest — all for free.
        </p>

        <div style={{ marginTop: 48, display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', animation: 'fadeUp 1s ease-out 0.9s both' }}>
          <Link href="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, padding: '18px 40px',
            background: 'linear-gradient(135deg, #D4A843, #A67C2E)', color: '#0A0A0F',
            fontSize: 15, fontWeight: 700, letterSpacing: '0.5px', borderRadius: 14,
            textDecoration: 'none', boxShadow: '0 4px 30px rgba(212,168,67,0.25)',
            transition: 'all 0.4s', border: 'none',
          }}>
            <span>Open Website</span><span>→</span>
          </Link>
          <a href="#features" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, padding: '18px 36px',
            background: 'transparent', color: '#E8E8E8', fontSize: 15, fontWeight: 500,
            border: '1px solid #2A2A38', borderRadius: 14, textDecoration: 'none',
            transition: 'all 0.3s',
          }}>
            Explore Features
          </a>
        </div>

        <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, animation: 'fadeUp 1s ease-out 1.2s both' }}>
          <span style={{ fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', color: '#8888A0' }}>Scroll</span>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, #D4A843, transparent)' }} className="animate-scroll-pulse" />
        </div>
      </section>

      {/* Tagline strip */}
      <div style={{ position: 'relative', zIndex: 1, padding: '40px 0', borderTop: '1px solid rgba(212,168,67,0.08)', borderBottom: '1px solid rgba(212,168,67,0.08)', overflow: 'hidden' }}>
        <div className="animate-marquee" style={{ display: 'flex', gap: 60, width: 'max-content' }}>
          {[...TAGLINE_ITEMS, ...TAGLINE_ITEMS].map((item, i) => (
            <span key={i} style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 400, whiteSpace: 'nowrap', color: '#7A7A8E', opacity: 0.6 }}>
              {item}
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#D4A843', margin: '0 24px', verticalAlign: 'middle' }} />
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" style={{ position: 'relative', zIndex: 1, padding: '100px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div ref={addRevealRef} className="reveal">
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', color: '#D4A843', display: 'block', marginBottom: 16 }}>Core Features</span>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px,5vw,52px)', fontWeight: 700, lineHeight: 1.15, background: 'linear-gradient(135deg, #F0F0FF, #C0C0C0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 20 }}>
              Everything you need.<br />Nothing you don&apos;t.
            </h2>
            <p style={{ fontSize: 17, color: '#8888A0', lineHeight: 1.7, maxWidth: 600 }}>
              A lightweight, student-friendly suite of tools designed around your actual pocket money — not some fantasy budget.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginTop: 60 }}>
            {FEATURES.map((f, i) => (
              <div key={i} ref={addRevealRef} className="reveal" style={{
                background: '#111118', border: '1px solid rgba(212,168,67,0.06)', borderRadius: 20,
                padding: '36px 32px', transition: 'all 0.4s cubic-bezier(0.25,0.46,0.45,0.94)',
              }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 20, background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.12)' }}>
                  {f.icon}
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#F0F0FF', marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#8888A0', lineHeight: 1.7 }}>{f.desc}</p>
                <span style={{
                  display: 'inline-block', marginTop: 16, padding: '4px 12px', borderRadius: 100,
                  fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase',
                  ...(f.tier === 'Free'
                    ? { background: 'rgba(212,168,67,0.1)', color: '#F2D06B', border: '1px solid rgba(212,168,67,0.2)' }
                    : { background: 'rgba(192,192,192,0.08)', color: '#C0C0C0', border: '1px solid rgba(192,192,192,0.15)' }),
                }}>
                  {f.tier}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" style={{ position: 'relative', zIndex: 1, padding: '100px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div ref={addRevealRef} className="reveal">
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', color: '#D4A843', display: 'block', marginBottom: 16 }}>How It Works</span>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px,5vw,52px)', fontWeight: 700, lineHeight: 1.15, background: 'linear-gradient(135deg, #F0F0FF, #C0C0C0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 20 }}>
              From sign-up to<br />your first plan.
            </h2>
            <p style={{ fontSize: 17, color: '#8888A0', lineHeight: 1.7, maxWidth: 600 }}>
              No bank credentials needed. No complicated onboarding. Just you and your pocket money.
            </p>
          </div>

          <div style={{ marginTop: 60, display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 28, top: 40, bottom: 40, width: 1, background: 'linear-gradient(to bottom, #D4A843, #4A4A5A, transparent)' }} />
            {STEPS.map((step) => (
              <div key={step.n} ref={addRevealRef} className="reveal" style={{ display: 'flex', gap: 32, alignItems: 'flex-start', padding: '28px 0' }}>
                <div style={{ width: 56, height: 56, minWidth: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: '#0A0A0F', background: 'linear-gradient(135deg, #F2D06B, #A67C2E)', boxShadow: '0 0 30px rgba(212,168,67,0.2)', zIndex: 1 }}>
                  {step.n}
                </div>
                <div style={{ paddingTop: 8 }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#F0F0FF', marginBottom: 6 }}>{step.title}</h3>
                  <p style={{ fontSize: 15, color: '#8888A0', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Section */}
      <section id="invest" style={{ position: 'relative', zIndex: 1, padding: '100px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div ref={addRevealRef} className="reveal">
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', color: '#D4A843', display: 'block', marginBottom: 16 }}>Student Investing</span>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px,5vw,52px)', fontWeight: 700, lineHeight: 1.15, background: 'linear-gradient(135deg, #F0F0FF, #C0C0C0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Start small.<br />Think long-term.
            </h2>
          </div>

          <div ref={addRevealRef} className="reveal" style={{
            marginTop: 60, background: 'linear-gradient(135deg, rgba(212,168,67,0.04), rgba(192,192,192,0.02))',
            border: '1px solid rgba(212,168,67,0.1)', borderRadius: 24, padding: '48px',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center',
          }}>
            <div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: '#F0F0FF', marginBottom: 16 }}>
                Your investable surplus, calculated for you
              </h3>
              <p style={{ color: '#8888A0', lineHeight: 1.7, fontSize: 15, marginBottom: 12 }}>
                After essentials and savings goals, ChillFin identifies what&apos;s left — and shows you beginner-safe, legally compliant options to put it to work.
              </p>
              <p style={{ color: '#8888A0', lineHeight: 1.7, fontSize: 15, marginBottom: 12 }}>
                Every recommendation includes a risk label, estimated return range, lock-in period, and a direct link to the official SEBI/AMC page.
              </p>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#7A7A8E', padding: '12px 16px', background: 'rgba(10,10,15,0.6)', borderRadius: 8, borderLeft: '2px solid #A67C2E', marginTop: 20, lineHeight: 1.6 }}>
                ⚠ ChillFin is an educational tool, not a licensed investment advisor. Past returns do not guarantee future performance. Consult a SEBI-registered advisor for personalised advice.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {INVEST_PILLS.map((pill, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: '#111118', border: '1px solid rgba(212,168,67,0.08)', borderRadius: 14, transition: 'all 0.3s' }}>
                  <div style={{ width: 40, height: 40, minWidth: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: 'rgba(212,168,67,0.08)' }}>
                    {pill.icon}
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: 14, color: '#F0F0FF', marginBottom: 2 }}>{pill.title}</strong>
                    <span style={{ fontSize: 12, color: '#8888A0' }}>{pill.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" style={{ padding: '120px 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div ref={addRevealRef} className="reveal" style={{
          maxWidth: 700, margin: '0 auto', padding: '80px 48px',
          background: 'linear-gradient(135deg, rgba(212,168,67,0.06), rgba(10,10,15,0.9))',
          border: '1px solid rgba(212,168,67,0.12)', borderRadius: 32, position: 'relative', overflow: 'hidden',
        }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, background: 'linear-gradient(135deg, #F2D06B, #D4A843)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 16 }}>
            Ready to take control of your money?
          </h2>
          <p style={{ color: '#8888A0', fontSize: 16, lineHeight: 1.7, marginBottom: 36, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            Join the movement of students building real financial habits — before the first paycheck even arrives.
          </p>
          <Link href="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            fontSize: 16, padding: '20px 48px',
            background: 'linear-gradient(135deg, #D4A843, #A67C2E)', color: '#0A0A0F',
            fontWeight: 700, borderRadius: 14, textDecoration: 'none',
            boxShadow: '0 4px 30px rgba(212,168,67,0.25)',
          }}>
            <span>Open Website</span><span>→</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 1, padding: '40px 24px', borderTop: '1px solid rgba(212,168,67,0.06)', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#7A7A8E' }}>© 2025 ChillFin — The Student Financial Companion. All rights reserved.</p>
        <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 14, color: '#A67C2E', marginTop: 8 }}>
          &ldquo;Chill on spending. Smarter on saving. Cooler on investing.&rdquo;
        </p>
      </footer>
    </div>
  )
}
