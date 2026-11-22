import { QueryClient, type DefaultOptions } from '@tanstack/react-query'

// 'always' so offline requests fail at once instead of being held and sent when the network returns.
const defaultOptions = {
  queries: {
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: false,
    networkMode: 'always',
  },
  mutations: {
    retry: false,
    networkMode: 'always',
  },
} satisfies DefaultOptions

/**
 * Creates the app's QueryClient. Data stays fresh until the user refreshes it, changes it or reloads
 * the page. Unused data is dropped after the library's default gcTime of 5 minutes.
 */
export function createQueryClient() {
  return new QueryClient({ defaultOptions })
}

/** The QueryClient the app uses. */
export const queryClient = createQueryClient()

/** A QueryClient with the app's defaults that never garbage-collects, so tests leave no timers. */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      ...defaultOptions,
      queries: { ...defaultOptions.queries, gcTime: Infinity },
    },
  })
}
