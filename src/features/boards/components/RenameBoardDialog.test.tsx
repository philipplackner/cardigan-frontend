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
import { BoardListRoot } from './BoardListScreen'
import { RenameBoardDialog } from './RenameBoardDialog'

let observer: ReturnType<typeof installIntersectionObserverStub>
beforeEach(() => {
  observer = installIntersectionObserverStub()
})
afterEach(() => observer.restore())

const cardigan = sampleBoards[0]!
const sixBoards = sampleBoards.slice(0, 6)

const dialog = () => screen.getByRole('dialog', { name: 'Rename board' })
const nameField = () => within(dialog()).getByRole('textbox', { name: 'Name' })
const saveButton = () => within(dialog()).getByRole('button', { name: 'Save' })

function renderOnItsOwn(
  dataAccess: InMemoryBoardsDataAccess = createInMemoryBoardsDataAccess(
    sixBoards,
  ),
) {
  const onClose = vi.fn<(result: BoardDialogResult) => void>()
  const renameBoard = vi.spyOn(dataAccess, 'renameBoard')
  render(
    <BoardsTestProviders
      queryClient={createTestQueryClient()}
      dataAccess={dataAccess}
    >
      <RenameBoardDialog board={cardigan} onClose={onClose} />
    </BoardsTestProviders>,
  )
  return { user: userEvent.setup(), onClose, renameBoard, dataAccess }
}

async function renderInList(
  dataAccess: InMemoryBoardsDataAccess = createInMemoryBoardsDataAccess(
    sixBoards,
  ),
) {
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
  const wide = () => within(screen.getByTestId('board-list-wide'))
  await user.click(
    await wide().findByRole('button', {
      name: 'Actions for board “Cardigan v1”',
    }),
  )
  await user.click(screen.getByRole('menuitem', { name: 'Rename' }))
  return { user, wide, dataAccess }
}

async function rename(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.clear(nameField())
  await user.type(nameField(), name)
  await user.click(saveButton())
}

