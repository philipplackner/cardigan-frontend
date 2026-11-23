import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient } from '@/core/api/queryClient'
import { BoardListRoot } from '../../components/BoardListScreen'
import { ClockProvider } from '../../hooks/ClockProvider'
import { NewBoardDialogContext } from '../../hooks/NewBoardDialogContext'
import { createInMemoryBoardsDataAccess } from '../../testing/createInMemoryBoardsDataAccess'
import { installIntersectionObserverStub } from '../../testing/intersectionObserverStub'
import { sampleNow } from '../../testing/sampleBoards'
import { BoardViewTestProviders } from '../testing/BoardViewTestProviders'
import { createInMemoryBoardViewDataAccess } from '../testing/createInMemoryBoardViewDataAccess'
import { installResizeObserverStub } from '../testing/domStubs'
import { CARDIGAN_BOARD_ID } from '../testing/sampleBoardContent'
import { BoardViewRoot } from './BoardViewRoot'

let observer: ReturnType<typeof installIntersectionObserverStub>
beforeEach(() => {
  observer = installIntersectionObserverStub()
  installResizeObserverStub()
})
afterEach(() => observer.restore())

describe('board view and board list', () => {
  it('raises the board list tile’s card count after a quick add', async () => {
    const boards = createInMemoryBoardsDataAccess()
    const boardView = createInMemoryBoardViewDataAccess(boards)
    const user = userEvent.setup()
    render(
      <BoardViewTestProviders
        queryClient={createTestQueryClient()}
        boards={boards}
        boardView={boardView}
      >
        <ClockProvider clock={() => sampleNow}>
          <NewBoardDialogContext value={{ openNewBoardDialog: vi.fn() }}>
            <div data-testid="board-list">
              <BoardListRoot
                renderBoardLink={() => <button type="button" />}
                onOpenLabels={vi.fn()}
                importAction={{ open: vi.fn(), dialogs: null }}
                account={{ email: null, onLogOut: vi.fn() }}
              />
            </div>
            <BoardViewRoot
              boardId={CARDIGAN_BOARD_ID}
              onOpenCard={vi.fn()}
              onExport={vi.fn()}
              onBack={vi.fn()}
              onBoardGone={vi.fn()}
              onNotFound={vi.fn()}
            />
          </NewBoardDialogContext>
        </ClockProvider>
      </BoardViewTestProviders>,
    )
    const tile = async () =>
      within(
        (
          await within(screen.getByTestId('board-list-wide')).findByText(
            'Cardigan v1',
          )
        ).closest('li')!,
      )
    expect((await tile()).getByText('12 cards')).toBeInTheDocument()

    await user.click(
      await screen.findByRole('button', { name: 'Add card to “Review”' }),
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Card title' }),
      'Write docs{Enter}',
    )

    await waitFor(async () =>
      expect((await tile()).getByText('13 cards')).toBeInTheDocument(),
    )
  })
})
