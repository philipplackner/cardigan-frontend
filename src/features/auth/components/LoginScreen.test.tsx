import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { AuthResult, LogIn } from '../types'
import { LoginRoot } from './LoginScreen'
import { deferredResult, renderTestLink } from './testUtils'

function renderLogin({
  logIn = vi.fn<LogIn>(() => Promise.resolve({ ok: true })),
  isSessionExpired = false,
}: { logIn?: LogIn; isSessionExpired?: boolean } = {}) {
  const onLoggedIn = vi.fn()
  const user = userEvent.setup()
  render(
    <LoginRoot
      logIn={logIn}
      onLoggedIn={onLoggedIn}
      isSessionExpired={isSessionExpired}
      renderRegisterLink={renderTestLink}
    />,
  )
  return { user, logIn, onLoggedIn }
}

function failingWith(result: AuthResult) {
  return vi.fn<LogIn>(() => Promise.resolve(result))
}

const email = () => screen.getByLabelText('Email')
const password = () => screen.getByLabelText('Password')
const submitButton = () => screen.getByRole('button', { name: /^Log/ })

async function fillAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
  values = { email: 'ann@example.com', password: 'Correct horse 7' },
) {
  if (values.email) await user.type(email(), values.email)
  if (values.password) await user.type(password(), values.password)
  await user.click(submitButton())
}

