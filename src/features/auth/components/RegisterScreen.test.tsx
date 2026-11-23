import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { AuthResult, FieldFailure, Register } from '../types'
import { RegisterRoot } from './RegisterScreen'
import { deferredResult, renderTestLink } from './testUtils'

const VALID_PASSWORD = 'Correct horse 7'

function renderRegister(
  register = vi.fn<Register>(() => Promise.resolve({ ok: true })),
) {
  const onRegistered = vi.fn()
  const user = userEvent.setup()
  render(
    <RegisterRoot
      register={register}
      onRegistered={onRegistered}
      renderLogInLink={renderTestLink}
    />,
  )
  return { user, register, onRegistered }
}

function failingWith(result: AuthResult) {
  return vi.fn<Register>(() => Promise.resolve(result))
}

const email = () => screen.getByLabelText('Email')
const password = () => screen.getByLabelText('Password')
const repeat = () => screen.getByLabelText('Repeat password')
const submitButton = () => screen.getByRole('button', { name: /^Creat/ })
const rules = () => screen.getByRole('list', { name: 'Password requirements' })

function ruleStates() {
  return within(rules())
    .getAllByRole('listitem')
    .map((item) => item.textContent)
}

async function typeInto(
  user: ReturnType<typeof userEvent.setup>,
  input: HTMLElement,
  value: string,
) {
  await user.click(input)
  await user.paste(value)
}

async function fillAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
  values = {
    email: 'ann@example.com',
    password: VALID_PASSWORD,
    repeat: VALID_PASSWORD,
  },
) {
  if (values.email) await typeInto(user, email(), values.email)
  if (values.password) await typeInto(user, password(), values.password)
  if (values.repeat) await typeInto(user, repeat(), values.repeat)
  await user.click(submitButton())
}

function serverFieldErrors(fields: FieldFailure[]) {
  return failingWith({ ok: false, error: { kind: 'invalidFields', fields } })
}

