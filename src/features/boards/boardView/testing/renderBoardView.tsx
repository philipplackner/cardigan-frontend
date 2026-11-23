import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { createTestQueryClient } from '@/core/api/queryClient'
import {
  createInMemoryBoardsDataAccess,
  type InMemoryBoardsDataAccess,
} from '../../testing/createInMemoryBoardsDataAccess'
import { BoardViewRoot } from '../components/BoardViewRoot'
import { BoardViewTestProviders } from './BoardViewTestProviders'
import {
  createInMemoryBoardViewDataAccess,
  type InMemoryBoardViewDataAccess,
} from './createInMemoryBoardViewDataAccess'
import { CARDIGAN_BOARD_ID } from './sampleBoardContent'

type Options = {
  boardId?: string
  /** Prepare the fakes before the first render, for example to hold or fail the first load. */
  prepare?: (fakes: {
    boards: InMemoryBoardsDataAccess
    boardView: InMemoryBoardViewDataAccess
  }) => void
  /** Load the board list first, so the header knows the board's name while it loads. */
  withBoardList?: boolean
}

/** Renders `BoardViewRoot` with both in-memory data accesses over one store and spy callbacks. */
export async function renderBoardView({
  boardId = CARDIGAN_BOARD_ID,
  prepare,
  withBoardList = false,
}: Options = {}) {
  const boards = createInMemoryBoardsDataAccess()
  const boardView = createInMemoryBoardViewDataAccess(boards)
  const queryClient = createTestQueryClient()
  if (withBoardList) {
    queryClient.setQueryData(['boards'], await boards.listBoards())
  }
  prepare?.({ boards, boardView })
  const callbacks = {
    onOpenCard: vi.fn(),
    onExport: vi.fn(),
    onBack: vi.fn(),
    onBoardGone: vi.fn(),
    onNotFound: vi.fn(),
  }
  const user = userEvent.setup()
  const ui = (id: string) => (
    <BoardViewTestProviders
      queryClient={queryClient}
      boards={boards}
      boardView={boardView}
    >
      <BoardViewRoot boardId={id} {...callbacks} />
    </BoardViewTestProviders>
  )
  const result = render(ui(boardId))
  const content = () => within(screen.getByTestId('board-content'))
  const appBar = () => within(screen.getByTestId('app-bar'))
  const column = (name: string) =>
    within(content().getByRole('region', { name }))
  return {
    user,
    queryClient,
    boards,
    boardView,
    ...callbacks,
    content,
    appBar,
    column,
    refreshButton: () => screen.getByRole('button', { name: 'Refresh' }),
    rerenderWith: (id: string) => result.rerender(ui(id)),
    /** Waits until the board's columns show. */
    loaded: () => content().findByRole('region', { name: 'To do' }),
    act,
  }
}
