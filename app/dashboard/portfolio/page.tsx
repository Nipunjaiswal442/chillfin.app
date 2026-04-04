'use client'

const INVESTMENT_OPTIONS = [
  {
    icon: '📊',
    title: 'SIP (Systematic Investment Plan)',
    risk: 'Medium',
    riskColor: '#D4A843',
    returns: '10–14% p.a. (historical)',
    lockIn: 'No lock-in (open-ended funds)',
    minAmount: '₹100/month',
    description: 'Invest small amounts monthly in diversified mutual funds. Compounding works best over time — even ₹500/month for 10 years can become significant.',
    link: 'https://www.sebi.gov.in',
    linkLabel: 'SEBI — Mutual Funds',
    tag: 'Recommended for Beginners',
  },
  {
    icon: '🥇',
    title: 'Digital Gold',
    risk: 'Medium',
    riskColor: '#D4A843',
    returns: 'Tracks gold price (varies)',
    lockIn: 'None — sell anytime',
    minAmount: '₹1',
    description: 'Buy gold digitally on regulated platforms. Safer than physical gold — no storage risk. Good inflation hedge for long-term holding.',
    link: 'https://www.mmtcpamp.com',
    linkLabel: 'MMTC-PAMP (RBI regulated)',
    tag: 'Safe & Liquid',
  },
  {
    icon: '💧',
    title: 'Liquid Mutual Funds',
    risk: 'Low',
    riskColor: '#22c55e',
    returns: '5–7% p.a.',
    lockIn: 'T+1 redemption',
    minAmount: '₹500',
    description: 'Better than a savings account with near-instant withdrawal. Ideal for your emergency fund or short-term savings. Very low risk.',
    link: 'https://www.amfiindia.com',
    linkLabel: 'AMFI — Fund Directory',
    tag: 'Emergency Fund',
  },
  {
    icon: '🏛️',
    title: 'Government RD / FD',
    risk: 'Zero',
    riskColor: '#C0C0C0',
    returns: '4.5–7.5% p.a.',
    lockIn: 'Fixed tenure (6m–5y)',
    minAmount: '₹100 (Post Office RD)',
    description: 'Completely safe, government-backed returns. Best for cautious savers who want guaranteed growth with zero risk.',
    link: 'https://www.indiapost.gov.in',
    linkLabel: 'India Post — RD/FD',
    tag: 'Zero Risk',
  },
  {
    icon: '📈',
    title: 'Index Funds (Nifty 50)',
    risk: 'Medium-High',
    riskColor: '#f97316',
    returns: '10–12% p.a. (long term)',
    lockIn: 'None',
    minAmount: '₹100/month via SIP',
    description: 'Passively track India\'s top 50 companies. Lower expense ratios than active funds. Good for long-term wealth building (5+ years).',
    link: 'https://www.nseindia.com',
    linkLabel: 'NSE India',
    tag: '5+ Year Horizon',
  },
  {
    icon: '💼',
    title: 'PPF (Public Provident Fund)',
    risk: 'Zero',
    riskColor: '#C0C0C0',
    returns: '7.1% p.a. (tax-free)',
    lockIn: '15 years',
    minAmount: '₹500/year',
    description: 'Long-term tax-saving investment with government backing. Interest is completely tax-free. Open with any bank or post office.',
    link: 'https://www.sbi.co.in',
    linkLabel: 'SBI PPF Account',
    tag: 'Tax Saver',
  },
]

