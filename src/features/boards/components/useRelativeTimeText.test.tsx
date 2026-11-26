import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useRelativeTimeText } from './useRelativeTimeText'

// The tests run in Europe/Berlin (vitest.config.ts).
const now = new Date('2026-10-14T15:00:00')

describe('useRelativeTimeText', () => {
  it.each([
    ['2026-10-14T14:59:30', 'Just now'],
    ['2026-10-14T14:59:00', '1 minute ago'],
    ['2026-10-14T14:55:00', '5 minutes ago'],
    ['2026-10-14T14:00:00', '1 hour ago'],
    ['2026-10-14T12:00:00', '3 hours ago'],
    ['2026-10-13T12:00:00', 'Yesterday'],
    ['2026-10-09T12:00:00', 'Oct 9'],
    ['2025-10-09T12:00:00', 'Oct 9, 2025'],
  ])('shows %s as "%s"', (time, text) => {
    const { result } = renderHook(() => useRelativeTimeText())

    expect(result.current(new Date(time), now)).toBe(text)
  })
})
