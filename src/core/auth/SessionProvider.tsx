import type { ReactNode } from 'react'
import { SessionContext, type AuthSession } from './SessionContext'

type SessionProviderProps = {
  session: AuthSession
  children: ReactNode
}

/** Provides the signed-in user's session. The host removes it in the same update that ends the session. */
export function SessionProvider({ session, children }: SessionProviderProps) {
  return <SessionContext value={session}>{children}</SessionContext>
}