describe('RenameBoardDialog', () => {
  it('shows the name focused and the key read-only with its hint', async () => {
    renderOnItsOwn()

    expect(nameField()).toHaveValue('Cardigan v1')
    await vi.waitFor(() => expect(nameField()).toHaveFocus())
    const key = within(dialog()).getByRole('textbox', { name: 'Key' })
    expect(key).toHaveValue('CRD')
    expect(key).toBeDisabled()
    expect(dialog()).toHaveTextContent('The key can’t be changed.')
  })

  it('closes without a request when the normalized name is unchanged', async () => {
    const { user, onClose, renameBoard } = renderOnItsOwn()

    await user.type(nameField(), ' ')
    await user.click(saveButton())

    expect(onClose).toHaveBeenCalledWith({ kind: 'unchanged' })
    expect(renameBoard).not.toHaveBeenCalled()
    expect(nameField()).not.toHaveAttribute('aria-invalid')
  })

  it('reports unchanged for Cancel', async () => {
    const { user, onClose } = renderOnItsOwn()

    await user.click(within(dialog()).getByRole('button', { name: 'Cancel' }))

    expect(onClose).toHaveBeenCalledWith({ kind: 'unchanged' })
  })

  it('reports renamed with the new board', async () => {
    const { user, onClose } = renderOnItsOwn()

    await rename(user, 'Cardigan v2')

    await vi.waitFor(() =>
      expect(onClose).toHaveBeenCalledWith({
        kind: 'renamed',
        board: expect.objectContaining({
          id: cardigan.id,
          name: 'Cardigan v2',
          key: 'CRD',
          cardCount: 12,
        }),
      }),
    )
    expect(nameField()).not.toHaveAttribute('aria-invalid')
  })

  it('reports deleted and shows a toast when the board no longer exists', async () => {
    const { user, onClose, dataAccess } = renderOnItsOwn()
    dataAccess.failNext('renameBoard', { kind: 'notFound' })

    await rename(user, 'Cardigan v2')

    await vi.waitFor(() =>
      expect(onClose).toHaveBeenCalledWith({ kind: 'deleted' }),
    )
    expect(
      screen.getByText('“Cardigan v1” no longer exists.'),
    ).toBeInTheDocument()
    expect(nameField()).not.toHaveAttribute('aria-invalid')
  })

  it('stays open without a toast when the session ended', async () => {
    const { user, dataAccess, onClose, renameBoard } = renderOnItsOwn()
    dataAccess.failNext('renameBoard', { kind: 'sessionEnded' })

    await rename(user, 'Cardigan v2')

    await vi.waitFor(() => expect(renameBoard).toHaveBeenCalled())
    await vi.waitFor(() => expect(nameField()).toBeEnabled())
    expect(screen.queryByText(/Couldn’t save the board/)).toBeNull()
    expect(nameField()).not.toHaveAttribute('aria-invalid')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('shows a toast, not a name error, for a field error on another field', async () => {
    const { user, dataAccess } = renderOnItsOwn()
    dataAccess.failNext('renameBoard', {
      kind: 'invalid',
      fields: [{ field: 'key', code: 'ALREADY_USED' }],
    })

    await rename(user, 'Cardigan v2')

    expect(
      await screen.findByText(
        'Couldn’t save the board. Check your connection and try again.',
      ),
    ).toBeInTheDocument()
    expect(nameField()).not.toHaveAttribute('aria-invalid')
  })

  it('checks the name live after the first submit', async () => {
    const { user } = renderOnItsOwn()

    await user.clear(nameField())
    await user.click(saveButton())
    expect(dialog()).toHaveTextContent('Enter a name.')
    await user.type(nameField(), 'C')

    expect(dialog()).not.toHaveTextContent('Enter a name.')
    expect(saveButton()).toBeEnabled()
  })

  it('checks the name like New board', async () => {
    const { user, renameBoard } = renderOnItsOwn()

    await user.clear(nameField())
    await user.click(saveButton())

    expect(dialog()).toHaveTextContent('Enter a name.')
    expect(saveButton()).toBeDisabled()
    expect(renameBoard).not.toHaveBeenCalled()
  })

  it('shows a server name error under Name and stays open', async () => {
    const { user, dataAccess, onClose } = renderOnItsOwn()
    dataAccess.failNext('renameBoard', {
      kind: 'invalid',
      fields: [{ field: 'name', code: 'TOO_LONG', max: 100 }],
    })

    await rename(user, 'Cardigan v2')

    expect(
      await within(dialog()).findByText('Use at most 100 characters.'),
    ).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('shows the invalid-character message for an unknown name code', async () => {
    const { user, dataAccess } = renderOnItsOwn()
    dataAccess.failNext('renameBoard', {
      kind: 'invalid',
      fields: [{ field: 'name', code: 'NEW_CODE' }],
    })

    await rename(user, 'Cardigan v2')

    expect(
      await within(dialog()).findByText(
        'Use a single line without control characters.',
      ),
    ).toBeInTheDocument()
  })

  it('stays open with a toast when saving fails', async () => {
    const { user, dataAccess, onClose } = renderOnItsOwn()
    dataAccess.failNext('renameBoard', { kind: 'other' })

    await rename(user, 'Cardigan v2')

    expect(
      await screen.findByText(
        'Couldn’t save the board. Check your connection and try again.',
      ),
    ).toBeInTheDocument()
    expect(nameField()).toHaveValue('Cardigan v2')
    expect(nameField()).not.toHaveAttribute('aria-invalid')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('disables the field and Cancel and ignores Escape while saving', async () => {
    const { user, dataAccess, onClose } = renderOnItsOwn()
    const release = dataAccess.holdNext('renameBoard')

    await rename(user, 'Cardigan v2')

    expect(saveButton()).toHaveAttribute('aria-busy', 'true')
    expect(nameField()).toBeDisabled()
    expect(
      within(dialog()).getByRole('button', { name: 'Cancel' }),
    ).toBeDisabled()
    await user.keyboard('{Escape}')
    expect(dialog()).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    await act(async () => release())
  })

  describe('in the board list', () => {
    it('starts with the other board’s name when it opens for another board', async () => {
      const { user, wide } = await renderInList()
      await user.click(within(dialog()).getByRole('button', { name: 'Cancel' }))
      await vi.waitFor(() =>
        expect(
          screen.queryByRole('dialog', { name: 'Rename board' }),
        ).toBeNull(),
      )

      await user.click(
        wide().getByRole('button', { name: 'Actions for board “Raytracer”' }),
      )
      await user.click(screen.getByRole('menuitem', { name: 'Rename' }))

      expect(nameField()).toHaveValue('Raytracer')
    })

    it('shows the new name and keeps the card count from the list', async () => {
      const dataAccess = createInMemoryBoardsDataAccess(sixBoards)
      const renameBoard = dataAccess.renameBoard
      dataAccess.renameBoard = async (id, name) => ({
        ...(await renameBoard(id, name)),
        cardCount: 0,
      })
      const { user, wide } = await renderInList(dataAccess)
      dataAccess.holdNext('listBoards')

      await rename(user, 'Cardigan v2')

      await vi.waitFor(() =>
        expect(
          screen.queryByRole('dialog', { name: 'Rename board' }),
        ).toBeNull(),
      )
      const tile = wide()
        .getByRole('button', { name: 'Cardigan v2' })
        .closest('article')!
      expect(tile).toHaveTextContent('12 cards')
    })

    it('removes the board and shows a toast after a 404', async () => {
      const dataAccess = createInMemoryBoardsDataAccess(sixBoards)
      const { user, wide } = await renderInList(dataAccess)
      await act(() => dataAccess.deleteBoard(cardigan.id))

      await rename(user, 'Cardigan v2')

      await vi.waitFor(() =>
        expect(wide().queryByText('Cardigan v1')).toBeNull(),
      )
      expect(
        screen.getByText('“Cardigan v1” no longer exists.'),
      ).toBeInTheDocument()
      await vi.waitFor(() =>
        expect(document.activeElement).toHaveAccessibleName(
          'Actions for board “Raytracer”',
        ),
      )
    })
  })
})
