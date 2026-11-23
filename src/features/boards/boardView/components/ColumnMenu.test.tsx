import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderBoardView } from '../testing/renderBoardView'
import { CARDIGAN_BOARD_ID } from '../testing/sampleBoardContent'
import type { BoardColumn } from '../types'

async function setup(options?: Parameters<typeof renderBoardView>[0]) {
  const view = await renderBoardView(options)
  await view.content().findAllByRole('region')
  const menuButton = (column: string) =>
    view.content().getByRole('button', {
      name: `Actions for column “${column}”`,
    })
  const openMenu = async (column: string) => {
    await view.user.click(menuButton(column))
    return within(await screen.findByRole('menu'))
  }
  const item = (menu: ReturnType<typeof within>, name: string) =>
    menu.getByRole('menuitem', { name })
  const columnNames = () =>
    view
      .content()
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent)
  const dialog = () => within(screen.getByRole('dialog'))
  return { ...view, menuButton, openMenu, item, columnNames, dialog }
}

const keep =
  (...names: string[]) =>
  (columns: BoardColumn[]) =>
    names.map((name) => columns.find((column) => column.name === name)!)

describe('column menu', () => {
  describe('move', () => {
    it('disables Move left on the first column', async () => {
      const { openMenu, item } = await setup()
      const menu = await openMenu('To do')

      expect(item(menu, 'Move left')).toHaveAttribute('aria-disabled', 'true')
      expect(item(menu, 'Move right')).not.toHaveAttribute('aria-disabled')
      expect(item(menu, 'Rename')).not.toHaveAttribute('aria-disabled')
      expect(item(menu, 'Delete column')).not.toHaveAttribute('aria-disabled')
    })

    it('disables Move right on the last column', async () => {
      const { openMenu, item } = await setup()
      const menu = await openMenu('Done')

      expect(item(menu, 'Move right')).toHaveAttribute('aria-disabled', 'true')
      expect(item(menu, 'Move left')).not.toHaveAttribute('aria-disabled')
    })

    it('disables both moves on the only column', async () => {
      const { openMenu, item } = await setup({
        prepare: ({ boardView }) =>
          boardView.changeBoard(CARDIGAN_BOARD_ID, keep('Review')),
      })
      const menu = await openMenu('Review')

      expect(item(menu, 'Move left')).toHaveAttribute('aria-disabled', 'true')
      expect(item(menu, 'Move right')).toHaveAttribute('aria-disabled', 'true')
    })

    it('moves right only after the server answers', async () => {
      const { user, openMenu, item, boardView, columnNames } = await setup()
      const release = boardView.holdNext('moveColumn')

      await user.click(item(await openMenu('To do'), 'Move right'))
      expect(columnNames()).toEqual(['To do', 'In progress', 'Review', 'Done'])
      await act(async () => release())

      await waitFor(() =>
        expect(columnNames()).toEqual([
          'In progress',
          'To do',
          'Review',
          'Done',
        ]),
      )
    })

    it('shows the order from the move response when another device reordered first', async () => {
      const { user, openMenu, item, boardView, columnNames } = await setup({
        prepare: ({ boardView: fake }) =>
          fake.changeBoard(
            CARDIGAN_BOARD_ID,
            keep('To do', 'In progress', 'Done'),
          ),
      })
      act(() =>
        boardView.changeBoard(
          CARDIGAN_BOARD_ID,
          keep('Done', 'To do', 'In progress'),
        ),
      )

      await user.click(item(await openMenu('To do'), 'Move right'))

      await waitFor(() =>
        expect(columnNames()).toEqual(['Done', 'To do', 'In progress']),
      )
    })

    it('reloads without a toast when the move response has other columns', async () => {
      const { user, openMenu, item, boardView, columnNames } = await setup()
      act(() =>
        boardView.changeBoard(CARDIGAN_BOARD_ID, (columns) => [
          ...columns,
          { id: 'new', name: 'Blocked', position: 4, cards: [] },
        ]),
      )

      await user.click(item(await openMenu('To do'), 'Move right'))

      await waitFor(() =>
        expect(columnNames()).toEqual([
          'In progress',
          'To do',
          'Review',
          'Done',
          'Blocked',
        ]),
      )
      expect(screen.queryByRole('status')).toBeNull()
      expect(screen.queryByText(/Couldn't/)).toBeNull()
    })

    it('disables the move items of every column while a move runs', async () => {
      const { user, openMenu, item, boardView } = await setup()
      const release = boardView.holdNext('moveColumn')
      await user.click(item(await openMenu('To do'), 'Move right'))

      const menu = await openMenu('Done')

      expect(item(menu, 'Move left')).toHaveAttribute('aria-disabled', 'true')
      expect(item(menu, 'Move right')).toHaveAttribute('aria-disabled', 'true')
      expect(item(menu, 'Rename')).not.toHaveAttribute('aria-disabled')
      expect(item(menu, 'Delete column')).not.toHaveAttribute('aria-disabled')
      await user.keyboard('{Escape}')
      await act(async () => release())
    })

    it('sends the right target after a column was deleted', async () => {
      const { user, openMenu, item, dialog, boardView, columnNames } =
        await setup()
      const moveColumn = vi.spyOn(boardView, 'moveColumn')
      await user.click(item(await openMenu('To do'), 'Delete column'))
      await user.click(
        dialog().getByRole('button', { name: 'Delete column and 4 cards' }),
      )
      await waitFor(() =>
        expect(columnNames()).toEqual(['In progress', 'Review', 'Done']),
      )

      await user.click(item(await openMenu('Done'), 'Move left'))

      await waitFor(() =>
        expect(columnNames()).toEqual(['In progress', 'Done', 'Review']),
      )
      expect(moveColumn).toHaveBeenCalledWith(
        CARDIGAN_BOARD_ID,
        expect.any(String),
        1,
      )
    })

    it('keeps the order, shows a toast and reloads when the move fails', async () => {
      const { user, openMenu, item, boardView, columnNames } = await setup()
      const loadBoard = vi.spyOn(boardView, 'loadBoard')
      boardView.failNext('moveColumn', { kind: 'other' })

      await user.click(item(await openMenu('To do'), 'Move right'))

      expect(
        await screen.findByText(
          "Couldn't move “To do”. Check your connection and try again.",
        ),
      ).toBeInTheDocument()
      expect(columnNames()).toEqual(['To do', 'In progress', 'Review', 'Done'])
      await waitFor(() => expect(loadBoard).toHaveBeenCalled())
    })

    it('reloads with the stale-move toast on outOfRange', async () => {
      const { user, openMenu, item, boardView, columnNames } = await setup()
      act(() =>
        boardView.changeBoard(
          CARDIGAN_BOARD_ID,
          keep('In progress', 'Review', 'Done'),
        ),
      )

      await user.click(item(await openMenu('Review'), 'Move right'))

      expect(
        await screen.findByText(
          "Couldn't move “Review”. The board changed on another device, so it was reloaded.",
        ),
      ).toBeInTheDocument()
      expect(columnNames()).toEqual(['In progress', 'Review', 'Done'])
    })

    it('opens the board list with only the board-gone toast when the reload finds no board', async () => {
      const { user, openMenu, item, boards, boardView, onBoardGone } =
        await setup()
      boardView.failNext('moveColumn', { kind: 'outOfRange' })
      await act(() => boards.deleteBoard(CARDIGAN_BOARD_ID))

      await user.click(item(await openMenu('To do'), 'Move right'))

      await waitFor(() => expect(onBoardGone).toHaveBeenCalled())
      expect(
        screen.getByText('This board no longer exists.'),
      ).toBeInTheDocument()
      expect(
        screen.queryByText(/The board changed on another device/),
      ).toBeNull()
    })
  })

  describe('rename', () => {
    const nameField = () => screen.getByRole('textbox', { name: 'Name' })

    it('opens prefilled and renames the column without a toast', async () => {
      const { user, openMenu, item, dialog, content, menuButton } =
        await setup()
      await user.click(item(await openMenu('Review'), 'Rename'))

      expect(
        dialog().getByRole('heading', { name: 'Rename column' }),
      ).toBeInTheDocument()
      expect(nameField()).toHaveValue('Review')
      await user.clear(nameField())
      await user.type(nameField(), 'In review{Enter}')

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      expect(
        content().getByRole('region', { name: 'In review' }),
      ).toBeInTheDocument()
      expect(screen.queryByText(/Couldn't/)).toBeNull()
      await waitFor(() => expect(menuButton('In review')).toHaveFocus())
    })

    it('closes without a request when the name is unchanged after normalization', async () => {
      const { user, openMenu, item, boardView } = await setup()
      const renameColumn = vi.spyOn(boardView, 'renameColumn')
      await user.click(item(await openMenu('Review'), 'Rename'))

      await user.clear(nameField())
      await user.type(nameField(), ' Review {Enter}')

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      expect(renameColumn).not.toHaveBeenCalled()
    })

    it('shows name errors on submit and updates them live', async () => {
      const { user, openMenu, item, dialog } = await setup()
      await user.click(item(await openMenu('Review'), 'Rename'))

      await user.clear(nameField())
      await user.click(dialog().getByRole('button', { name: 'Save' }))
      expect(dialog().getByText('Enter a name.')).toBeInTheDocument()
      expect(dialog().getByRole('button', { name: 'Save' })).toBeDisabled()

      await user.type(nameField(), 'a'.repeat(31))
      expect(
        dialog().getByText('Use at most 30 characters.'),
      ).toBeInTheDocument()
      await user.keyboard('{Backspace}')
      expect(dialog().queryByText('Use at most 30 characters.')).toBeNull()
    })

    it('stays open on Escape while saving', async () => {
      const { user, openMenu, item, boardView } = await setup()
      await user.click(item(await openMenu('Review'), 'Rename'))
      await user.clear(nameField())
      await user.type(nameField(), 'In review')
      const release = boardView.holdNext('renameColumn')

      await user.keyboard('{Enter}')
      expect(nameField()).toBeDisabled()
      await user.keyboard('{Escape}')

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      await act(async () => release())
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    })

    it('saves nothing for Enter during an IME composition', async () => {
      const { user, openMenu, item, boardView } = await setup()
      const renameColumn = vi.spyOn(boardView, 'renameColumn')
      await user.click(item(await openMenu('Review'), 'Rename'))
      await user.type(nameField(), 'かな')

      fireEvent.keyDown(nameField(), { key: 'Enter', isComposing: true })

      expect(renameColumn).not.toHaveBeenCalled()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('shows a server field error under the field', async () => {
      const { user, openMenu, item, dialog, boardView } = await setup()
      boardView.failNext('renameColumn', {
        kind: 'invalid',
        fields: [{ field: 'name', code: 'TOO_LONG', max: 30 }],
      })
      await user.click(item(await openMenu('Review'), 'Rename'))
      await user.clear(nameField())
      await user.type(nameField(), 'In review{Enter}')

      expect(
        await dialog().findByText('Use at most 30 characters.'),
      ).toBeInTheDocument()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('names the current name, not the typed one, in the failure toast', async () => {
      const { user, openMenu, item, boardView } = await setup()
      boardView.failNext('renameColumn', { kind: 'other' })
      await user.click(item(await openMenu('Review'), 'Rename'))
      await user.clear(nameField())
      await user.type(nameField(), 'In review{Enter}')

      expect(
        await screen.findByText(
          "Couldn't rename “Review”. Check your connection and try again.",
        ),
      ).toBeInTheDocument()
      expect(nameField()).toHaveValue('In review')
    })
  })

  describe('delete', () => {
    it.each([
      [
        2,
        'Review',
        'Its 2 cards will be deleted too. This can’t be undone.',
        'Delete column and 2 cards',
      ],
      [
        1,
        'Review',
        'Its 1 card will be deleted too. This can’t be undone.',
        'Delete column and 1 card',
      ],
      [0, 'Review', 'This can’t be undone.', 'Delete column'],
    ])(
      'asks for a column with %i cards and deletes it',
      async (count, name, body, submit) => {
        const { user, openMenu, item, dialog, content } = await setup({
          prepare: ({ boardView }) =>
            boardView.changeBoard(CARDIGAN_BOARD_ID, (columns) =>
              columns.map((column) =>
                column.name === name
                  ? { ...column, cards: column.cards.slice(0, count) }
                  : column,
              ),
            ),
        })
        await user.click(item(await openMenu(name), 'Delete column'))

        expect(
          dialog().getByRole('heading', { name: `Delete column “${name}”?` }),
        ).toBeInTheDocument()
        expect(dialog().getByText(body)).toBeInTheDocument()
        await user.click(dialog().getByRole('button', { name: submit }))

        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
        expect(content().queryByRole('region', { name })).toBeNull()
        await waitFor(() =>
          expect(
            content().getByRole('button', {
              name: 'Actions for column “Done”',
            }),
          ).toHaveFocus(),
        )
      },
    )

    it('counts a 404 as deleted', async () => {
      const { user, openMenu, item, dialog, content, boardView } = await setup()
      boardView.failNext('deleteColumn', { kind: 'notFound' })
      await user.click(item(await openMenu('Review'), 'Delete column'))

      await user.click(
        dialog().getByRole('button', { name: 'Delete column and 2 cards' }),
      )

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      expect(content().queryByRole('region', { name: 'Review' })).toBeNull()
      expect(screen.queryByText(/Couldn't|no longer exists/)).toBeNull()
    })

    it('stays open with a toast on a 500', async () => {
      const { user, openMenu, item, dialog, boardView } = await setup()
      boardView.failNext('deleteColumn', { kind: 'other' })
      await user.click(item(await openMenu('Review'), 'Delete column'))

      await user.click(
        dialog().getByRole('button', { name: 'Delete column and 2 cards' }),
      )

      expect(
        await screen.findByText(
          "Couldn't delete “Review”. Check your connection and try again.",
        ),
      ).toBeInTheDocument()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('focuses Add column after deleting the last column', async () => {
      const { user, openMenu, item, dialog, content } = await setup()
      await user.click(item(await openMenu('Done'), 'Delete column'))

      await user.click(
        dialog().getByRole('button', { name: 'Delete column and 3 cards' }),
      )

      await waitFor(() =>
        expect(
          content().getByRole('button', { name: 'Add column' }),
        ).toHaveFocus(),
      )
    })
  })
})
