import { describe, expect, test } from 'vitest'
import { buildInsights, forecastNext, InsightTransaction } from './insights'

const exp = (date: string, amount: number, category = 'food'): InsightTransaction =>
  ({ type: 'expense', amount, category, date })

describe('forecastNext', () => {
  test('needs at least two months', () => {
    expect(forecastNext([])).toBeNull()
    expect(forecastNext([4000])).toBeNull()
  })

  test('a flat history forecasts the same amount with no spread', () => {
    expect(forecastNext([4000, 4000, 4000, 4000, 4000])).toEqual({ value: 4000, low: 4000, high: 4000, basedOnMonths: 5 })
  })

  test('a rising history forecasts higher than the last month, but damped', () => {
    const f = forecastNext([3000, 3500, 4000, 4500, 5000])!
    expect(f.value).toBeGreaterThan(5000)
    expect(f.value).toBeLessThan(5500) // less than the full +500 trend
  })

  test('a noisy history gets a range around the forecast', () => {
    const f = forecastNext([3000, 5200, 2800, 4900, 3100, 5000])!
    expect(f.low).toBeLessThan(f.value)
    expect(f.high).toBeGreaterThan(f.value)
    expect(f.low).toBeGreaterThanOrEqual(0)
  })
})

describe('buildInsights', () => {
  const history = [
    exp('2026-07-10', 3000), exp('2026-07-20', 1000, 'travel'),
    exp('2026-08-10', 3000), exp('2026-08-20', 1000, 'travel'),
    exp('2026-09-10', 3000), exp('2026-09-20', 1000, 'travel'),
  ]

  test('early in the month, the projection leans on the usual month', () => {
    // ₹1000 on day 2 alone would extrapolate to ~₹15,500
    const { monthEnd } = buildInsights([...history, exp('2026-10-01', 1000)], new Date(2026, 9, 2))
    expect(monthEnd.spentSoFar).toBe(1000)
    expect(monthEnd.projected).toBeGreaterThan(4000)
    expect(monthEnd.projected).toBeLessThan(6000)
  })

  test('late in the month, the projection follows the actual pace', () => {
    const { monthEnd } = buildInsights([...history, exp('2026-10-05', 9000)], new Date(2026, 9, 29))
    expect(monthEnd.projected).toBeGreaterThan(9000)
    expect(monthEnd.projected).toBeLessThan(10000)
  })

  test('ignores income, future-dated entries and months that were not tracked', () => {
    const txs = [
      ...history,
      { type: 'income' as const, amount: 99999, category: 'gift', date: '2026-10-01' },
      exp('2026-10-25', 5000), // later this month than "today"
      exp('2025-01-15', 50000), // an old, isolated month is still just one data point
    ]
    const { monthEnd, nextMonth } = buildInsights(txs, new Date(2026, 9, 18))
    expect(monthEnd.spentSoFar).toBe(0)
    expect(nextMonth?.basedOnMonths).toBe(4)
  })

  test('flags a category running well above its usual level', () => {
    // ₹2500 by day 15 of 31 → ₹5167 projected vs a usual ₹1000
    const { unusual } = buildInsights([...history, exp('2026-10-05', 2500, 'travel')], new Date(2026, 9, 15))
    expect(unusual).toEqual([{ category: 'travel', label: 'Travel', projected: 5167, typical: 1000 }])
  })

  test('does not flag normal spending', () => {
    const { unusual } = buildInsights([...history, exp('2026-10-05', 1500)], new Date(2026, 9, 15))
    expect(unusual).toEqual([])
  })
})
