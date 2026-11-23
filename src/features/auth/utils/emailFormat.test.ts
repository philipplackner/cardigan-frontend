import { describe, expect, it } from 'vitest'
import { isValidEmail } from './emailFormat'

describe('isValidEmail', () => {
  it.each([
    'ann@example.com',
    'ann.lee+cards@example.com',
    "o'brien!#$%&*/=?^_`{|}~-@example.com",
    'a@b.co',
    'ann@mail.example.com',
    'ann@a.b.example.co.uk',
    'ann@xn--mnchen-3ya.de',
    `${'a'.repeat(64)}@example.com`,
    `ann@${'a'.repeat(63)}.com`,
    `ann@example.${'a'.repeat(63)}`,
  ])('accepts %s', (email) => {
    expect(isValidEmail(email)).toBe(true)
  })

  it.each([
    ['a quoted local part', '"ann lee"@example.com'],
    ['a comment', 'ann(work)@example.com'],
    ['a leading dot in the local part', '.ann@example.com'],
    ['a trailing dot in the local part', 'ann.@example.com'],
    ['a double dot in the local part', 'an..n@example.com'],
    ['a local part of 65 characters', `${'a'.repeat(65)}@example.com`],
    ['two @ in a row', 'ann@@example.com'],
    ['two @ apart', 'ann@lee@example.com'],
    ['non-ASCII letters', 'jürgen@münchen.de'],
    ['a single-label domain with a hyphen', 'mail@pl-coding'],
    ['a single-label domain', 'ann@localhost'],
    ['a missing domain', 'ann@'],
    ['a missing local part', '@example.com'],
    ['no @', 'ann.example.com'],
    ['a domain literal', 'ann@[192.168.0.1]'],
    ['a trailing dot in the domain', 'ann@example.com.'],
    ['a leading dot in the domain', 'ann@.example.com'],
    ['a double dot in the domain', 'ann@example..com'],
    ['a hyphen at the start of a label', 'ann@-example.com'],
    ['a hyphen at the end of a label', 'ann@example-.com'],
    ['a one-letter top-level label', 'ann@example.c'],
    ['a numeric top-level label', 'ann@example.123'],
    ['a punycode top-level label', 'ann@example.xn--p1ai'],
    ['a label of 64 characters', `ann@${'a'.repeat(64)}.com`],
    ['a top-level label of 64 letters', `ann@example.${'a'.repeat(64)}`],
    ['a space', 'ann lee@example.com'],
    ['a tab', 'ann\t@example.com'],
    ['a NUL', 'ann\u0000@example.com'],
    ['a trailing line break', 'ann@example.com\n'],
    ['an empty string', ''],
  ])('rejects %s', (_, email) => {
    expect(isValidEmail(email)).toBe(false)
  })

  it.each([
    ['the shared near-match', `a@${'a.'.repeat(125_000)}1`],
    ['a long dotted local part', `${'a.'.repeat(125_000)}@example.com`],
    ['a long dotted domain', `ann@${'a.'.repeat(125_000)}`],
    ['a long quoted string', `"${'\\a'.repeat(125_000)}`],
    ['a long domain literal', `ann@[${'1'.repeat(250_000)}`],
  ])('rejects %s within 100 ms', (_, input) => {
    const start = performance.now()
    expect(isValidEmail(input)).toBe(false)
    expect(performance.now() - start).toBeLessThan(100)
  })
})
