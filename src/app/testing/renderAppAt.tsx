import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
  type AnyRoute,
  type AnyRouter,
} from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { createTestQueryClient } from '@/core/api/queryClient'
import { ToastProvider } from '@/core/ui'
import { createAppRouter, routerDefaults } from '../router'

function renderRouter(router: AnyRouter, queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider closeLabel="Close">
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  )
}

/** Renders the whole app router at [path] with a memory history and a fresh QueryClient. */
export function renderAppAt(path: string) {
  const queryClient = createTestQueryClient()
  const router = createAppRouter(
    queryClient,
    createMemoryHistory({ initialEntries: [path] }),
  )
  return { router, queryClient, ...renderRouter(router, queryClient) }
}

/**
 * Like [renderAppAt], but with a test-only [routeTree], for routes that must not exist in the app,
 * such as one that throws.
 */
export function renderRouteTreeAt(routeTree: AnyRoute, path: string) {
  const queryClient = createTestQueryClient()
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    context: { queryClient },
    ...routerDefaults,
  })
  return { router, queryClient, ...renderRouter(router, queryClient) }
}
