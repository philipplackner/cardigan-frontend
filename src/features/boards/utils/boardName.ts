import { checkText } from '@/core/utils/text'

/** Shared `domain-board` › Board name: 1–100 code points. */
export const BOARD_NAME_MAX = 100

/** Normalizes and checks a board name. Send the returned `value`. */
export function checkBoardName(value: string) {
  return checkText(value, { kind: 'singleLine', max: BOARD_NAME_MAX })
}

/**
 * The `common` translation key for a name error from `checkText` or a server field error. Unknown
 * codes get the invalid-character message, as shared `api-errors` › Clients handle unknown error
 * codes by status requires. `tooLong` takes the limit as `n`.
 */
export function nameErrorMessageKey(code: string) {
  switch (code) {
    case 'EMPTY':
    case 'REQUIRED':
      return 'nameErrors.required'
    case 'TOO_LONG':
      return 'nameErrors.tooLong'
    default:
      return 'nameErrors.invalidCharacter'
  }
}
