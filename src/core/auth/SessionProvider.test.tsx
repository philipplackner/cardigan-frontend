import { render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createFakeSession } from './fakeSession'
import { useSession, type AuthSession } from './SessionContext'
import { SessionProvider } from './SessionProvider'

afterEach(() => {
  vi.restoreAllMocks()
})

function wrapperFor(session: AuthSession) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <SessionProvider session={session}>{children}</SessionProvider>
  }
}

function AccountRow() {
  const { email, logOut } = useSession()
  return (
    <div>
      <span>{email ?? 'Loading email'}</span>
      <button onClick={logOut}>Log out</button>
    </div>
  )
}

describe('useSession', () => {
  it('returns the email and log out action of the provided session', () => {
    const session = createFakeSession({ email: 'ann@example.com' })

    const { result } = renderHook(() => useSession(), {
      wrapper: wrapperFor(session),
    })

    expect(result.current.email).toBe('ann@example.com')
    expect(result.current.logOut).toBe(session.logOut)
  })

  it('reports an email that is not loaded yet as null', () => {
    const { result } = renderHook(() => useSession(), {
      wrapper: wrapperFor(createFakeSession({ email: null })),
    })

    expect(result.current.email).toBeNull()
  })

  it('throws a clear error outside a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(() => useSession())).toThrow(
      'useSession must be used inside SessionProvider',
    )
  })

  it('runs log out once per click, without a confirmation', async () => {
    const user = userEvent.setup()
    const onLogOut = vi.fn()
    render(
      <SessionProvider
        session={createFakeSession({ email: 'ann@example.com', onLogOut })}
      >
        <AccountRow />
      </SessionProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Log out' }))

    expect(onLogOut).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('createFakeSession', () => {
  it('calls onLogOut once per logOut', () => {
    const onLogOut = vi.fn()
    const session = createFakeSession({ email: 'ann@example.com', onLogOut })

    session.logOut()
    expect(onLogOut).toHaveBeenCalledTimes(1)
    session.logOut()
    expect(onLogOut).toHaveBeenCalledTimes(2)
  })

  it('does nothing on logOut without onLogOut', () => {
    expect(() => createFakeSession({ email: null }).logOut()).not.toThrow()
  })
})
