import { countCodePoints } from './text'

/** The first rule a board key breaks, in the order of shared `domain-board` › Board key format. */
export type BoardKeyError =
  'REQUIRED' | 'TOO_SHORT' | 'TOO_LONG' | 'INVALID_FORMAT'

const KEY_LETTERS = /^[A-Z]+$/

/** Uppercases ASCII a–z as the user types. Every other character stays as typed. */
export function normalizeKeyInput(value: string): string {
  return value.replace(/[a-z]/g, (letter) => letter.toUpperCase())
}

/**
 * Checks a board key: empty, then fewer than 2 characters, then more than 5, then any character
 * other than A–Z. Lengths count code points.
 */
export function checkBoardKey(key: string): BoardKeyError | null {
  const length = countCodePoints(key)
  if (length === 0) return 'REQUIRED'
  if (length < 2) return 'TOO_SHORT'
  if (length > 5) return 'TOO_LONG'
  if (!KEY_LETTERS.test(key)) return 'INVALID_FORMAT'
  return null
}

/**
 * The `common` translation key for a key format error from the local check or the server. A used key
 * has its own message, `keyErrors.alreadyUsed`. Unknown codes get the format message, as shared `api-errors` › Clients handle unknown error codes
 * by status requires.
 */
export function boardKeyErrorMessageKey(code: string) {
  switch (code) {
    case 'REQUIRED':
      return 'keyErrors.required'
    case 'TOO_SHORT':
      return 'keyErrors.tooShort'
    case 'TOO_LONG':
      return 'keyErrors.tooLong'
    default:
      return 'keyErrors.invalidFormat'
  }
}
