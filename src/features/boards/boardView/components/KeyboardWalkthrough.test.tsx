import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderBoardView } from '../testing/renderBoardView'

async function setup() {
  const view = await renderBoardView()
  await view.loaded()
  const focusOn = (element: HTMLElement) => element.focus()
  const menuButton = (column: string) =>
    view.content().getByRole('button', {
      name: `Actions for column “${column}”`,
    })
  const headerMenuButton = () =>
    screen
      .getAllByRole('button', { name: 'Board actions' })
      .find((button) => !screen.getByTestId('app-bar').contains(button))!
  /** Opens a menu from the keyboard and moves down to the item before choosing it. */
  const pick = async (trigger: HTMLElement, item: string) => {
    focusOn(trigger)
    await view.user.keyboard('{Enter}')
    const menu = within(await screen.findByRole('menu'))
    const target = menu.getByRole('menuitem', { name: item })
    for (let step = 0; step < 6 && document.activeElement !== target; step++) {
      await view.user.keyboard('{ArrowDown}')
    }
    expect(target).toHaveFocus()
    await view.user.keyboard('{Enter}')
  }
  return { ...view, menuButton, headerMenuButton, pick }
}

describe('keyboard only', () => {
  it('opens quick add, adds a card and leaves with Escape', async () => {
    const { user, content, column } = await setup()
    content().getByRole('button', { name: 'Add card to “Review”' }).focus()

    await user.keyboard('{Enter}')
    await user.keyboard('Write docs{Enter}')

    await waitFor(() =>
      expect(column('Review').getByText('Write docs')).toBeInTheDocument(),
    )
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('adds a column from the keyboard', async () => {
    const { user, content } = await setup()
    content().getByRole('button', { name: 'Add column' }).focus()

    await user.keyboard('{Enter}')
    await user.keyboard('Blocked{Enter}')

    await waitFor(() =>
      expect(
        content().getByRole('button', { name: 'Add card to “Blocked”' }),
      ).toHaveFocus(),
    )
  })

  it('moves a column and keeps focus on its menu button', async () => {
    const { pick, menuButton, content } = await setup()

    await pick(menuButton('To do'), 'Move right')

    await waitFor(() =>
      expect(
        content()
          .getAllByRole('heading', { level: 2 })
          .map((heading) => heading.textContent),
      ).toEqual(['In progress', 'To do', 'Review', 'Done']),
    )
    await waitFor(() => expect(menuButton('To do')).toHaveFocus())
  })

  it('returns focus to the column menu button after Rename closes', async () => {
    const { user, pick, menuButton } = await setup()

    await pick(menuButton('Review'), 'Rename')
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus()
    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(menuButton('Review')).toHaveFocus())
  })

  it('returns focus to the column menu button after Delete column is cancelled', async () => {
    const { user, pick, menuButton } = await setup()

    await pick(menuButton('Review'), 'Delete column')
    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(menuButton('Review')).toHaveFocus())
  })

  it('moves focus to the next column’s menu after Delete column', async () => {
    const { user, pick, menuButton } = await setup()

    await pick(menuButton('Review'), 'Delete column')
    await user.keyboard('{Tab}{Enter}')

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(menuButton('Done')).toHaveFocus())
  })

  it('returns focus to Board actions after Rename board closes', async () => {
    const { user, pick, headerMenuButton } = await setup()

    await pick(headerMenuButton(), 'Rename board')
    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(headerMenuButton()).toHaveFocus())
  })

  it('returns focus to Board actions after Delete board is cancelled', async () => {
    const { user, pick, headerMenuButton } = await setup()

    await pick(headerMenuButton(), 'Delete board')
    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(headerMenuButton()).toHaveFocus())
  })

  it('refreshes from the keyboard', async () => {
    const { user, refreshButton, boardView } = await setup()
    const loadBoard = vi.spyOn(boardView, 'loadBoard')
    refreshButton().focus()

    await user.keyboard('{Enter}')

    await waitFor(() => expect(loadBoard).toHaveBeenCalledTimes(1))
  })
})
