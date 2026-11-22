import { normalizeText } from '@/core/utils/text'
import type { Register } from '../types'
import type { RegisterFormValues } from '../utils/registerForm'
import { useAuthRequest } from './useAuthRequest'

export type RegisterViewModelParams = {
  register: Register
  /** Register logs the user in, so the host treats this like a log in. */
  onRegistered: () => void
}

export function useRegisterViewModel({
  register,
  onRegistered,
}: RegisterViewModelParams) {
  const { state, run, edit } = useAuthRequest({ onSucceeded: onRegistered })

  const submit = (values: RegisterFormValues) =>
    run(() =>
      register({
        email: normalizeText(values.email, 'singleLine'),
        password: normalizeText(values.password, 'password'),
      }),
    )

  return { state, submit, edit }
}
