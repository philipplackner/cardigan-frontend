import { describe, expect, it } from 'vitest'
import { formatRelativeTime } from './formatRelativeTime'

// The tests run in Europe/Berlin (vitest.config.ts), so these local times have a DST change.
const at = (local: string) => new Date(local)

describe('formatRelativeTime', () => {
  const now = at('2026-10-14T15:00:00')

  it('treats a time 30 s in the future as just now', () => {
    expect(formatRelativeTime(at('2026-10-14T15:00:30'), now)).toEqual({
      kind: 'justNow',
    })
  })

  it('treats 59 s as just now', () => {
    expect(formatRelativeTime(at('2026-10-14T14:59:01'), now)).toEqual({
      kind: 'justNow',
    })
  })

  it('shows 1 minute at exactly 60 s', () => {
    expect(formatRelativeTime(at('2026-10-14T14:59:00'), now)).toEqual({
      kind: 'minutes',
      count: 1,
    })
  })

  it('rounds 119 s down to 1 minute', () => {
    expect(formatRelativeTime(at('2026-10-14T14:58:01'), now)).toEqual({
      kind: 'minutes',
      count: 1,
    })
  })

  it('shows 59 minutes just under an hour', () => {
    expect(formatRelativeTime(at('2026-10-14T14:00:01'), now)).toEqual({
      kind: 'minutes',
      count: 59,
    })
  })

  it('shows minutes across midnight while under an hour', () => {
    expect(
      formatRelativeTime(at('2026-10-13T23:50:00'), at('2026-10-14T00:10:00')),
    ).toEqual({ kind: 'minutes', count: 20 })
  })

  it('shows hours earlier the same day', () => {
    expect(formatRelativeTime(at('2026-10-14T12:40:00'), now)).toEqual({
      kind: 'hours',
      count: 2,
    })
  })

  it('rounds 2 h 39 min down to 2 hours', () => {
    expect(formatRelativeTime(at('2026-10-14T12:21:00'), now)).toEqual({
      kind: 'hours',
      count: 2,
    })
  })

  it('shows yesterday shortly after midnight once over an hour', () => {
    expect(
      formatRelativeTime(at('2026-10-13T23:10:00'), at('2026-10-14T00:30:00')),
    ).toEqual({ kind: 'yesterday' })
  })

  it('shows the date two days ago', () => {
    const time = at('2026-10-12T18:00:00')

    expect(formatRelativeTime(time, now)).toEqual({ kind: 'date', date: time })
  })

  it('shows the date without a year earlier the same year', () => {
    const time = at('2026-01-01T00:00:00')

    expect(formatRelativeTime(time, now)).toEqual({ kind: 'date', date: time })
  })

  it('shows the date with the year for the previous year', () => {
    const time = at('2025-10-09T12:00:00')

    expect(formatRelativeTime(time, now)).toEqual({
      kind: 'dateWithYear',
      date: time,
    })
  })

  it('counts real elapsed hours on the day the clocks go back', () => {
    // 2026-10-25 02:00–03:00 happens twice in Berlin: 01:30 CEST to 04:30 CET is 4 hours.
    expect(
      formatRelativeTime(
        new Date('2026-10-25T01:30:00+02:00'),
        new Date('2026-10-25T04:30:00+01:00'),
      ),
    ).toEqual({ kind: 'hours', count: 4 })
  })

  it('uses calendar days for yesterday across the spring DST change', () => {
    // 2026-03-29 has only 23 hours in Berlin.
    expect(
      formatRelativeTime(at('2026-03-28T23:30:00'), at('2026-03-30T00:30:00')),
    ).toEqual({ kind: 'date', date: at('2026-03-28T23:30:00') })
    expect(
      formatRelativeTime(at('2026-03-29T00:30:00'), at('2026-03-30T00:30:00')),
    ).toEqual({ kind: 'yesterday' })
  })
})
