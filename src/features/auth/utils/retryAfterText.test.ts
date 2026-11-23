import { describe, expect, it } from 'vitest'
import { retryAfterText } from './retryAfterText'
import { createTestT } from './testT'

const t = createTestT()

describe('retryAfterText', () => {
  it.each([
    [1, '1 second'],
    [12, '12 seconds'],
    [59, '59 seconds'],
    [60, '1 minute'],
    [61, '2 minutes'],
    [3600, '60 minutes'],
  ])('formats %i seconds as "%s"', (seconds, text) => {
    expect(retryAfterText(t, seconds)).toBe(text)
  })
})
