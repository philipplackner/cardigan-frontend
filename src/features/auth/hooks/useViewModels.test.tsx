import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { AuthResult } from '../types'
import { FIELD_ERROR_KEYS, RULES_UNMET } from '../utils/fieldErrorText'
import { useLoginViewModel } from './useLoginViewModel'
import { useRegisterViewModel } from './useRegisterViewModel'

function deferred() {
  let resolve!: (result: AuthResult) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<AuthResult>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const LOGIN_VALUES = { email: '  Ann@Example.com ', password: ' pass word ' }
const REGISTER_VALUES = {
  email: 'ann@example.com',
  password: 'Correct horse 7',
  repeatPassword: 'Correct horse 7',
}

function renderLogin(
  logIn: () => Promise<AuthResult>,
  isSessionExpired = false,
) {
  const onLoggedIn = vi.fn()
  const hook = renderHook(() =>
    useLoginViewModel({ logIn: vi.fn(logIn), onLoggedIn, isSessionExpired }),
  )
  return { ...hook, onLoggedIn }
}

function renderRegister(register: () => Promise<AuthResult>) {
  const onRegistered = vi.fn()
  const registerFn = vi.fn(register)
  const hook = renderHook(() =>
    useRegisterViewModel({ register: registerFn, onRegistered }),
  )
  return { ...hook, onRegistered, registerFn }
}

describe('useLoginViewModel', () => {
  it('sends the normalized email with its case and the password without trimming', async () => {
    const logIn = vi.fn(() => Promise.resolve<AuthResult>({ ok: true }))
    const onLoggedIn = vi.fn()
    const { result } = renderHook(() =>
      useLoginViewModel({ logIn, onLoggedIn, isSessionExpired: false }),
    )

    await act(() => result.current.submit(LOGIN_VALUES))

    expect(logIn).toHaveBeenCalledWith({
      email: 'Ann@Example.com',
      password: ' pass word ',
    })
    expect(onLoggedIn).toHaveBeenCalledOnce()
    expect(result.current.state).toEqual({ isSubmitting: false, banner: null })
  })

  it('is submitting while the request runs and replaces the session expired banner', async () => {
    const request = deferred()
    const { result } = renderLogin(() => request.promise, true)
    expect(result.current.state.banner).toBe('sessionExpired')

    let submit!: Promise<unknown>
    act(() => {
      submit = result.current.submit(LOGIN_VALUES)
    })
    expect(result.current.state).toEqual({ isSubmitting: true, banner: null })

    await act(async () => {
      request.resolve({ ok: false, error: { kind: 'invalidCredentials' } })
      await submit
    })
    expect(result.current.state).toEqual({
      isSubmitting: false,
      banner: 'invalidCredentials',
    })
  })

  it('makes no second call for a second submit while the first is pending', async () => {
    const request = deferred()
    const logIn = vi.fn(() => request.promise)
    const { result } = renderHook(() =>
      useLoginViewModel({
        logIn,
        onLoggedIn: vi.fn(),
        isSessionExpired: false,
      }),
    )

    let first!: Promise<unknown>
    let second!: Promise<unknown>
    act(() => {
      first = result.current.submit(LOGIN_VALUES)
      second = result.current.submit(LOGIN_VALUES)
    })
    await act(async () => {
      request.resolve({ ok: true })
      await Promise.all([first, second])
    })

    expect(logIn).toHaveBeenCalledOnce()
  })

  it('allows a new request after the first one ended', async () => {
    const logIn = vi.fn(() =>
      Promise.resolve<AuthResult>({ ok: false, error: { kind: 'other' } }),
    )
    const { result } = renderHook(() =>
      useLoginViewModel({
        logIn,
        onLoggedIn: vi.fn(),
        isSessionExpired: false,
      }),
    )

    await act(() => result.current.submit(LOGIN_VALUES))
    await act(() => result.current.submit(LOGIN_VALUES))

    expect(logIn).toHaveBeenCalledTimes(2)
  })

  it('treats a thrown error as the generic failure', async () => {
    const { result } = renderLogin(() => Promise.reject(new Error('offline')))

    await act(() => result.current.submit(LOGIN_VALUES))

    expect(result.current.state.banner).toBe('other')
  })

  it('still calls onLoggedIn after the screen unmounted', async () => {
    const request = deferred()
    const { result, unmount, onLoggedIn } = renderLogin(() => request.promise)

    let submit!: Promise<unknown>
    act(() => {
      submit = result.current.submit(LOGIN_VALUES)
    })
    unmount()
    request.resolve({ ok: true })
    await submit

    expect(onLoggedIn).toHaveBeenCalledOnce()
  })

  it('ignores a failure after the screen unmounted', async () => {
    const request = deferred()
    const { result, unmount, onLoggedIn } = renderLogin(() => request.promise)

    let submit!: Promise<unknown>
    act(() => {
      submit = result.current.submit(LOGIN_VALUES)
    })
    unmount()
    request.resolve({ ok: false, error: { kind: 'other' } })

    await expect(submit).resolves.toEqual([])
    expect(onLoggedIn).not.toHaveBeenCalled()
  })

  it('clears the wrong credentials banner on edit', async () => {
    const { result } = renderLogin(() =>
      Promise.resolve({ ok: false, error: { kind: 'invalidCredentials' } }),
    )
    await act(() => result.current.submit(LOGIN_VALUES))

    act(() => result.current.edit())

    expect(result.current.state.banner).toBeNull()
  })
})

describe('useRegisterViewModel', () => {
  it('calls onRegistered on success', async () => {
    const { result, onRegistered, registerFn } = renderRegister(() =>
      Promise.resolve({ ok: true }),
    )

    await act(() => result.current.submit(REGISTER_VALUES))

    expect(registerFn).toHaveBeenCalledWith({
      email: 'ann@example.com',
      password: 'Correct horse 7',
    })
    expect(onRegistered).toHaveBeenCalledOnce()
  })

  it('makes no second call for a second submit while the first is pending', async () => {
    const request = deferred()
    const { result, registerFn } = renderRegister(() => request.promise)

    let first!: Promise<unknown>
    act(() => {
      first = result.current.submit(REGISTER_VALUES)
      void result.current.submit(REGISTER_VALUES)
    })
    await act(async () => {
      request.resolve({ ok: true })
      await first
    })

    expect(registerFn).toHaveBeenCalledOnce()
  })

  it('still calls onRegistered after the screen unmounted', async () => {
    const request = deferred()
    const { result, unmount, onRegistered } = renderRegister(
      () => request.promise,
    )

    let submit!: Promise<unknown>
    act(() => {
      submit = result.current.submit(REGISTER_VALUES)
    })
    unmount()
    request.resolve({ ok: true })
    await submit

    expect(onRegistered).toHaveBeenCalledOnce()
  })

  it('routes a used email to the email field without a banner', async () => {
    const { result } = renderRegister(() =>
      Promise.resolve({ ok: false, error: { kind: 'emailUsed' } }),
    )

    let fieldErrors: unknown
    await act(async () => {
      fieldErrors = await result.current.submit(REGISTER_VALUES)
    })

    expect(fieldErrors).toEqual([
      { field: 'email', message: FIELD_ERROR_KEYS.emailUsed },
    ])
    expect(result.current.state.banner).toBeNull()
  })

  it('routes known server field errors to their fields', async () => {
    const { result } = renderRegister(() =>
      Promise.resolve({
        ok: false,
        error: {
          kind: 'invalidFields',
          fields: [
            { field: 'email', code: 'INVALID_FORMAT' },
            { field: 'password', code: 'PASSWORD_TOO_WEAK' },
          ],
        },
      }),
    )

    let fieldErrors: unknown
    await act(async () => {
      fieldErrors = await result.current.submit(REGISTER_VALUES)
    })

    expect(fieldErrors).toEqual([
      { field: 'email', message: FIELD_ERROR_KEYS.emailInvalid },
      { field: 'password', message: RULES_UNMET },
    ])
    expect(result.current.state.banner).toBeNull()
  })

  it.each([
    [[{ field: 'refreshTokenTransport', code: 'INVALID_VALUE' }]],
    [
      [
        { field: 'email', code: 'INVALID_FORMAT' },
        { field: 'refreshTokenTransport', code: 'INVALID_VALUE' },
      ],
    ],
    [[]],
  ])(
    'shows only the generic banner for the field errors %o',
    async (fields) => {
      const { result } = renderRegister(() =>
        Promise.resolve({
          ok: false,
          error: { kind: 'invalidFields', fields },
        }),
      )

      let fieldErrors: unknown
      await act(async () => {
        fieldErrors = await result.current.submit(REGISTER_VALUES)
      })

      expect(fieldErrors).toEqual([])
      expect(result.current.state.banner).toBe('other')
    },
  )

  it('shows the rate limit banner with the wait time', async () => {
    const { result } = renderRegister(() =>
      Promise.resolve({
        ok: false,
        error: { kind: 'rateLimited', retryAfterSeconds: 1 },
      }),
    )

    await act(() => result.current.submit(REGISTER_VALUES))

    expect(result.current.state.banner).toEqual({
      kind: 'rateLimited',
      seconds: 1,
    })
  })
})
