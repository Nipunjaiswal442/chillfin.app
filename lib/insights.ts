/**
 * insights.ts — lightweight, explainable predictions from a user's own
 * transaction history. Pure functions (no I/O) so they run in the browser,
 * in Convex, or in tests, and can later be swapped for a trained model
 * behind the same interface (see docs/ML_ROADMAP.md).
 */

import { getCategoryLabel, todayISO } from './utils'

export interface InsightTransaction {
  type: 'income' | 'expense'
  amount: number
  category: string
  /** YYYY-MM-DD */
  date: string
}

export interface Forecast {
  value: number
  /** ~80% range from one-step-ahead errors; equals `value` when there's too little data to judge */
  low: number
  high: number
  /** Number of past months the forecast is based on */
  basedOnMonths: number
}

export interface Insights {
  monthEnd: {
    spentSoFar: number
    projected: number
    dayOfMonth: number
    daysInMonth: number
  }
  nextMonth: Forecast | null
  unusual: { category: string; label: string; projected: number; typical: number }[]
}

const monthKey = (date: string) => date.slice(0, 7)
const daysIn = (year: number, month: number) => new Date(year, month, 0).getDate()

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/**
 * Holt's linear exponential smoothing with a damped trend — a standard,
 * robust baseline for short monthly series. Returns null with < 2 points.
 */
export function forecastNext(series: number[], alpha = 0.5, beta = 0.3, phi = 0.8): Forecast | null {
  if (series.length < 2) return null
  let level = series[0]
  let trend = series[1] - series[0]
  const errors: number[] = []
  for (let t = 1; t < series.length; t++) {
    const predicted = level + phi * trend
    errors.push(series[t] - predicted)
    const prevLevel = level
    level = alpha * series[t] + (1 - alpha) * predicted
    trend = beta * (level - prevLevel) + (1 - beta) * phi * trend
  }
  const value = Math.max(0, level + phi * trend)
  // With < 3 errors the spread estimate is meaningless, so report a point forecast
  const sigma = errors.length >= 3 ? Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / errors.length) : 0
  return {
    value: Math.round(value),
    low: Math.round(Math.max(0, value - 1.28 * sigma)),
    high: Math.round(value + 1.28 * sigma),
    basedOnMonths: series.length,
  }
}

/**
 * Builds spending insights for the month containing `now`.
 * Months with no logged expenses are treated as "not tracked", not ₹0.
 */
export function buildInsights(transactions: InsightTransaction[], now = new Date()): Insights {
  const today = todayISO(now)
  const thisMonth = monthKey(today)
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const dayOfMonth = now.getDate()
  const daysInMonth = daysIn(year, month)

  // Expense totals per past month, and per (month, category)
  const byMonth = new Map<string, number>()
  const byMonthCat = new Map<string, Map<string, number>>()
  let spentSoFar = 0
  const currentByCat = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== 'expense') continue
    const key = monthKey(t.date)
    if (key === thisMonth) {
      if (t.date <= today) {
        spentSoFar += t.amount
        currentByCat.set(t.category, (currentByCat.get(t.category) ?? 0) + t.amount)
      }
    } else if (key < thisMonth) {
      byMonth.set(key, (byMonth.get(key) ?? 0) + t.amount)
      const cats = byMonthCat.get(key) ?? new Map<string, number>()
      cats.set(t.category, (cats.get(t.category) ?? 0) + t.amount)
      byMonthCat.set(key, cats)
    }
  }

  const pastKeys = [...byMonth.keys()].sort().slice(-12)
  const series = pastKeys.map((k) => byMonth.get(k)!)
  const nextMonth = forecastNext(series)

  // Month-end: blend this month's pace with the typical daily rate, trusting
  // this month more as it progresses (day 2 alone is a poor predictor)
  const elapsed = dayOfMonth / daysInMonth
  const currentDaily = spentSoFar / dayOfMonth
  const typicalDaily = series.length > 0 ? median(series) / 30.4 : currentDaily
  const blendedDaily = elapsed * currentDaily + (1 - elapsed) * typicalDaily
  const projected = Math.round(spentSoFar + blendedDaily * (daysInMonth - dayOfMonth))

  // Unusual categories: projected month-end vs the user's median for that category
  const unusual: Insights['unusual'] = []
  if (pastKeys.length >= 2) {
    for (const [category, sofar] of currentByCat) {
      const history = pastKeys.map((k) => byMonthCat.get(k)?.get(category) ?? 0)
      const typical = median(history)
      const projectedCat = Math.round(sofar / elapsed)
      if (typical > 0 && projectedCat > 1.5 * typical && projectedCat - typical >= 300) {
        unusual.push({ category, label: getCategoryLabel(category), projected: projectedCat, typical: Math.round(typical) })
      }
    }
    unusual.sort((a, b) => b.projected - b.typical - (a.projected - a.typical))
  }

  return {
    monthEnd: { spentSoFar: Math.round(spentSoFar), projected, dayOfMonth, daysInMonth },
    nextMonth,
    unusual: unusual.slice(0, 3),
  }
}