describe('LoginRoot', () => {
  it('shows the empty screen', () => {
    renderLogin()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Log in to Cardigan' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Cardigan')).toBeInTheDocument()
    expect(
      screen.getByRole('form', { name: 'Log in to Cardigan' }),
    ).toBeInTheDocument()
    expect(email()).toHaveValue('')
    expect(password()).toHaveValue('')
    expect(submitButton()).toHaveTextContent('Log in')
    expect(screen.getByText(/No account yet\?/)).toHaveTextContent(
      'No account yet? Create one',
    )
    expect(screen.getByRole('link', { name: 'Create one' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('offers saved emails and passwords and hides the password', () => {
    renderLogin()

    expect(email()).toHaveAttribute('type', 'email')
    expect(email()).toHaveAttribute('autocomplete', 'username')
    expect(password()).toHaveAttribute('type', 'password')
    expect(password()).toHaveAttribute('autocomplete', 'current-password')
  })

  it('accepts a pasted password', async () => {
    const { user } = renderLogin()

    await user.click(password())
    await user.paste('Pasted secret 1')

    expect(password()).toHaveValue('Pasted secret 1')
  })

  it('sends nothing for an untouched form, shows both errors and focuses the email', async () => {
    const { user, logIn } = renderLogin()

    await user.click(submitButton())

    expect(logIn).not.toHaveBeenCalled()
    expect(screen.getByText('Enter your email.')).toBeInTheDocument()
    expect(screen.getByText('Enter your password.')).toBeInTheDocument()
    expect(email()).toHaveFocus()
  })

  it('shows a field error only after the field loses focus', async () => {
    const { user } = renderLogin()

    await user.click(email())
    expect(screen.queryByText('Enter your email.')).not.toBeInTheDocument()
    await user.tab()
    expect(screen.getByText('Enter your email.')).toBeInTheDocument()
    await user.type(email(), 'a')
    expect(screen.queryByText('Enter your email.')).not.toBeInTheDocument()
  })

  it('sends a malformed email, because log in only checks for filled-in fields', async () => {
    const { user, logIn } = renderLogin()

    await fillAndSubmit(user, { email: 'ann@', password: 'secret' })

    expect(logIn).toHaveBeenCalledWith({ email: 'ann@', password: 'secret' })
  })

  it('sends a password of only spaces', async () => {
    const { user, logIn } = renderLogin()

    await fillAndSubmit(user, { email: 'ann@example.com', password: '   ' })

    expect(logIn).toHaveBeenCalledWith({
      email: 'ann@example.com',
      password: '   ',
    })
  })

  it('blocks a whitespace email', async () => {
    const { user, logIn } = renderLogin()

    await fillAndSubmit(user, { email: '   ', password: 'secret' })

    expect(logIn).not.toHaveBeenCalled()
    expect(screen.getByText('Enter your email.')).toBeInTheDocument()
  })

  it('disables the fields and keeps the values while logging in', async () => {
    const request = deferredResult()
    const { user } = renderLogin({ logIn: vi.fn(() => request.promise) })

    await fillAndSubmit(user)

    expect(email()).toBeDisabled()
    expect(password()).toBeDisabled()
    expect(submitButton()).toHaveTextContent('Logging in…')
    expect(submitButton()).toHaveAttribute('aria-busy', 'true')

    await act(async () => {
      request.resolve({ ok: false, error: { kind: 'other' } })
    })
    expect(email()).toBeEnabled()
    expect(email()).toHaveValue('ann@example.com')
    expect(password()).toHaveValue('Correct horse 7')
    expect(submitButton()).toHaveTextContent('Log in')
  })

  it('shows wrong credentials, keeps both values and clears on the next edit', async () => {
    const { user } = renderLogin({
      logIn: failingWith({ ok: false, error: { kind: 'invalidCredentials' } }),
    })

    await fillAndSubmit(user)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Email or password is incorrect.',
    )
    expect(email()).toHaveValue('ann@example.com')
    expect(password()).toHaveValue('Correct horse 7')
    expect(password()).toHaveAttribute('aria-invalid', 'true')
    expect(email()).not.toHaveAttribute('aria-invalid')

    await user.type(email(), 'x')

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(password()).not.toHaveAttribute('aria-invalid')
  })

  it.each([
    [12, 'Too many attempts. Try again in 12 seconds.'],
    [60, 'Too many attempts. Try again in 1 minute.'],
    [61, 'Too many attempts. Try again in 2 minutes.'],
    [null, "Couldn't reach Cardigan. Check your connection and try again."],
  ])('shows the rate limit with Retry-After %o', async (seconds, text) => {
    const { user } = renderLogin({
      logIn: failingWith({
        ok: false,
        error: { kind: 'rateLimited', retryAfterSeconds: seconds },
      }),
    })

    await fillAndSubmit(user)

    expect(screen.getByRole('alert')).toHaveTextContent(text)
    expect(submitButton()).toBeEnabled()
    expect(password()).not.toHaveAttribute('aria-invalid')
  })

  it('shows the generic banner and keeps the values on other failures', async () => {
    const { user } = renderLogin({
      logIn: vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    })

    await fillAndSubmit(user)

    expect(screen.getByRole('alert')).toHaveTextContent(
      "Couldn't reach Cardigan. Check your connection and try again.",
    )
    expect(email()).toHaveValue('ann@example.com')
    expect(password()).toHaveValue('Correct horse 7')
  })

  it('removes the banner while a retry runs', async () => {
    const request = deferredResult()
    const logIn = vi
      .fn<LogIn>()
      .mockResolvedValueOnce({ ok: false, error: { kind: 'other' } })
      .mockReturnValueOnce(request.promise)
    const { user } = renderLogin({ logIn })

    await fillAndSubmit(user)
    expect(screen.getByRole('alert')).toBeInTheDocument()

    await user.click(submitButton())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await act(async () => request.resolve({ ok: true }))
  })

  it('shows the session expired banner with empty fields and keeps it while typing', async () => {
    const { user } = renderLogin({ isSessionExpired: true })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Your session has expired. Log in again to continue.',
    )
    expect(email()).toHaveValue('')

    await user.type(email(), 'ann@example.com')

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('keeps the session expired banner on a submit that field errors block', async () => {
    const { user, logIn } = renderLogin({ isSessionExpired: true })

    await user.type(password(), 'secret')
    await user.click(submitButton())

    expect(logIn).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('replaces the session expired banner on a submit that sends a request', async () => {
    const { user } = renderLogin({
      isSessionExpired: true,
      logIn: failingWith({ ok: false, error: { kind: 'invalidCredentials' } }),
    })

    await fillAndSubmit(user)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Email or password is incorrect.',
    )
  })

  it('tells the host on success and shows nothing itself', async () => {
    const { user, onLoggedIn } = renderLogin()

    await fillAndSubmit(user)

    expect(onLoggedIn).toHaveBeenCalledOnce()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('works with the keyboard only: tab order and Enter submits', async () => {
    const { user, logIn } = renderLogin()

    await user.tab()
    expect(email()).toHaveFocus()
    await user.keyboard('ann@example.com')
    await user.tab()
    expect(password()).toHaveFocus()
    await user.keyboard('Correct horse 7')
    await user.tab()
    expect(submitButton()).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Create one' })).toHaveFocus()

    await user.click(password())
    await user.keyboard('{Enter}')
    expect(logIn).toHaveBeenCalledOnce()
  })

  it('names the banner region inside the form', async () => {
    const { user } = renderLogin({
      logIn: failingWith({ ok: false, error: { kind: 'invalidCredentials' } }),
    })

    await fillAndSubmit(user)

    const form = screen.getByRole('form', { name: 'Log in to Cardigan' })
    expect(within(form).getByRole('alert')).toBeInTheDocument()
  })
})
