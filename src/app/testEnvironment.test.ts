import { describe, expect, it } from 'vitest'

describe('test environment', () => {
  it('runs in a non-UTC time zone', () => {
    expect(new Date(0).getTimezoneOffset()).not.toBe(0)
  })
})
