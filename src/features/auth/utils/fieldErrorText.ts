import type { TFunction } from 'i18next'
import type { FieldFailure } from '../types'

/** Translation keys in the `auth` namespace used as form error messages. */
export const FIELD_ERROR_KEYS = {
  emailRequired: 'fieldErrors.emailRequired',
  emailInvalid: 'fieldErrors.emailInvalid',
  emailTooLong: 'fieldErrors.emailTooLong',
  emailUsed: 'fieldErrors.emailUsed',
  passwordRequired: 'fieldErrors.passwordRequired',
  passwordInvalidCharacter: 'fieldErrors.passwordInvalidCharacter',
  passwordTooLong: 'fieldErrors.passwordTooLong',
  repeatRequired: 'fieldErrors.repeatRequired',
  mismatch: 'fieldErrors.mismatch',
} as const

/** Marks the register password invalid without a text, because the live rules already show what is missing. */
export const RULES_UNMET = 'rulesUnmet'

export type FieldErrorKey =
  (typeof FIELD_ERROR_KEYS)[keyof typeof FIELD_ERROR_KEYS]
export type FieldMessage = FieldErrorKey | typeof RULES_UNMET

const FIELD_ERROR_KEY_SET: ReadonlySet<string> = new Set(
  Object.values(FIELD_ERROR_KEYS),
)

function isFieldErrorKey(message: string): message is FieldErrorKey {
  return FIELD_ERROR_KEY_SET.has(message)
}

/** The text under a field for a form error message. `undefined` for `rulesUnmet` and for no error. */
export function fieldErrorText(
  t: TFunction<'auth'>,
  message: string | undefined,
): string | undefined {
  if (message === undefined || !isFieldErrorKey(message)) return undefined
  return t(message)
}

export type ServerFieldError = {
  field: 'email' | 'password'
  message: FieldMessage
}

function emailMessage(code: string): FieldMessage {
  switch (code) {
    case 'REQUIRED':
      return FIELD_ERROR_KEYS.emailRequired
    case 'TOO_LONG':
      return FIELD_ERROR_KEYS.emailTooLong
    case 'ALREADY_USED':
      return FIELD_ERROR_KEYS.emailUsed
    default:
      return FIELD_ERROR_KEYS.emailInvalid
  }
}

function passwordMessage(code: string): FieldMessage {
  switch (code) {
    case 'REQUIRED':
      return FIELD_ERROR_KEYS.passwordRequired
    case 'INVALID_CHARACTER':
      return FIELD_ERROR_KEYS.passwordInvalidCharacter
    case 'TOO_LONG':
      return FIELD_ERROR_KEYS.passwordTooLong
    default:
      return RULES_UNMET
  }
}

/**
 * Maps a server field error to the form field and message that show it. `null` for a field the
 * form doesn't show, which falls back to the generic banner.
 */
export function serverFieldError(
  failure: FieldFailure,
): ServerFieldError | null {
  switch (failure.field) {
    case 'email':
      return { field: 'email', message: emailMessage(failure.code) }
    case 'password':
      return { field: 'password', message: passwordMessage(failure.code) }
    default:
      return null
  }
}
