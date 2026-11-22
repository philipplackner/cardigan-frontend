import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRootErrorHandlers } from './rootErrorHandlers'

const error = new Error('Route failed')
const errorInfo = { componentStack: '\n    at Page' }

describe('createRootErrorHandlers', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each(['onCaughtError', 'onUncaughtError'] as const)(
    '%s logs the error in development',
    (handler) => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      createRootErrorHandlers(true)[handler](error, errorInfo)

      expect(consoleError).toHaveBeenCalledExactlyOnceWith(
        error,
        errorInfo.componentStack,
      )
    },
  )

  it.each(['onCaughtError', 'onUncaughtError'] as const)(
    '%s stays silent outside development',
    (handler) => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      createRootErrorHandlers(false)[handler](error, errorInfo)

      expect(consoleError).not.toHaveBeenCalled()
    },
  )
})
