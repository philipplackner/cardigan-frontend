import type { AuthFailure } from '../types'

/** The one banner above the fields. Only one shows at a time. */
export type AuthBanner =
  | 'sessionExpired'
  | 'invalidCredentials'
  | { kind: 'rateLimited'; seconds: number }
  | 'other'
  | null

export type AuthRequestState = {
  isSubmitting: boolean
  banner: AuthBanner
}

export type AuthRequestAction =
  | { type: 'submitted' }
  | { type: 'failed'; error: AuthFailure }
  | { type: 'succeeded' }
  | { type: 'edited' }

export function initialAuthRequestState(
  isSessionExpired: boolean,
): AuthRequestState {
  return {
    isSubmitting: false,
    banner: isSessionExpired ? 'sessionExpired' : null,
  }
}

function bannerFor(error: AuthFailure): AuthBanner {
  switch (error.kind) {
    case 'invalidCredentials':
      return 'invalidCredentials'
    case 'rateLimited':
      return error.retryAfterSeconds === null
        ? 'other'
        : { kind: 'rateLimited', seconds: error.retryAfterSeconds }
    case 'other':
      return 'other'
    case 'emailUsed':
    case 'invalidFields':
      return null
  }
}

export function authRequestReducer(
  state: AuthRequestState,
  action: AuthRequestAction,
): AuthRequestState {
  switch (action.type) {
    case 'submitted':
      return { isSubmitting: true, banner: null }
    case 'failed':
      return { isSubmitting: false, banner: bannerFor(action.error) }
    case 'succeeded':
      return { ...state, isSubmitting: false }
    case 'edited':
      return state.banner === 'invalidCredentials'
        ? { ...state, banner: null }
        : state
  }
}
