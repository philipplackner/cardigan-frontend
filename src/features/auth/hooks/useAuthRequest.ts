import { useReducer, useRef } from 'react'
import type { AuthResult } from '../types'
import {
  FIELD_ERROR_KEYS,
  serverFieldError,
  type ServerFieldError,
} from '../utils/fieldErrorText'
import {
  authRequestReducer,
  initialAuthRequestState,
} from './authRequestReducer'

type AuthRequestParams = {
  isSessionExpired?: boolean
  onSucceeded: () => void
}

/**
 * Runs one log in or register request at a time and keeps the banner. Resolves with the field
 * errors the form shows. A success still calls `onSucceeded` after the screen is gone, so the host
 * never misses a session.
 */
export function useAuthRequest({
  isSessionExpired = false,
  onSucceeded,
}: AuthRequestParams) {
  const [state, dispatch] = useReducer(
    authRequestReducer,
    isSessionExpired,
    initialAuthRequestState,
  )
  // State updates are asynchronous, so a second submit event in the same tick would still see false.
  const isPending = useRef(false)

  const run = async (
    request: () => Promise<AuthResult>,
  ): Promise<ServerFieldError[]> => {
    if (isPending.current) return []
    isPending.current = true
    dispatch({ type: 'submitted' })

    let result: AuthResult
    try {
      result = await request()
    } catch {
      result = { ok: false, error: { kind: 'other' } }
    } finally {
      isPending.current = false
    }

    if (result.ok) {
      dispatch({ type: 'succeeded' })
      onSucceeded()
      return []
    }

    const { error } = result
    if (error.kind === 'emailUsed') {
      dispatch({ type: 'failed', error })
      return [{ field: 'email', message: FIELD_ERROR_KEYS.emailUsed }]
    }
    if (error.kind === 'invalidFields') {
      const fieldErrors = error.fields.map(serverFieldError)
      if (fieldErrors.length === 0 || fieldErrors.includes(null)) {
        dispatch({ type: 'failed', error: { kind: 'other' } })
        return []
      }
      dispatch({ type: 'failed', error })
      return fieldErrors.filter((fieldError) => fieldError !== null)
    }
    dispatch({ type: 'failed', error })
    return []
  }

  const edit = () => dispatch({ type: 'edited' })

  return { state, run, edit }
}
