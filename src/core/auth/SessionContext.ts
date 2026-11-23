import { createContext, useContext } from 'react'

/** The signed-in user's session as the app shell sees it. */
export type AuthSession = {
  /** The signed-in user's email as the backend returned it (lowercased). `null` while it loads after a reload. */
  email: string | null
  /** Ends the session at once. Never throws and never needs a confirmation. */
  logOut: () => void
}

export const SessionContext = createContext<AuthSession | null>(null)

/** The signed-in user's session. Throws outside a `SessionProvider`, which only wraps signed-in screens. */
export function useSession(): AuthSession {
  const session = useContext(SessionContext)
  if (!session)
    throw new Error('useSession must be used inside SessionProvider')
  return session
}
