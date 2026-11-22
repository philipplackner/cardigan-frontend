import { describe, expect, it } from 'vitest'
import {
  FIELD_ERROR_KEYS,
  fieldErrorText,
  RULES_UNMET,
  serverFieldError,
} from './fieldErrorText'
import { createTestT } from './testT'

const t = createTestT()

function textFor(field: string, code: string) {
  const error = serverFieldError({ field, code })
  return error && { field: error.field, text: fieldErrorText(t, error.message) }
}

describe('fieldErrorText', () => {
  it.each([
    [FIELD_ERROR_KEYS.emailRequired, 'Enter your email.'],
    [FIELD_ERROR_KEYS.emailInvalid, 'Enter a valid email address.'],
    [
      FIELD_ERROR_KEYS.emailTooLong,
      "Email can't be longer than 254 characters.",
    ],
    [FIELD_ERROR_KEYS.emailUsed, 'An account with this email already exists.'],
    [FIELD_ERROR_KEYS.passwordRequired, 'Enter your password.'],
    [
      FIELD_ERROR_KEYS.passwordInvalidCharacter,
      "Password can't contain tabs or line breaks.",
    ],
    [
      FIELD_ERROR_KEYS.passwordTooLong,
      "Password can't be longer than 128 characters.",
    ],
    [FIELD_ERROR_KEYS.repeatRequired, 'Repeat your password.'],
    [FIELD_ERROR_KEYS.mismatch, 'Passwords don’t match.'],
  ])('shows %s as "%s"', (message, text) => {
    expect(fieldErrorText(t, message)).toBe(text)
  })

  it('shows no text for unmet rules', () => {
    expect(fieldErrorText(t, RULES_UNMET)).toBeUndefined()
  })

  it('shows no text without an error', () => {
    expect(fieldErrorText(t, undefined)).toBeUndefined()
  })

  it('rejects a misspelled key at compile time', () => {
    // @ts-expect-error -- the key doesn't exist in the auth translations
    expect(t('fieldErrors.emailRequird')).toBe('fieldErrors.emailRequird')
  })
})

describe('serverFieldError', () => {
  it.each([
    ['REQUIRED', 'Enter your email.'],
    ['TOO_LONG', "Email can't be longer than 254 characters."],
    ['INVALID_FORMAT', 'Enter a valid email address.'],
    ['INVALID_CHARACTER', 'Enter a valid email address.'],
    ['ALREADY_USED', 'An account with this email already exists.'],
    ['SOMETHING_NEW', 'Enter a valid email address.'],
  ])('shows the email code %s as "%s"', (code, text) => {
    expect(textFor('email', code)).toEqual({ field: 'email', text })
  })

  it.each([
    ['REQUIRED', 'Enter your password.'],
    ['INVALID_CHARACTER', "Password can't contain tabs or line breaks."],
    ['TOO_LONG', "Password can't be longer than 128 characters."],
  ])('shows the password code %s as "%s"', (code, text) => {
    expect(textFor('password', code)).toEqual({ field: 'password', text })
  })

  it.each(['TOO_SHORT', 'PASSWORD_TOO_WEAK', 'SOMETHING_NEW'])(
    'marks the password invalid without a text for %s',
    (code) => {
      expect(serverFieldError({ field: 'password', code })).toEqual({
        field: 'password',
        message: RULES_UNMET,
      })
    },
  )

  it('returns null for a field the form does not show', () => {
    expect(
      serverFieldError({
        field: 'refreshTokenTransport',
        code: 'INVALID_VALUE',
      }),
    ).toBeNull()
  })
})
