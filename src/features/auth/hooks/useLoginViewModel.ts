import { normalizeText } from '@/core/utils/text'
import type { LogIn } from '../types'
import type { LoginFormValues } from '../utils/loginForm'
import { useAuthRequest } from './useAuthRequest'

export type LoginViewModelParams = {
  logIn: LogIn
  onLoggedIn: () => void
  /** Shows the session expired banner until the next submit that sends a request. */
  isSessionExpired: boolean
}

export function useLoginViewModel({
  logIn,
  onLoggedIn,
  isSessionExpired,
}: LoginViewModelParams) {
  const { state, run, edit } = useAuthRequest({
    isSessionExpired,
    onSucceeded: onLoggedIn,
  })

  const submit = (values: LoginFormValues) =>
    run(() =>
      logIn({
        email: normalizeText(values.email, 'singleLine'),
        password: normalizeText(values.password, 'password'),
      }),
    )

  return { state, submit, edit }
}
