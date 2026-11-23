import { describe, expect, it } from 'vitest'
import { passwordRules } from './passwordRules'

const ALL_MET = {
  hasMinLength: true,
  hasLowercase: true,
  hasUppercase: true,
  hasDigit: true,
}

describe('passwordRules', () => {
  it('reports every rule as unmet for an empty password', () => {
    expect(passwordRules('')).toEqual({
      hasMinLength: false,
      hasLowercase: false,
      hasUppercase: false,
      hasDigit: false,
    })
  })

  it('needs 12 code points', () => {
    expect(passwordRules('Abcdefghij1').hasMinLength).toBe(false)
    expect(passwordRules('Abcdefghijk1').hasMinLength).toBe(true)
  })

  it('counts an emoji as one code point, not two UTF-16 units', () => {
    expect(passwordRules('Abcdefghi1😀').hasMinLength).toBe(false)
    expect(passwordRules('Abcdefghij1😀').hasMinLength).toBe(true)
  })

  it('counts an emoji with a skin tone modifier as two code points', () => {
    expect(passwordRules('Abcdefghi1👍🏽').hasMinLength).toBe(true)
  })

  it.each([
    ['lowercase', 'ABCDEFGHIJK1', 'hasLowercase'],
    ['uppercase', 'abcdefghijk1', 'hasUppercase'],
    ['digit', 'Abcdefghijkl', 'hasDigit'],
  ] as const)('reports a missing %s letter', (_, value, rule) => {
    expect(passwordRules(value)).toEqual({ ...ALL_MET, [rule]: false })
  })

  it('accepts non-ASCII letters and digits', () => {
    expect(passwordRules('äöüÄÖÜ١٢٣ßßßß')).toEqual(ALL_MET)
  })

  it('counts a decomposed é once after composing it', () => {
    expect(passwordRules('Abcdefghi1é').hasMinLength).toBe(false)
    expect(passwordRules('Abcdefghij1é').hasMinLength).toBe(true)
  })

  it('counts leading and trailing spaces', () => {
    expect(passwordRules(' Abcdefghi1 ').hasMinLength).toBe(true)
  })

  it('has no maximum, so 129 code points still meet the length rule', () => {
    expect(passwordRules(`Ab1${'c'.repeat(126)}`)).toEqual(ALL_MET)
  })
})
