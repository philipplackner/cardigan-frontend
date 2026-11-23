import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { AppBarSlotProvider, AppBarSlotTarget, ToastProvider } from '@/core/ui'
import { BoardsDataAccessProvider } from '../api/BoardsDataAccessProvider'
import { ClockProvider } from '../hooks/ClockProvider'
import { NewBoardDialogContext } from '../hooks/NewBoardDialogContext'
import type { BoardsDataAccess } from '../types'
import { sampleNow } from './sampleBoards'

type BoardsTestProvidersProps = {
  queryClient: QueryClient
  dataAccess: BoardsDataAccess
  /** Replaces the New board dialog. Leave it out when a `NewBoardDialogProvider` is inside. */
  openNewBoardDialog?: () => void
  now?: Date
  children: ReactNode
}

/**
 * The providers the app layer puts around the board list, for tests. The phone app bar renders into
 * an element with the test id `app-bar`.
 */
export function BoardsTestProviders({
  queryClient,
  dataAccess,
  openNewBoardDialog,
  now = sampleNow,
  children,
}: BoardsTestProvidersProps) {
  const content = openNewBoardDialog ? (
    <NewBoardDialogContext value={{ openNewBoardDialog }}>
      {children}
    </NewBoardDialogContext>
  ) : (
    children
  )
  return (
    <QueryClientProvider client={queryClient}>
      <BoardsDataAccessProvider dataAccess={dataAccess}>
        <ClockProvider clock={() => now}>
          <ToastProvider closeLabel="Close">
            <AppBarSlotProvider>
              <div data-testid="app-bar">
                <AppBarSlotTarget />
              </div>
              <main>{content}</main>
            </AppBarSlotProvider>
          </ToastProvider>
        </ClockProvider>
      </BoardsDataAccessProvider>
    </QueryClientProvider>
  )
}
