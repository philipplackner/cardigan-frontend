import { checkText } from '@/core/utils/text'

/** Shared `domain-column` › Column name: 1–30 code points. */
export const COLUMN_NAME_MAX = 30

/** Shared `domain-card` › Card title: 1–200 code points. */
export const CARD_TITLE_MAX = 200

/** Normalizes and checks a column name. Send the returned `value`. */
export function checkColumnName(value: string) {
  return checkText(value, { kind: 'singleLine', max: COLUMN_NAME_MAX })
}

/** Normalizes and checks a card title. Send the returned `value`. */
export function checkCardTitle(value: string) {
  return checkText(value, { kind: 'singleLine', max: CARD_TITLE_MAX })
}
