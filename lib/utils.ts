// ─── Currency ─────────────────────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${Math.round(amount)}`
}

// ─── EMI Calculator ───────────────────────────────────────────────────────────

export function calculateEMI(principal: number, annualRate: number, tenureMonths: number) {
  if (annualRate === 0) {
    const monthly = principal / tenureMonths
    return {
      monthlyEMI: monthly,
      totalCost: principal,
      totalInterest: 0,
    }
  }
  const r = annualRate / 100 / 12
  const n = tenureMonths
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  const totalCost = emi * n
  const totalInterest = totalCost - principal
  return {
    monthlyEMI: emi,
    totalCost,
    totalInterest,
  }
}

export function calculateAffordabilityScore(monthlyEMI: number, monthlyIncome: number): number {
  if (monthlyIncome <= 0) return 0
  const ratio = monthlyEMI / monthlyIncome
  // Score: 100 = affordable, 0 = unaffordable
  // < 20% of income = excellent (80-100)
  // 20-35% = moderate (50-79)
  // 35-50% = risky (20-49)
  // > 50% = unaffordable (0-19)
  const score = Math.max(0, Math.min(100, Math.round(100 - ratio * 180)))
  return score
}

export function getAffordabilityLabel(score: number): { label: string; color: string } {
  if (score >= 75) return { label: 'Excellent', color: '#22c55e' }
  if (score >= 50) return { label: 'Moderate', color: '#D4A843' }
  if (score >= 25) return { label: 'Risky', color: '#f97316' }
  return { label: 'Unaffordable', color: '#ef4444' }
}

// ─── Budget helpers ───────────────────────────────────────────────────────────

export function generateBudget(monthlyIncome: number) {
  return {
    needs_amount: Math.round(monthlyIncome * 0.5),
    wants_amount: Math.round(monthlyIncome * 0.3),
    savings_amount: Math.round(monthlyIncome * 0.2),
  }
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function getCurrentMonthYear() {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

export function getMonthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString('en-IN', { month: 'long' })
}

/**
 * Today's calendar date in the device's timezone, as YYYY-MM-DD.
 * (`toISOString()` is UTC, which is still "yesterday" in India until 05:30.)
 */
export function todayISO(now = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
}

/** True if a YYYY-MM-DD string falls in the given month (1–12) and year. */
export function isInMonth(dateStr: string, month: number, year: number): boolean {
  return dateStr.slice(0, 7) === `${year}-${pad2(month)}`
}

/**
 * The last `n` calendar months, oldest first, ending with the month of `now`.
 * Built from day 1 so the 29th–31st never overflow into the next month.
 */
export function lastNMonths(n: number, now = new Date()) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)
    return {
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      label: d.toLocaleString('en-IN', { month: 'short' }),
    }
  })
}

export function formatDate(date: string | number): string {
  // A bare YYYY-MM-DD is parsed as UTC midnight by `new Date()`; read it as a local date instead
  const d = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)))
    : new Date(date)
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Category helpers ─────────────────────────────────────────────────────────

export const EXPENSE_CATEGORIES = [
  { value: 'food', label: 'Food & Drinks', emoji: '🍔' },
  { value: 'travel', label: 'Travel', emoji: '🚌' },
  { value: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { value: 'education', label: 'Education', emoji: '📚' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { value: 'health', label: 'Health', emoji: '💊' },
  { value: 'misc', label: 'Miscellaneous', emoji: '📦' },
]

export const INCOME_CATEGORIES = [
  { value: 'pocket_money', label: 'Pocket Money', emoji: '💰' },
  { value: 'stipend', label: 'Stipend / Part-time', emoji: '💼' },
  { value: 'gift', label: 'Gift', emoji: '🎁' },
  { value: 'misc', label: 'Other', emoji: '📦' },
]

export function getCategoryEmoji(category: string): string {
  const all = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]
  return all.find((c) => c.value === category)?.emoji ?? '📦'
}

export function getCategoryLabel(category: string): string {
  const all = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]
  return all.find((c) => c.value === category)?.label ?? category
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
