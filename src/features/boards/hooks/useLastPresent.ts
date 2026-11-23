import { useState } from 'react'

/** The latest non-null value, so a closing dialog keeps its text while it animates out. */
export function useLastPresent<T>(value: T | null): T | null {
  const [last, setLast] = useState(value)
  if (value !== null && value !== last) setLast(value)
  return value ?? last
}
