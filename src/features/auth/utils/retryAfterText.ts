import type { TFunction } from 'i18next'

/** The wait time in the rate limit banner: seconds below a minute, otherwise whole minutes rounded up. */
export function retryAfterText(t: TFunction<'auth'>, seconds: number): string {
  if (seconds < 60) return t('retryAfter.seconds', { count: seconds })
  return t('retryAfter.minutes', { count: Math.ceil(seconds / 60) })
}
