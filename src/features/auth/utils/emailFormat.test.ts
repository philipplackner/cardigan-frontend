import { describe, expect, it } from 'vitest'
import { isAddrSpec } from './emailFormat'

describe('isAddrSpec', () => {
  it.each([
    'ann@example.com',
    'ann.lee+cards@example.com',
    "o'brien!#$%&*/=?^_`{|}~-@example.com",
    'ann@localhost',
    '"ann\\ lee"@example.com',
    '"ann@work"@example.com',
    '"a\\"b"@example.com',
    '""@example.com',
    'ann@[192.168.0.1]',
    'ann@[IPv6:2001:db8::1]',
  ])('accepts %s', (email) => {
    expect(isAddrSpec(email)).toBe(true)
  })

  it.each([
    ['a missing domain', 'ann@'],
    ['a missing local part', '@example.com'],
    ['no @', 'ann.example.com'],
    ['two @ outside quotes', 'ann@lee@example.com'],
    ['non-ASCII letters', 'jürgen@münchen.de'],
    ['a comment', 'ann(work)@example.com'],
    ['a leading dot in the local part', '.ann@example.com'],
    ['a trailing dot in the local part', 'ann.@example.com'],
    ['a double dot in the local part', 'ann..lee@example.com'],
    ['a leading dot in the domain', 'ann@.example.com'],
    ['a trailing dot in the domain', 'ann@example.com.'],
    ['a double dot in the domain', 'ann@example..com'],
    ['a space', 'ann lee@example.com'],
    ['an unescaped space in quotes', '"ann lee"@example.com'],
    ['a tab', 'ann\t@example.com'],
    ['an escaped tab in quotes', '"ann\\\tlee"@example.com'],
    ['a NUL', 'ann\u0000@example.com'],
    ['an unclosed quote', '"ann@example.com'],
    ['text after the closing quote', '"ann"lee@example.com'],
    ['a bracket inside a domain literal', 'ann@[1[2]'],
    ['an unclosed domain literal', 'ann@[192.168.0.1'],
    ['an empty string', ''],
  ])('rejects %s', (_, email) => {
    expect(isAddrSpec(email)).toBe(false)
  })

  it('finishes a 250 KB near-match within 100 ms', () => {
    const inputs = [
      `${'a.'.repeat(125_000)}@example.com`,
      `ann@${'a.'.repeat(125_000)}`,
      `"${'\\a'.repeat(125_000)}`,
      `ann@[${'1'.repeat(250_000)}`,
    ]
    for (const input of inputs) {
      const start = performance.now()
      expect(isAddrSpec(input)).toBe(false)
      expect(performance.now() - start).toBeLessThan(100)
    }
  })
})
