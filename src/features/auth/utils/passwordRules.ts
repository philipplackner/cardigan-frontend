import { countCodePoints, normalizeText } from '@/core/utils/text'

export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 128

/** The four live rules shown under the register password, per shared `domain-user`. */
export type PasswordRulesState = {
  hasMinLength: boolean
  hasLowercase: boolean
  hasUppercase: boolean
  hasDigit: boolean
}

/** Checks the live rules on the NFC form of `value`, without trimming. */
export function passwordRules(value: string): PasswordRulesState {
  const password = normalizeText(value, 'password')
  return {
    hasMinLength: countCodePoints(password) >= PASSWORD_MIN_LENGTH,
    hasLowercase: /\p{Ll}/u.test(password),
    hasUppercase: /\p{Lu}/u.test(password),
    hasDigit: /\p{Nd}/u.test(password),
  }
}

export function meetsPasswordRules(rules: PasswordRulesState) {
  return (
    rules.hasMinLength &&
    rules.hasLowercase &&
    rules.hasUppercase &&
    rules.hasDigit
  )
}
