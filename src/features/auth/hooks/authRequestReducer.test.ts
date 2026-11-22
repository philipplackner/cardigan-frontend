import { describe, expect, it } from 'vitest'
import type { AuthFailure } from '../types'
import {
  authRequestReducer,
  initialAuthRequestState,
  type AuthBanner,
  type AuthRequestState,
} from './authRequestReducer'

function withBanner(banner: AuthBanner): AuthRequestState {
  return { isSubmitting: false, banner }
}

const submitting: AuthRequestState = { isSubmitting: true, banner: null }

describe('authRequestReducer', () => {
  it('starts with the session expired banner when the session expired', () => {
    expect(initialAuthRequestState(true)).toEqual(withBanner('sessionExpired'))
  })

  it('starts without a banner otherwise', () => {
    expect(initialAuthRequestState(false)).toEqual(withBanner(null))
  })

  it.each<AuthBanner>([
    'sessionExpired',
    'invalidCredentials',
    { kind: 'rateLimited', seconds: 12 },
    'other',
    null,
  ])('clears the banner %o on submit', (banner) => {
    expect(
      authRequestReducer(withBanner(banner), { type: 'submitted' }),
    ).toEqual(submitting)
  })

  it.each<[AuthFailure, AuthBanner]>([
    [{ kind: 'invalidCredentials' }, 'invalidCredentials'],
    [
      { kind: 'rateLimited', retryAfterSeconds: 61 },
      { kind: 'rateLimited', seconds: 61 },
    ],
    [{ kind: 'rateLimited', retryAfterSeconds: null }, 'other'],
    [{ kind: 'other' }, 'other'],
    [{ kind: 'emailUsed' }, null],
    [
      { kind: 'invalidFields', fields: [{ field: 'email', code: 'REQUIRED' }] },
      null,
    ],
  ])('maps the failure %o to the banner %o', (error, banner) => {
    expect(authRequestReducer(submitting, { type: 'failed', error })).toEqual(
      withBanner(banner),
    )
  })

  it('stops submitting on success without a banner', () => {
    expect(authRequestReducer(submitting, { type: 'succeeded' })).toEqual(
      withBanner(null),
    )
  })

  it('clears the wrong credentials banner on edit', () => {
    expect(
      authRequestReducer(withBanner('invalidCredentials'), { type: 'edited' }),
    ).toEqual(withBanner(null))
  })

  it.each<AuthBanner>([
    'sessionExpired',
    { kind: 'rateLimited', seconds: 12 },
    'other',
  ])('keeps the banner %o on edit', (banner) => {
    const state = withBanner(banner)
    expect(authRequestReducer(state, { type: 'edited' })).toBe(state)
  })
})
