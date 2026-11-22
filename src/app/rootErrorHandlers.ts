import type { ErrorInfo } from 'react'
import type { RootOptions } from 'react-dom/client'

type RootErrorHandlers = Required<
  Pick<RootOptions, 'onCaughtError' | 'onUncaughtError'>
>

/**
 * Error handlers for `createRoot`. They log to the console in development only, because React's
 * defaults also log in production.
 */
export function createRootErrorHandlers(isDev: boolean): RootErrorHandlers {
  const log = (error: unknown, errorInfo: ErrorInfo) => {
    if (isDev) console.error(error, errorInfo.componentStack)
  }
  return { onCaughtError: log, onUncaughtError: log }
}
