import type { ReactNode } from 'react'
import { ClockContext } from './ClockContext'

/** Replaces the clock behind relative times, for tests and the preview page. */
export function ClockProvider({
  clock,
  children,
}: {
  clock: () => Date
  children: ReactNode
}) {
  return <ClockContext value={clock}>{children}</ClockContext>
}
