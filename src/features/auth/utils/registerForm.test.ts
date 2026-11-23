import { describe, expect, it } from 'vitest'
import { FIELD_ERROR_KEYS, RULES_UNMET } from './fieldErrorText'
import { registerFormSchema } from './registerForm'

const VALID_PASSWORD = 'Correct horse 7'

type Values = { email: string; password: string; repeatPassword: string }

function errors(overrides: Partial<Values>) {
  const values = {
    email: 'ann@example.com',
    password: VALID_PASSWORD,
    repeatPassword: overrides.password ?? VALID_PASSWORD,
    ...overrides,
  }
  const result = registerFormSchema.safeParse(values)
  if (result.success) return {}
  const byField: Record<string, string[]> = {}
  for (const issue of result.error.issues) {
    const field = issue.path.join('.')
    byField[field] = [...(byField[field] ?? []), issue.message]
  }
  return byField
}

/** A domain whose labels stay within 63 characters, so `ann@` plus it has [length] code points. */
function domainOfLength(length: number) {
  const labels: string[] = []
  let remaining = length - 'ann@.com'.length
  while (remaining > 63) {
    labels.push('a'.repeat(49))
    remaining -= 50
  }
  labels.push('a'.repeat(remaining))
  return `${labels.join('.')}.com`
}

describe('registerFormSchema email', () => {
  it('accepts a valid email', () => {
    expect(errors({})).toEqual({})
  })

  it('reports a whitespace email as empty', () => {
    expect(errors({ email: '   ' })).toEqual({
      email: [FIELD_ERROR_KEYS.emailRequired],
    })
  })

  it('accepts surrounding spaces and keeps the case', () => {
    expect(errors({ email: '  Ann@Example.com ' })).toEqual({})
  })

  it('accepts 254 code points', () => {
    const email = `ann@${domainOfLength(254)}`
    expect(email).toHaveLength(254)
    expect(errors({ email })).toEqual({})
  })

  it('reports 255 code points as too long', () => {
    expect(errors({ email: `ann@${domainOfLength(255)}` })).toEqual({
      email: [FIELD_ERROR_KEYS.emailTooLong],
    })
  })

  it('reports the length before the format', () => {
    expect(errors({ email: 'ü'.repeat(255) })).toEqual({
      email: [FIELD_ERROR_KEYS.emailTooLong],
    })
  })

  it('accepts several subdomains', () => {
    expect(errors({ email: 'ann@a.b.example.co.uk' })).toEqual({})
  })

  it('reports a tab before the length', () => {
    const email = `ann\t@${domainOfLength(254)}`
    expect(email).toHaveLength(255)
    expect(errors({ email })).toEqual({
      email: [FIELD_ERROR_KEYS.emailInvalid],
    })
  })

  it('reports the length before a missing @', () => {
    expect(errors({ email: 'a'.repeat(255) })).toEqual({
      email: [FIELD_ERROR_KEYS.emailTooLong],
    })
  })

  it.each([
    'ann@',
    'mail@pl-coding',
    '"ann lee"@example.com',
    'ann@[192.168.0.1]',
    'jürgen@münchen.de',
    'ann(work)@example.com',
    'a\tb@x.de',
  ])('reports %s as invalid', (email) => {
    expect(errors({ email })).toEqual({
      email: [FIELD_ERROR_KEYS.emailInvalid],
    })
  })
})

describe('registerFormSchema password', () => {
  it('reports an empty password', () => {
    expect(errors({ password: '', repeatPassword: 'x' })).toEqual({
      password: [FIELD_ERROR_KEYS.passwordRequired],
      repeatPassword: [FIELD_ERROR_KEYS.mismatch],
    })
  })

  it('reports unmet rules without a text', () => {
    expect(errors({ password: 'abcdefghijkl' })).toEqual({
      password: [RULES_UNMET],
    })
  })

  it('reports a tab in a password that meets the rules', () => {
    expect(errors({ password: 'Correct\thorse 7' })).toEqual({
      password: [FIELD_ERROR_KEYS.passwordInvalidCharacter],
    })
  })

  it('reports an unpaired surrogate', () => {
    expect(errors({ password: 'Correct horse 7\uD83D' })).toEqual({
      password: [FIELD_ERROR_KEYS.passwordInvalidCharacter],
    })
  })

  it('reports 129 code points that meet the rules as too long', () => {
    expect(errors({ password: `Ab1${'c'.repeat(126)}` })).toEqual({
      password: [FIELD_ERROR_KEYS.passwordTooLong],
    })
  })

  it('accepts 120 ASCII characters and eight emoji, which are 128 code points', () => {
    const password = `Ab1${'c'.repeat(117)}${'😀'.repeat(8)}`
    expect(password).toHaveLength(136)
    expect(errors({ password })).toEqual({})
  })

  it('reports a tab before unmet rules', () => {
    expect(errors({ password: 'abc\tdef' })).toEqual({
      password: [FIELD_ERROR_KEYS.passwordInvalidCharacter],
    })
  })

  it('reports unmet rules before the maximum length', () => {
    expect(errors({ password: 'a'.repeat(129) })).toEqual({
      password: [RULES_UNMET],
    })
  })
})

describe('registerFormSchema repeat password', () => {
  it('reports an empty repeat', () => {
    expect(errors({ repeatPassword: '' })).toEqual({
      repeatPassword: [FIELD_ERROR_KEYS.repeatRequired],
    })
  })

  it('reports a mismatch', () => {
    expect(errors({ repeatPassword: 'Correct horse 8' })).toEqual({
      repeatPassword: [FIELD_ERROR_KEYS.mismatch],
    })
  })

  it('compares the raw values, not the composed ones', () => {
    expect(
      errors({ password: 'Corrécthorse 7', repeatPassword: 'Corrécthorse 7' }),
    ).toEqual({ repeatPassword: [FIELD_ERROR_KEYS.mismatch] })
  })

  it('reports a mismatch together with an invalid email', () => {
    expect(errors({ email: 'ann@', repeatPassword: 'other' })).toEqual({
      email: [FIELD_ERROR_KEYS.emailInvalid],
      repeatPassword: [FIELD_ERROR_KEYS.mismatch],
    })
  })

  it('reports a mismatch together with unmet rules', () => {
    expect(
      errors({ password: 'abcdefghijkl', repeatPassword: 'abcdefghijk' }),
    ).toEqual({
      password: [RULES_UNMET],
      repeatPassword: [FIELD_ERROR_KEYS.mismatch],
    })
  })

  it('reports one error per field when everything is empty', () => {
    expect(errors({ email: '', password: '', repeatPassword: '' })).toEqual({
      email: [FIELD_ERROR_KEYS.emailRequired],
      password: [FIELD_ERROR_KEYS.passwordRequired],
      repeatPassword: [FIELD_ERROR_KEYS.repeatRequired],
    })
  })
})
