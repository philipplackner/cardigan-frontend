import type { QueryClient } from '@tanstack/react-query'
import { createRouter, type RouterHistory } from '@tanstack/react-router'
import { BlankPage } from './BlankPage'
import { routeTree } from './routeTree.gen'

export type RouterContext = {
  queryClient: QueryClient
}

/** Router options shared by the app router and test routers built from other route trees. */
export const routerDefaults = {
  defaultPreload: 'intent',
  // TanStack Query decides freshness, so the router must not cache loader results itself.
  defaultPreloadStaleTime: 0,
  defaultPendingComponent: BlankPage,
  defaultErrorComponent: BlankPage,
} as const

/** Creates the app router. Tests pass a memory history and a fresh QueryClient. */
export function createAppRouter(
  queryClient: QueryClient,
  history?: RouterHistory,
) {
  return createRouter({
    routeTree,
    history,
    context: { queryClient },
    ...routerDefaults,
  })
}

declare module '@tanstack/react-router' {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- module augmentation only merges into an interface
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
