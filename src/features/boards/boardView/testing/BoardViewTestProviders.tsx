import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { AppBarSlotProvider, AppBarSlotTarget, ToastProvider } from '@/core/ui'
import { BoardsDataAccessProvider } from '../../api/BoardsDataAccessProvider'
import type { InMemoryBoardsDataAccess } from '../../testing/createInMemoryBoardsDataAccess'
import { BoardViewDataAccessProvider } from '../api/BoardViewDataAccessProvider'
import type { InMemoryBoardViewDataAccess } from './createInMemoryBoardViewDataAccess'

type BoardViewTestProvidersProps = {
  queryClient: QueryClient
  boards: InMemoryBoardsDataAccess
  boardView: InMemoryBoardViewDataAccess
  children: ReactNode
}

/**
 * The providers the app layer puts around the board view, for tests. Both data accesses share one
 * store. The phone app bar renders into an element with the test id `app-bar`.
 */
export function BoardViewTestProviders({
  queryClient,
  boards,
  boardView,
  children,
}: BoardViewTestProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <BoardsDataAccessProvider dataAccess={boards}>
        <BoardViewDataAccessProvider dataAccess={boardView}>
          <ToastProvider closeLabel="Close">
            <AppBarSlotProvider>
              <div data-testid="app-bar">
                <AppBarSlotTarget />
              </div>
              <main>{children}</main>
            </AppBarSlotProvider>
          </ToastProvider>
        </BoardViewDataAccessProvider>
      </BoardsDataAccessProvider>
    </QueryClientProvider>
  )
}
