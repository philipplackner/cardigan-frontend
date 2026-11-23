import { act, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderBoardView } from '../testing/renderBoardView'
import { CARDIGAN_BOARD_ID } from '../testing/sampleBoardContent'

async function setup(options?: Parameters<typeof renderBoardView>[0]) {
  const view = await renderBoardView(options)
  await view.loaded()
  const header = () =>
    within(
      screen
        .getAllByRole('banner')
        .find((element) => !screen.getByTestId('app-bar').contains(element))!,
    )
  const openBoardMenu = async () => {
    await view.user.click(
      header().getByRole('button', { name: 'Board actions' }),
    )
    return within(await screen.findByRole('menu'))
  }
  const dialog = () => within(screen.getByRole('dialog'))
  return { ...view, header, openBoardMenu, dialog }
}

describe('board menu', () => {
  it('offers Rename board, Export as JSON and Delete board', async () => {
    const { openBoardMenu } = await setup()
    const menu = await openBoardMenu()

    expect(
      menu.getAllByRole('menuitem').map((item) => item.textContent),
    ).toEqual(['Rename board', 'Export as JSON', 'Delete board'])
  })

  it('renames the board and shows the new name without a reload', async () => {
    const { user, openBoardMenu, dialog, header, boardView } = await setup()
    const loadBoard = vi.spyOn(boardView, 'loadBoard')
    await user.click(
      (await openBoardMenu()).getByRole('menuitem', {
        name: 'Rename board',
      }),
    )

    const name = dialog().getByRole('textbox', { name: 'Name' })
    await user.clear(name)
    await user.type(name, 'Cardigan v2')
    await user.click(dialog().getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(
        header().getByRole('heading', { name: 'Cardigan v2' }),
      ).toBeInTheDocument(),
    )
    expect(loadBoard).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('closes an unchanged rename without a request', async () => {
    const { user, openBoardMenu, dialog, boards } = await setup()
    const renameBoard = vi.spyOn(boards, 'renameBoard')
    await user.click(
      (await openBoardMenu()).getByRole('menuitem', {
        name: 'Rename board',
      }),
    )

    await user.click(dialog().getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(renameBoard).not.toHaveBeenCalled()
  })

  it('goes to the board list without a toast after a delete', async () => {
    const { user, openBoardMenu, dialog, onBoardGone, onNotFound } =
      await setup()
    await user.click(
      (await openBoardMenu()).getByRole('menuitem', {
        name: 'Delete board',
      }),
    )

    await user.click(dialog().getByRole('button', { name: 'Delete board' }))

    await waitFor(() => expect(onBoardGone).toHaveBeenCalledTimes(1))
    expect(onNotFound).not.toHaveBeenCalled()
    expect(screen.queryByText('This board no longer exists.')).toBeNull()
  })

  it('goes to the board list with only the rename dialog’s toast when the board was deleted elsewhere', async () => {
    const { user, openBoardMenu, dialog, boards, onBoardGone } = await setup()
    await user.click(
      (await openBoardMenu()).getByRole('menuitem', {
        name: 'Rename board',
      }),
    )
    await act(() => boards.deleteBoard(CARDIGAN_BOARD_ID))

    const name = dialog().getByRole('textbox', { name: 'Name' })
    await user.clear(name)
    await user.type(name, 'Cardigan v2')
    await user.click(dialog().getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onBoardGone).toHaveBeenCalledTimes(1))
    expect(
      screen.getByText('“Cardigan v1” no longer exists.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('This board no longer exists.')).toBeNull()
  })

  it('asks the host to export the board', async () => {
    const { user, openBoardMenu, onExport } = await setup()

    await user.click(
      (await openBoardMenu()).getByRole('menuitem', {
        name: 'Export as JSON',
      }),
    )

    expect(onExport).toHaveBeenCalledWith({
      id: CARDIGAN_BOARD_ID,
      name: 'Cardigan v1',
    })
  })
})

describe('refresh', () => {
  it('keeps the columns and marks Refresh busy while it runs, then shows changes from another device', async () => {
    const { user, refreshButton, boardView, column, content } = await setup()
    act(() =>
      boardView.changeBoard(CARDIGAN_BOARD_ID, (columns) =>
        columns.map((entry) =>
          entry.name === 'Review'
            ? {
                ...entry,
                cards: [
                  ...entry.cards,
                  {
                    id: 'elsewhere',
                    number: 200,
                    title: 'Added elsewhere',
                    position: 0,
                    labels: [],
                  },
                ],
              }
            : entry,
        ),
      ),
    )
    const release = boardView.holdNext('loadBoard')

    await user.click(refreshButton())

    expect(refreshButton()).toHaveAttribute('aria-busy', 'true')
    expect(content().getByRole('region', { name: 'To do' })).toBeInTheDocument()
    await act(async () => release())
    await waitFor(() =>
      expect(column('Review').getByText('Added elsewhere')).toBeInTheDocument(),
    )
    expect(refreshButton()).not.toHaveAttribute('aria-busy')
  })

  it('keeps the board and shows a toast when the refresh fails', async () => {
    const { user, refreshButton, boardView, content } = await setup()
    boardView.failNext('loadBoard', { kind: 'other' })

    await user.click(refreshButton())

    expect(
      await screen.findByText(
        "Couldn't refresh the board. Check your connection and try again.",
      ),
    ).toBeInTheDocument()
    expect(content().getByRole('region', { name: 'To do' })).toBeInTheDocument()
  })

  it('keeps the quick add text', async () => {
    const { user, refreshButton, content, boardView } = await setup()
    await user.click(
      content().getByRole('button', { name: 'Add card to “To do”' }),
    )
    await user.type(screen.getByRole('textbox'), 'Write docs')
    const loadBoard = vi.spyOn(boardView, 'loadBoard')

    await user.click(refreshButton())

    await waitFor(() => expect(loadBoard).toHaveBeenCalled())
    await waitFor(() =>
      expect(refreshButton()).not.toHaveAttribute('aria-busy'),
    )
    expect(screen.getByRole('textbox')).toHaveValue('Write docs')
  })

  it('keeps the add column text', async () => {
    const { user, refreshButton, content } = await setup()
    await user.click(content().getByRole('button', { name: 'Add column' }))
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Blocked')

    await user.click(refreshButton())

    await waitFor(() =>
      expect(refreshButton()).not.toHaveAttribute('aria-busy'),
    )
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Blocked')
  })

  it('closes a quick add whose column was deleted elsewhere', async () => {
    const { user, refreshButton, content, boardView } = await setup()
    await user.click(
      content().getByRole('button', { name: 'Add card to “Review”' }),
    )
    await user.type(screen.getByRole('textbox'), 'Write docs')
    act(() =>
      boardView.changeBoard(CARDIGAN_BOARD_ID, (columns) =>
        columns.filter((entry) => entry.name !== 'Review'),
      ),
    )

    await user.click(refreshButton())

    await waitFor(() =>
      expect(content().queryByRole('region', { name: 'Review' })).toBeNull(),
    )
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('still shows a card added while a refresh runs', async () => {
    const { user, refreshButton, content, boardView, column } = await setup()
    const release = boardView.holdNext('loadBoard')
    await user.click(refreshButton())

    await user.click(
      content().getByRole('button', { name: 'Add card to “Review”' }),
    )
    await user.type(screen.getByRole('textbox'), 'Write docs{Enter}')
    await waitFor(() =>
      expect(column('Review').getByText('Write docs')).toBeInTheDocument(),
    )
    await act(async () => release())

    await waitFor(() =>
      expect(refreshButton()).not.toHaveAttribute('aria-busy'),
    )
    expect(column('Review').getByText('Write docs')).toBeInTheDocument()
  })
})
