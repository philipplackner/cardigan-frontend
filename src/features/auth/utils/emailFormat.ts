/** The reference pattern from shared `domain-user` › Email format has one reference pattern. */
const EMAIL_FORMAT =
  /^(?=[^@]{1,64}@)[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/

/**
 * Checks a normalized email against the shared `domain-user` reference pattern. Runs in linear time,
 * because every repeated group in the pattern starts with a literal `.`.
 */
export function isValidEmail(value: string): boolean {
  return EMAIL_FORMAT.test(value)
}
