import { describe, expect, test } from 'vitest'
import { createSSEParser } from './sse'
import { formatDate, isInMonth, lastNMonths, todayISO } from './utils'

describe('createSSEParser', () => {
  const stream = ['Hello', ' there', '! Save', ' 20%']
    .map((t) => `data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`)
    .join('') + 'data: [DONE]\n\n'

  test('keeps tokens whose SSE line is split across network chunks', () => {
    for (let cut = 1; cut < stream.length; cut++) {
      let out = ''
      const parse = createSSEParser((d) => { out += d })
      parse(stream.slice(0, cut))
      parse(stream.slice(cut))
      expect(out).toBe('Hello there! Save 20%')
    }
  })

  test('ignores keep-alives, [DONE] and malformed events', () => {
    let out = ''
    const parse = createSSEParser((d) => { out += d })
    parse(': ping\n\ndata: {not json}\n\ndata: [DONE]\n\n')
    expect(out).toBe('')
  })
})

describe('date helpers', () => {
  test('todayISO uses the local calendar date, not UTC', () => {
    // 01:30 on 18 Oct local time is still 17 Oct in UTC for UTC+ timezones like IST
    expect(todayISO(new Date(2026, 9, 18, 1, 30))).toBe('2026-10-18')
  })

  test('isInMonth compares the YYYY-MM prefix', () => {
    expect(isInMonth('2026-10-01', 10, 2026)).toBe(true)
    expect(isInMonth('2026-09-30', 10, 2026)).toBe(false)
    expect(isInMonth('2025-10-15', 10, 2026)).toBe(false)
  })

  test('lastNMonths has no duplicate/skipped months on the 31st', () => {
    const months = lastNMonths(6, new Date(2026, 9, 31))
    expect(months.map((m) => `${m.year}-${m.month}`)).toEqual([
      '2026-5', '2026-6', '2026-7', '2026-8', '2026-9', '2026-10',
    ])
  })

  test('lastNMonths crosses the year boundary', () => {
    expect(lastNMonths(3, new Date(2026, 0, 15)).map((m) => `${m.year}-${m.month}`)).toEqual([
      '2025-11', '2025-12', '2026-1',
    ])
  })

  test('formatDate reads a bare YYYY-MM-DD as a local date', () => {
    expect(formatDate('2026-10-01')).toBe(new Date(2026, 9, 1).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }))
  })
})
