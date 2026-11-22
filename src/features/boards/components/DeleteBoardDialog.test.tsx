import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient } from '@/core/api/queryClient'
import type { BoardDialogResult } from '../hooks/boardDialogResult'
import { BoardsTestProviders } from '../testing/BoardsTestProviders'
import {
  createInMemoryBoardsDataAccess,
  type InMemoryBoardsDataAccess,
} from '../testing/createInMemoryBoardsDataAccess'
import { installIntersectionObserverStub } from '../testing/intersectionObserverStub'
import { sampleBoards } from '../testing/sampleBoards'
import type { BoardSummary } from '../types'
import { BoardListRoot } from './BoardListScreen'
import { DeleteBoardDialog } from './DeleteBoardDialog'

let observer: ReturnType<typeof installIntersectionObserverStub>
beforeEach(() => {
  observer = installIntersectionObserverStub()
})
afterEach(() => observer.restore())

const cardigan = sampleBoards[0]!

function renderOnItsOwn(
  board: BoardSummary = cardigan,
  dataAccess: InMemoryBoardsDataAccess = createInMemoryBoardsDataAccess([
    { ...cardigan, ...board, createdAt: cardigan.createdAt },
  ]),
) {
  const onClose = vi.fn<(result: BoardDialogResult) => void>()
  render(
    <BoardsTestProviders
      queryClient={createTestQueryClient()}
      dataAccess={dataAccess}
    >
      <DeleteBoardDialog board={board} onClose={onClose} />
    </BoardsTestProviders>,
  )
  const dialog = () =>
    screen.getByRole('dialog', { name: `Delete board “${board.name}”?` })
  const deleteButton = () =>
    within(dialog()).getByRole('button', { name: 'Delete board' })
  return { user: userEvent.setup(), onClose, dataAccess, dialog, deleteButton }
}

describe('DeleteBoardDialog', () => {
  it('names the board and its cards', () => {
    const { dialog } = renderOnItsOwn()

    expect(dialog()).toHaveTextContent(
      'Its 12 cards will be deleted too. This can’t be undone.',
    )
  })

  it('reads "1 card" for one card', () => {
    const { dialog } = renderOnItsOwn({ ...cardigan, cardCount: 1 })

    expect(dialog()).toHaveTextContent(
      'Its 1 card will be deleted too. This can’t be undone.',
    )
  })

  it('only warns that it can’t be undone for a board without cards', () => {
    const { dialog } = renderOnItsOwn({ ...cardigan, cardCount: 0 })

    expect(
      within(dialog()).getByText('This can’t be undone.'),
    ).toBeInTheDocument()
    expect(dialog()).not.toHaveTextContent('Its ')
  })

  it('uses the destructive button style', () => {
    const { deleteButton } = renderOnItsOwn()

    expect(deleteButton()).toHaveClass('bg-danger')
  })

  it('reports deleted without a toast', async () => {
    const { user, onClose, deleteButton } = renderOnItsOwn()

    await user.click(deleteButton())

    await vi.waitFor(() =>
      expect(onClose).toHaveBeenCalledWith({ kind: 'deleted' }),
    )
    expect(screen.queryByText(/Couldn’t/)).toBeNull()
  })

  it('reports deleted without a toast when the board is already gone', async () => {
    const { user, onClose, deleteButton, dataAccess } = renderOnItsOwn()
    dataAccess.failNext('deleteBoard', { kind: 'notFound' })

    await user.click(deleteButton())

    await vi.waitFor(() =>
      expect(onClose).toHaveBeenCalledWith({ kind: 'deleted' }),
    )
    expect(screen.queryByText(/Couldn’t/)).toBeNull()
  })

  it('reports unchanged for Cancel', async () => {
    const { user, onClose, dialog } = renderOnItsOwn()

    await user.click(within(dialog()).getByRole('button', { name: 'Cancel' }))

    expect(onClose).toHaveBeenCalledWith({ kind: 'unchanged' })
  })

  it('stays open with the exact board name in the toast when deleting fails', async () => {
    const board = { ...cardigan, name: 'R&D <x>' }
    const { user, onClose, deleteButton, dataAccess, dialog } =
      renderOnItsOwn(board)
    dataAccess.failNext('deleteBoard', { kind: 'other' })

    await user.click(deleteButton())

    expect(
      await screen.findByText(
        'Couldn’t delete “R&D <x>”. Check your connection and try again.',
      ),
    ).toBeInTheDocument()
    expect(dialog()).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('disables Cancel and ignores Escape while deleting', async () => {
    const { user, dataAccess, deleteButton, dialog } = renderOnItsOwn()
    const release = dataAccess.holdNext('deleteBoard')

    await user.click(deleteButton())

    expect(deleteButton()).toHaveAttribute('aria-busy', 'true')
    expect(
      within(dialog()).getByRole('button', { name: 'Cancel' }),
    ).toBeDisabled()
    await user.keyboard('{Escape}')
    expect(dialog()).toBeInTheDocument()
    await act(async () => release())
  })

  it.each([
    ['succeeds', false],
    ['fails with 404', true],
  ])(
    'removes the board from the list when the delete %s',
    async (_, isDeletedElsewhere) => {
      const dataAccess = createInMemoryBoardsDataAccess(
        sampleBoards.slice(0, 6),
      )
      const user = userEvent.setup()
      render(
        <BoardsTestProviders
          queryClient={createTestQueryClient()}
          dataAccess={dataAccess}
          openNewBoardDialog={vi.fn()}
        >
          <BoardListRoot
            renderBoardLink={() => <button type="button" />}
            onOpenLabels={vi.fn()}
            importAction={{ open: vi.fn(), dialogs: null }}
            account={{ email: null, onLogOut: vi.fn() }}
          />
        </BoardsTestProviders>,
      )
      const wide = within(screen.getByTestId('board-list-wide'))
      await user.click(
        await wide.findByRole('button', {
          name: 'Actions for board “Cardigan v1”',
        }),
      )
      await user.click(screen.getByRole('menuitem', { name: 'Delete board' }))
      if (isDeletedElsewhere)
        await act(() => dataAccess.deleteBoard(cardigan.id))

      await user.click(screen.getByRole('button', { name: 'Delete board' }))

      await vi.waitFor(() => expect(wide.queryByText('Cardigan v1')).toBeNull())
      expect(screen.queryByText(/Couldn’t/)).toBeNull()
    },
  )
})
