/** A field error from a 400 `VALIDATION_FAILED` response. */
export type FieldFailure = {
  field: string
  code: string
  min?: number
  max?: number
}

export type AuthFailure =
  /** 401 `INVALID_CREDENTIALS` on log in */
  | { kind: 'invalidCredentials' }
  /** 409 with the field error email/ALREADY_USED on register */
  | { kind: 'emailUsed' }
  /** 429 `RATE_LIMITED`. `null` when `Retry-After` is missing or not a positive whole number. */
  | { kind: 'rateLimited'; retryAfterSeconds: number | null }
  /** 400 `VALIDATION_FAILED` */
  | { kind: 'invalidFields'; fields: FieldFailure[] }
  /** Network failure, 5xx, a response that isn't problem details, and unknown codes */
  | { kind: 'other' }

export type AuthResult = { ok: true } | { ok: false; error: AuthFailure }

/** Logs in with the normalized email and password. Provided by the app layer. */
export type LogIn = (input: {
  email: string
  password: string
}) => Promise<AuthResult>

/** Creates an account and logs in with it. Provided by the app layer. */
export type Register = (input: {
  email: string
  password: string
}) => Promise<AuthResult>
