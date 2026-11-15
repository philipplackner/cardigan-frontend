import { describe, expect, it } from 'vitest'

describe('dom test environment', () => {
  it('runs in jsdom in a non-UTC time zone', () => {
    expect(typeof document).toBe('object')
    expect(new Date(0).getTimezoneOffset()).not.toBe(0)
  })
})