describe('RegisterRoot', () => {
  it('shows the empty screen with every rule not met', () => {
    renderRegister()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Create your account' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('form', { name: 'Create your account' }),
    ).toBeInTheDocument()
    expect(email()).toHaveValue('')
    expect(password()).toHaveValue('')
    expect(repeat()).toHaveValue('')
    expect(ruleStates()).toEqual([
      'Not met: 12+ characters',
      'Not met: Lowercase letter',
      'Not met: Uppercase letter',
      'Not met: Digit',
    ])
    expect(submitButton()).toHaveTextContent('Create account')
    expect(screen.getByText(/Already have an account\?/)).toHaveTextContent(
      'Already have an account? Log in',
    )
    expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument()
  })

  it('lets password managers suggest a new password', () => {
    renderRegister()

    expect(email()).toHaveAttribute('autocomplete', 'username')
    expect(password()).toHaveAttribute('autocomplete', 'new-password')
    expect(password()).toHaveAttribute('type', 'password')
    expect(repeat()).toHaveAttribute('autocomplete', 'new-password')
    expect(repeat()).toHaveAttribute('type', 'password')
  })

  it('links the rules to the password field', () => {
    renderRegister()

    expect(password()).toHaveAccessibleDescription(
      expect.stringContaining('12+ characters'),
    )
  })

  it('updates the rules on every keystroke before the field loses focus', async () => {
    const { user } = renderRegister()

    await user.type(password(), 'abcdefghijkl')

    expect(password()).toHaveFocus()
    expect(ruleStates()).toEqual([
      'Met: 12+ characters',
      'Met: Lowercase letter',
      'Not met: Uppercase letter',
      'Not met: Digit',
    ])
    expect(password()).not.toHaveAttribute('aria-invalid')
  })

  it('counts code points: ten characters and an emoji are not enough', async () => {
    const { user } = renderRegister()

    await typeInto(user, password(), 'Abcdefghi1😀')

    expect(ruleStates()[0]).toBe('Not met: 12+ characters')
  })

  it('shows no email error while typing, then after leaving, then clears it live', async () => {
    const { user } = renderRegister()

    await user.type(email(), 'ann@')
    expect(screen.queryByText('Enter a valid email address.')).toBeNull()

    await user.tab()
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()

    await user.click(email())
    await user.type(email(), 'example.com')
    expect(screen.queryByText('Enter a valid email address.')).toBeNull()
    expect(email()).toHaveFocus()
  })

  it('updates the mismatch when the password changes', async () => {
    const { user } = renderRegister()

    await typeInto(user, password(), VALID_PASSWORD)
    await typeInto(user, repeat(), 'Correct horse')
    await user.tab()
    expect(screen.getByText('Passwords don’t match.')).toBeInTheDocument()

    await user.clear(password())
    await typeInto(user, password(), 'Correct horse')

    expect(screen.queryByText('Passwords don’t match.')).toBeNull()
  })

  it('shows no repeat error while the repeat field is untouched', async () => {
    const { user } = renderRegister()

    await typeInto(user, password(), VALID_PASSWORD)
    await user.click(email())
    await user.type(password(), 'x')

    expect(screen.queryByText('Repeat your password.')).toBeNull()
    expect(screen.queryByText('Passwords don’t match.')).toBeNull()
    expect(repeat()).not.toHaveAttribute('aria-invalid')
  })

  it('marks a weak password on submit without a message', async () => {
    const { user, register } = renderRegister()

    await fillAndSubmit(user, {
      email: 'ann@example.com',
      password: 'abcdefghijkl',
      repeat: 'abcdefghijkl',
    })

    expect(register).not.toHaveBeenCalled()
    expect(password()).toHaveAttribute('aria-invalid', 'true')
    expect(password()).toHaveFocus()
    const passwordField = password().closest('div.flex.w-full') as HTMLElement
    expect(passwordField.querySelector('.text-danger')).toBeNull()
    expect(ruleStates()).toEqual([
      'Met: 12+ characters',
      'Met: Lowercase letter',
      'Not met: Uppercase letter',
      'Not met: Digit',
    ])
  })

  it('shows the limit message for 129 code points that meet every rule', async () => {
    const { user } = renderRegister()

    await typeInto(user, password(), `Ab1${'c'.repeat(126)}`)
    await user.tab()

    expect(
      screen.getByText("Password can't be longer than 128 characters."),
    ).toBeInTheDocument()
    expect(ruleStates().every((state) => state?.startsWith('Met'))).toBe(true)
  })

  it('shows the invalid character message for a tab', async () => {
    const { user } = renderRegister()

    await typeInto(user, password(), 'Correct\thorse 7')
    await user.tab()

    expect(
      screen.getByText("Password can't contain tabs or line breaks."),
    ).toBeInTheDocument()
    expect(ruleStates().every((state) => state?.startsWith('Met'))).toBe(true)
  })

  it('sends nothing for an unpaired surrogate', async () => {
    const { user, register } = renderRegister()

    fireEvent.change(password(), { target: { value: 'Correct horse 7\uD83D' } })
    fireEvent.change(repeat(), { target: { value: 'Correct horse 7\uD83D' } })
    await typeInto(user, email(), 'ann@example.com')
    await user.click(submitButton())

    expect(register).not.toHaveBeenCalled()
    expect(
      screen.getByText("Password can't contain tabs or line breaks."),
    ).toBeInTheDocument()
  })

  it('shows every error on an empty submit', async () => {
    const { user, register } = renderRegister()

    await user.click(submitButton())

    expect(register).not.toHaveBeenCalled()
    expect(screen.getByText('Enter your email.')).toBeInTheDocument()
    expect(screen.getByText('Enter your password.')).toBeInTheDocument()
    expect(screen.getByText('Repeat your password.')).toBeInTheDocument()
    expect(email()).toHaveFocus()
  })

  it('sends the trimmed email with its case', async () => {
    const { user, register } = renderRegister()

    await fillAndSubmit(user, {
      email: '  Ann@Example.com ',
      password: VALID_PASSWORD,
      repeat: VALID_PASSWORD,
    })

    expect(register).toHaveBeenCalledWith({
      email: 'Ann@Example.com',
      password: VALID_PASSWORD,
    })
  })

  it('disables the fields while creating the account', async () => {
    const request = deferredResult()
    const { user } = renderRegister(vi.fn(() => request.promise))

    await fillAndSubmit(user)

    expect(email()).toBeDisabled()
    expect(password()).toBeDisabled()
    expect(repeat()).toBeDisabled()
    expect(submitButton()).toHaveTextContent('Creating account…')
    await act(async () => request.resolve({ ok: true }))
  })

  it('makes no second call for a second submit event while the first runs', async () => {
    const request = deferredResult()
    const register = vi.fn<Register>(() => request.promise)
    const { user } = renderRegister(register)

    await fillAndSubmit(user)
    const form = screen.getByRole('form', { name: 'Create your account' })
    await act(async () => {
      fireEvent.submit(form)
    })

    expect(register).toHaveBeenCalledOnce()
    await act(async () => request.resolve({ ok: true }))
  })

  it('shows a used email under the email field and clears it on edit', async () => {
    const { user } = renderRegister(
      failingWith({ ok: false, error: { kind: 'emailUsed' } }),
    )

    await fillAndSubmit(user)

    expect(
      screen.getByText('An account with this email already exists.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /instead/ })).toBeNull()
    expect(password()).toHaveValue(VALID_PASSWORD)
    expect(repeat()).toHaveValue(VALID_PASSWORD)

    await user.type(email(), 'x')

    expect(
      screen.queryByText('An account with this email already exists.'),
    ).toBeNull()
  })

  it('shows a server format error on the email', async () => {
    const { user } = renderRegister(
      serverFieldErrors([{ field: 'email', code: 'INVALID_FORMAT' }]),
    )

    await fillAndSubmit(user)

    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows an unknown server code on the email as a format error', async () => {
    const { user } = renderRegister(
      serverFieldErrors([{ field: 'email', code: 'SOMETHING_NEW' }]),
    )

    await fillAndSubmit(user)

    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('marks the password invalid without a text for a server weak password', async () => {
    const { user } = renderRegister(
      serverFieldErrors([{ field: 'password', code: 'PASSWORD_TOO_WEAK' }]),
    )

    await fillAndSubmit(user)

    expect(password()).toHaveAttribute('aria-invalid', 'true')
    const passwordField = password().closest('div.flex.w-full') as HTMLElement
    expect(passwordField.querySelector('.text-danger')).toBeNull()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it.each([
    [[{ field: 'refreshTokenTransport', code: 'INVALID_VALUE' }]],
    [
      [
        { field: 'email', code: 'INVALID_FORMAT' },
        { field: 'refreshTokenTransport', code: 'INVALID_VALUE' },
      ],
    ],
  ])('shows only the generic banner for %o', async (fields) => {
    const { user } = renderRegister(serverFieldErrors(fields))

    await fillAndSubmit(user)

    expect(screen.getByRole('alert')).toHaveTextContent(
      "Couldn't reach Cardigan. Check your connection and try again.",
    )
    expect(screen.queryByText('Enter a valid email address.')).toBeNull()
    expect(email()).not.toHaveAttribute('aria-invalid')
  })

  it('shows the rate limit banner in seconds', async () => {
    const { user } = renderRegister(
      failingWith({
        ok: false,
        error: { kind: 'rateLimited', retryAfterSeconds: 1 },
      }),
    )

    await fillAndSubmit(user)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Too many attempts. Try again in 1 second.',
    )
  })

  it('keeps every value on a network failure', async () => {
    const { user } = renderRegister(
      failingWith({ ok: false, error: { kind: 'other' } }),
    )

    await fillAndSubmit(user)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(email()).toHaveValue('ann@example.com')
    expect(password()).toHaveValue(VALID_PASSWORD)
    expect(repeat()).toHaveValue(VALID_PASSWORD)
  })

  it('tells the host on success', async () => {
    const { user, onRegistered } = renderRegister()

    await fillAndSubmit(user)

    expect(onRegistered).toHaveBeenCalledOnce()
  })

  it('works with the keyboard only: tab order and Enter submits', async () => {
    const { user, register } = renderRegister()

    await user.tab()
    expect(email()).toHaveFocus()
    await user.keyboard('ann@example.com')
    await user.tab()
    expect(password()).toHaveFocus()
    await user.keyboard(VALID_PASSWORD)
    await user.tab()
    expect(repeat()).toHaveFocus()
    await user.keyboard(`${VALID_PASSWORD}{Enter}`)
    expect(register).toHaveBeenCalledOnce()

    await user.tab()
    expect(submitButton()).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveFocus()
  })
})
