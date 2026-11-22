import { z } from 'zod'
import { checkText, countCodePoints, normalizeText } from '@/core/utils/text'
import { isAddrSpec } from './emailFormat'
import {
  FIELD_ERROR_KEYS,
  RULES_UNMET,
  type FieldMessage,
} from './fieldErrorText'
import {
  meetsPasswordRules,
  PASSWORD_MAX_LENGTH,
  passwordRules,
} from './passwordRules'

export const EMAIL_MAX_LENGTH = 254

/** The first broken email rule, in the order of shared `api-errors` › One field error per field. */
export function registerEmailError(value: string): FieldMessage | null {
  const email = normalizeText(value, 'singleLine')
  if (email === '') return FIELD_ERROR_KEYS.emailRequired
  if (countCodePoints(email) > EMAIL_MAX_LENGTH) {
    return FIELD_ERROR_KEYS.emailTooLong
  }
  if (!isAddrSpec(email)) return FIELD_ERROR_KEYS.emailInvalid
  return null
}

/** The first broken password rule: empty, invalid character, a live rule, then the maximum length. */
export function registerPasswordError(value: string): FieldMessage | null {
  const { error } = checkText(value, {
    kind: 'password',
    max: PASSWORD_MAX_LENGTH,
  })
  if (error === 'EMPTY') return FIELD_ERROR_KEYS.passwordRequired
  if (error === 'INVALID_CHARACTER') {
    return FIELD_ERROR_KEYS.passwordInvalidCharacter
  }
  if (!meetsPasswordRules(passwordRules(value))) return RULES_UNMET
  if (error === 'TOO_LONG') return FIELD_ERROR_KEYS.passwordTooLong
  return null
}

function fieldRule(check: (value: string) => FieldMessage | null) {
  return z.string().superRefine((value, context) => {
    const message = check(value)
    if (message) context.addIssue({ code: 'custom', message })
  })
}

export const registerFormSchema = z
  .object({
    email: fieldRule(registerEmailError),
    password: fieldRule(registerPasswordError),
    repeatPassword: fieldRule((value) =>
      value === '' ? FIELD_ERROR_KEYS.repeatRequired : null,
    ),
  })
  .refine(
    ({ password, repeatPassword }) =>
      repeatPassword === '' || password === repeatPassword,
    {
      message: FIELD_ERROR_KEYS.mismatch,
      path: ['repeatPassword'],
      // Zod skips object refinements once a field has an issue; the mismatch must still show.
      when: ({ value }) => {
        const values = value as Partial<Record<string, unknown>>
        return (
          typeof values.password === 'string' &&
          typeof values.repeatPassword === 'string'
        )
      },
    },
  )

export type RegisterFormValues = z.infer<typeof registerFormSchema>
