import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useOpenSession } from './useOpenSession'

describe('useOpenSession', () => {
  it('counts each opening and keeps the count while closed', () => {
    const { result, rerender } = renderHook(
      ({ isOpen }) => useOpenSession(isOpen),
      { initialProps: { isOpen: false } },
    )
    expect(result.current).toBe(0)

    rerender({ isOpen: true })
    expect(result.current).toBe(1)
    rerender({ isOpen: true })
    expect(result.current).toBe(1)
    rerender({ isOpen: false })
    expect(result.current).toBe(1)
    rerender({ isOpen: true })
    expect(result.current).toBe(2)
  })

  it('starts at 0 when it is open from the start', () => {
    const { result } = renderHook(() => useOpenSession(true))

    expect(result.current).toBe(0)
  })
})
