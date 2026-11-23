import { describe, expect, it } from 'vitest'
import { FIELD_ERROR_KEYS } from './fieldErrorText'
import { loginFormSchema } from './loginForm'

function errors(values: { email: string; password: string }) {
  const result = loginFormSchema.safeParse(values)
  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [
          issue.path.join('.'),
          issue.message,
        ]),
      )
}

describe('loginFormSchema', () => {
  it('accepts a filled-in form', () => {
    expect(errors({ email: 'ann@example.com', password: 'secret' })).toEqual({})
  })

  it('accepts a malformed email, because log in only checks that it is filled in', () => {
    expect(errors({ email: 'ann@', password: 'secret' })).toEqual({})
  })

  it('reports both empty fields', () => {
    expect(errors({ email: '', password: '' })).toEqual({
      email: FIELD_ERROR_KEYS.emailRequired,
      password: FIELD_ERROR_KEYS.passwordRequired,
    })
  })

  it('reports a whitespace-only email as empty', () => {
    expect(errors({ email: '  \t　 ', password: 'secret' })).toEqual({
      email: FIELD_ERROR_KEYS.emailRequired,
    })
  })

  it('accepts a password of only spaces', () => {
    expect(errors({ email: 'ann@example.com', password: '   ' })).toEqual({})
  })

  it('accepts a password of any length', () => {
    expect(
      errors({ email: 'ann@example.com', password: 'a'.repeat(500) }),
    ).toEqual({})
  })
})