const RISK_LEVELS = [
  { level: 'Zero', color: '#C0C0C0', desc: 'Capital fully guaranteed' },
  { level: 'Low', color: '#22c55e', desc: 'Minimal fluctuation risk' },
  { level: 'Medium', color: '#D4A843', desc: 'Some volatility, good returns' },
  { level: 'Medium-High', color: '#f97316', desc: 'Higher volatility, higher potential' },
  { level: 'High', color: '#ef4444', desc: 'Significant risk of loss' },
]

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-playfair font-bold text-2xl text-neon-white">Investment Portfolio</h1>
        <p className="text-text-muted text-sm mt-1">Beginner-safe, SEBI-aligned options for student investors</p>
      </div>

      {/* Disclaimer */}
      <div className="bg-gold/5 border border-gold/15 rounded-2xl p-4">
        <p className="text-xs font-mono text-platinum leading-relaxed">
          ⚠ <strong className="text-gold-light">Educational Content Only.</strong> ChillFin is not a SEBI-registered investment advisor. All information here is for educational purposes. Past returns do not guarantee future performance. Please consult a SEBI-registered financial advisor before investing.
        </p>
      </div>

      {/* Risk key */}
      <div className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Risk Guide</p>
        <div className="flex flex-wrap gap-3">
          {RISK_LEVELS.map((r) => (
            <div key={r.level} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
              <span className="text-xs text-text-muted"><strong style={{ color: r.color }}>{r.level}</strong> — {r.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Investment cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {INVESTMENT_OPTIONS.map((opt, i) => (
          <div
            key={i}
            className="bg-bg-card border border-metallic-grey/20 rounded-2xl p-5 hover:border-gold/15 hover:bg-bg-card-hover transition-all duration-300"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gold/8 border border-gold/10 flex items-center justify-center text-xl flex-shrink-0">
                {opt.icon}
              </div>
              <div className="min-w-0">
                <h3 className="font-playfair font-bold text-neon-white text-sm leading-tight">{opt.title}</h3>
                <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold/10 text-gold-light border border-gold/15">
                  {opt.tag}
                </span>
              </div>
            </div>

            <p className="text-xs text-text-muted leading-relaxed mb-3">{opt.description}</p>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-metallic-grey/20 rounded-lg p-2">
                <p className="text-[10px] text-text-muted mb-0.5">Risk Level</p>
                <p className="text-xs font-bold" style={{ color: opt.riskColor }}>{opt.risk}</p>
              </div>
              <div className="bg-metallic-grey/20 rounded-lg p-2">
                <p className="text-[10px] text-text-muted mb-0.5">Expected Returns</p>
                <p className="text-xs font-bold text-neon-white">{opt.returns}</p>
              </div>
              <div className="bg-metallic-grey/20 rounded-lg p-2">
                <p className="text-[10px] text-text-muted mb-0.5">Lock-in</p>
                <p className="text-xs font-bold text-neon-white">{opt.lockIn}</p>
              </div>
              <div className="bg-metallic-grey/20 rounded-lg p-2">
                <p className="text-[10px] text-text-muted mb-0.5">Min Amount</p>
                <p className="text-xs font-bold text-gold-light">{opt.minAmount}</p>
              </div>
            </div>

            <a
              href={opt.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-gold-light hover:text-gold transition-colors"
            >
              <span className="w-3.5 h-3.5 border border-gold/30 rounded text-center text-[9px] leading-3.5">↗</span>
              {opt.linkLabel}
            </a>
          </div>
        ))}
      </div>

      {/* Student strategy section */}
      <div className="bg-gradient-to-br from-gold/5 to-transparent border border-gold/10 rounded-2xl p-6">
        <h2 className="font-playfair font-bold text-lg text-neon-white mb-4">📚 Student Investment Strategy</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              step: '1',
              title: 'Emergency Fund First',
              desc: 'Keep 1–2 months of expenses in a liquid mutual fund before investing anything else.',
            },
            {
              step: '2',
              title: 'Start a ₹100 SIP',
              desc: 'Even a tiny SIP builds the habit. Choose an index fund with low expense ratio.',
            },
            {
              step: '3',
              title: 'Increase as Income Grows',
              desc: 'Each time your pocket money increases, increase your SIP by the same amount.',
            },
          ].map((s) => (
            <div key={s.step} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-gold/15 border border-gold/25 flex items-center justify-center text-xs font-bold text-gold flex-shrink-0 mt-0.5">
                {s.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-neon-white mb-1">{s.title}</p>
                <p className="text-xs text-text-muted leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
