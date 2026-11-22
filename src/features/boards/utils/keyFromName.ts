const KEY_LENGTH = 4
const MIN_KEY_LENGTH = 2

/**
 * The key prefill for a new board: the first 4 ASCII letters of the name after removing diacritics,
 * uppercased. Empty if there are fewer than 2. NFD only, without compatibility decomposition, and
 * without locale case rules, so every platform gets the same key.
 */
export function keyFromName(name: string): string {
  const letters = name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, KEY_LENGTH)
    .toUpperCase()
  return letters.length < MIN_KEY_LENGTH ? '' : letters
}
