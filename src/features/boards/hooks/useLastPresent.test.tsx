import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useLastPresent } from './useLastPresent'

describe('useLastPresent', () => {
  it('keeps the latest value while the value is null', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useLastPresent(value),
      { initialProps: { value: 'Raytracer' as string | null } },
    )

    rerender({ value: null })
    expect(result.current).toBe('Raytracer')
    rerender({ value: 'Garden' })
    expect(result.current).toBe('Garden')
    rerender({ value: null })
    expect(result.current).toBe('Garden')
    rerender({ value: null })
    expect(result.current).toBe('Garden')
  })

  it('is null until a value arrives', () => {
    const { result } = renderHook(() => useLastPresent<string>(null))

    expect(result.current).toBeNull()
  })
})
