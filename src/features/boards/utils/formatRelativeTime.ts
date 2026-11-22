/** How long ago something changed, before it is turned into text. */
export type RelativeTime =
  | { kind: 'justNow' }
  | { kind: 'minutes'; count: number }
  | { kind: 'hours'; count: number }
  | { kind: 'yesterday' }
  | { kind: 'date'; date: Date }
  | { kind: 'dateWithYear'; date: Date }

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

/**
 * Relative time in the device's time zone. Under a minute, or in the future: just now. Under an
 * hour: whole minutes. Same calendar day: whole hours. Then yesterday, then a date. Minutes and hours
 * are rounded down.
 */
export function formatRelativeTime(time: Date, now: Date): RelativeTime {
  const elapsed = now.getTime() - time.getTime()
  if (elapsed < MINUTE_MS) return { kind: 'justNow' }
  if (elapsed < HOUR_MS) {
    return { kind: 'minutes', count: Math.floor(elapsed / MINUTE_MS) }
  }
  if (isSameDay(time, now)) {
    return { kind: 'hours', count: Math.floor(elapsed / HOUR_MS) }
  }
  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  )
  if (isSameDay(time, yesterday)) return { kind: 'yesterday' }
  return time.getFullYear() === now.getFullYear()
    ? { kind: 'date', date: time }
    : { kind: 'dateWithYear', date: time }
}
