import { useContext, useState } from 'react'
import { ClockContext } from './ClockContext'

/**
 * The time relative times are measured against. Taken on mount and again whenever `dataUpdatedAt`
 * changes, so a refresh updates "2 hours ago" even when the boards didn't change. It doesn't tick.
 */
export function useNow(dataUpdatedAt: number): Date {
  const clock = useContext(ClockContext)
  const [taken, setTaken] = useState(() => ({ dataUpdatedAt, now: clock() }))
  if (taken.dataUpdatedAt !== dataUpdatedAt) {
    const next = { dataUpdatedAt, now: clock() }
    setTaken(next)
    return next.now
  }
  return taken.now
}
