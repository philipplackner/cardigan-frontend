import type { AuthSession } from './SessionContext'

type FakeSessionOptions = {
  email: string | null
  onLogOut?: () => void
}

/** An `AuthSession` for tests and the preview page. `logOut` only calls `onLogOut`. */
export function createFakeSession({
  email,
  onLogOut,
}: FakeSessionOptions): AuthSession {
  return { email, logOut: () => onLogOut?.() }
}
