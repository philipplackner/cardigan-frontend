import { useState } from 'react'

/** Counts how often a dialog opened, so each opening can start with a fresh form. */
export function useOpenSession(isOpen: boolean) {
  const [session, setSession] = useState({ isOpen, count: 0 })
  if (session.isOpen !== isOpen) {
    const next = { isOpen, count: isOpen ? session.count + 1 : session.count }
    setSession(next)
    return next.count
  }
  return session.count
}
