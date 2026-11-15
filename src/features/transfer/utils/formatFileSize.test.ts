import { describe, expect, it } from 'vitest'
import { formatFileSize } from './formatFileSize'

describe('formatFileSize', () => {
  it.each([
    [0, '0 KB'],
    [1, '0 KB'],
    [511, '0 KB'],
    [512, '1 KB'],
    [1023, '1 KB'],
    [1024, '1 KB'],
    [1536, '2 KB'],
    [14_336, '14 KB'],
    [1_048_575, '1024 KB'],
    [1_048_576, '1.0 MB'],
    [1_310_720, '1.3 MB'],
    [5_242_880, '5.0 MB'],
    [5_242_881, '5.1 MB'],
    [7_549_747, '7.2 MB'],
  ])('%i bytes → %s', (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected)
  })

  it('rounds half up exactly on a tenth boundary without float drift', () => {
    expect(formatFileSize(1_363_149)).toBe('1.3 MB')
    expect(formatFileSize(1_415_578)).toBe('1.4 MB')
  })

  it('rounds up when asked, even below the limit', () => {
    expect(formatFileSize(1_048_577, { roundUp: true })).toBe('1.1 MB')
    expect(formatFileSize(1, { roundUp: true })).toBe('1 KB')
  })

  it('never uses a thousands separator', () => {
    expect(formatFileSize(10_737_418_240)).toBe('10240.0 MB')
  })
})
