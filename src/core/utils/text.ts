/** How a field's text is normalized and which characters it allows. */
export type TextKind = 'singleLine' | 'multiLine' | 'password'

/** The first rule a text breaks, in the order of shared `api-errors` › One field error per field. */
export type TextError = 'EMPTY' | 'TOO_SHORT' | 'TOO_LONG' | 'INVALID_CHARACTER'

/** Length limits in code points. Both ends are inclusive. */
export type TextRule = {
  kind: TextKind
  min?: number
  max?: number
}

export type TextCheck = {
  /** The normalized text. Send this to the backend, not the raw input. */
  value: string
  error: TextError | null
}

const LINE_BREAKS = /\r\n?/g
const SURROUNDING_WHITE_SPACE = /^\p{White_Space}+|\p{White_Space}+$/gu
// In Unicode mode \p{Cs} matches only surrogates that are not part of a pair.
// oxlint-disable-next-line eslint/no-control-regex -- matching control characters is the rule
const INVALID_SINGLE_LINE = /[\u0000-\u001F]|\p{Cs}/u
// oxlint-disable-next-line eslint/no-control-regex -- matching control characters is the rule
const INVALID_MULTI_LINE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]|\p{Cs}/u

/**
 * Normalizes text per shared `text-length`.
 *
 * Single-line and multi-line text: CRLF and lone CR become LF, then NFC, then leading and trailing
 * Unicode White_Space is removed. Passwords are only normalized to NFC.
 */
export function normalizeText(value: string, kind: TextKind): string {
  if (kind === 'password') return value.normalize('NFC')
  // Not trim(): it removes U+FEFF and keeps U+0085, unlike White_Space.
  return value
    .replace(LINE_BREAKS, '\n')
    .normalize('NFC')
    .replace(SURROUNDING_WHITE_SPACE, '')
}

/** Counts Unicode code points. A lone surrogate counts as one. Doesn't normalize. */
export function countCodePoints(value: string): number {
  let count = 0
  for (const _ of value) count++
  return count
}

/**
 * Normalizes [value] and checks it against [rule].
 *
 * Returns the first broken rule: `INVALID_CHARACTER` (an unpaired surrogate, or a control character
 * in U+0000–U+001F other than tab, LF and CR in multi-line text), then `EMPTY`, `TOO_SHORT` and
 * `TOO_LONG`. `EMPTY` is reported even without a minimum, so skip the check for optional fields
 * left empty.
 */
export function checkText(value: string, rule: TextRule): TextCheck {
  const normalized = normalizeText(value, rule.kind)
  return { value: normalized, error: firstError(normalized, rule) }
}

function firstError(value: string, { kind, min, max }: TextRule) {
  const invalid =
    kind === 'multiLine' ? INVALID_MULTI_LINE : INVALID_SINGLE_LINE
  if (invalid.test(value)) return 'INVALID_CHARACTER'
  const length = countCodePoints(value)
  if (length === 0) return 'EMPTY'
  if (length < (min ?? 0)) return 'TOO_SHORT'
  if (length > (max ?? Infinity)) return 'TOO_LONG'
  return null
}
