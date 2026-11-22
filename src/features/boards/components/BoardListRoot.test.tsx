import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient } from '@/core/api/queryClient'
import { BoardsTestProviders } from '../testing/BoardsTestProviders'
import { installIntersectionObserverStub } from '../testing/intersectionObserverStub'
import {
  createInMemoryBoardsDataAccess,
  type InMemoryBoardsDataAccess,
} from '../testing/createInMemoryBoardsDataAccess'
import { sampleBoards } from '../testing/sampleBoards'
import { BoardListRoot } from './BoardListScreen'

let observer: ReturnType<typeof installIntersectionObserverStub>
beforeEach(() => {
  observer = installIntersectionObserverStub()
})
afterEach(() => observer.restore())

function renderBoardList(
  dataAccess: InMemoryBoardsDataAccess = createInMemoryBoardsDataAccess(
    sampleBoards.slice(0, 6),
  ),
) {
  const queryClient = createTestQueryClient()
  const user = userEvent.setup()
  render(
    <BoardsTestProviders
      queryClient={queryClient}
      dataAccess={dataAccess}
      openNewBoardDialog={vi.fn()}
    >
      <BoardListRoot
        renderBoardLink={() => <button type="button" />}
        onOpenLabels={vi.fn()}
        importAction={{ open: vi.fn(), dialogs: null }}
        account={{ email: 'philipp@example.com', onLogOut: vi.fn() }}
      />
    </BoardsTestProviders>,
  )
  const wide = () => within(screen.getByTestId('board-list-wide'))
  const refreshButton = () => wide().getByRole('button', { name: 'Refresh' })
  return { user, queryClient, dataAccess, wide, refreshButton }
}

const isLoading = (region: HTMLElement) =>
  region.querySelector('[aria-busy="true"]') !== null

describe('BoardListRoot', () => {
  it('shows skeletons on the first load, then the boards', async () => {
    const dataAccess = createInMemoryBoardsDataAccess(sampleBoards.slice(0, 6))
    const release = dataAccess.holdNext('listBoards')
    const { wide } = renderBoardList(dataAccess)

    expect(isLoading(screen.getByTestId('board-list-wide'))).toBe(true)
    expect(wide().queryByText('Cardigan v1')).toBeNull()

    await act(async () => release())

    expect(await wide().findByText('Cardigan v1')).toBeInTheDocument()
    expect(isLoading(screen.getByTestId('board-list-wide'))).toBe(false)
    expect(wide().getByText('6 boards')).toBeInTheDocument()
  })

  it('shows the empty state when there are no boards', async () => {
    const { wide } = renderBoardList(createInMemoryBoardsDataAccess([]))

    expect(
      await wide().findByRole('heading', { name: 'No boards yet' }),
    ).toBeInTheDocument()
  })

  it('shows the load error and loads again with Try again', async () => {
    const dataAccess = createInMemoryBoardsDataAccess(sampleBoards.slice(0, 6))
    dataAccess.failNext('listBoards', { kind: 'other' })
    const { user, wide } = renderBoardList(dataAccess)

    await wide().findByRole('heading', { name: 'Couldn’t load your boards' })
    await user.click(wide().getByRole('button', { name: 'Try again' }))

    expect(await wide().findByText('Cardigan v1')).toBeInTheDocument()
  })

  it('shows skeletons when Refresh is used in the error state', async () => {
    const dataAccess = createInMemoryBoardsDataAccess(sampleBoards.slice(0, 6))
    dataAccess.failNext('listBoards', { kind: 'other' })
    const { user, wide, refreshButton } = renderBoardList(dataAccess)
    await wide().findByRole('heading', { name: 'Couldn’t load your boards' })
    const release = dataAccess.holdNext('listBoards')

    await user.click(refreshButton())

    expect(isLoading(screen.getByTestId('board-list-wide'))).toBe(true)
    expect(wide().queryByText('Couldn’t load your boards')).toBeNull()
    await act(async () => release())
    expect(await wide().findByText('Cardigan v1')).toBeInTheDocument()
  })

  it('keeps the list and marks Refresh busy while refreshing', async () => {
    const { user, dataAccess, wide, refreshButton } = renderBoardList()
    await wide().findByText('Cardigan v1')
    await act(() =>
      dataAccess.createBoard({ name: 'Made elsewhere', key: 'ELSE' }),
    )
    const release = dataAccess.holdNext('listBoards')

    await user.click(refreshButton())

    expect(refreshButton()).toHaveAttribute('aria-busy', 'true')
    expect(wide().getByText('Cardigan v1')).toBeInTheDocument()
    await act(async () => release())
    expect(await wide().findByText('Made elsewhere')).toBeInTheDocument()
    expect(refreshButton()).not.toHaveAttribute('aria-busy')
  })

  it('sends no second request when Refresh is selected while refreshing', async () => {
    const { user, dataAccess, wide, refreshButton } = renderBoardList()
    await wide().findByText('Cardigan v1')
    const listBoards = vi.spyOn(dataAccess, 'listBoards')
    const release = dataAccess.holdNext('listBoards')

    await user.click(refreshButton())
    await user.click(refreshButton())
    await act(async () => release())

    expect(listBoards).toHaveBeenCalledTimes(1)
  })

  it('does not mark Refresh busy while the list reloads after a rename', async () => {
    const { user, dataAccess, wide, refreshButton } = renderBoardList()
    await user.click(
      await wide().findByRole('button', {
        name: 'Actions for board “Cardigan v1”',
      }),
    )
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))
    const dialog = screen.getByRole('dialog', { name: 'Rename board' })
    const release = dataAccess.holdNext('listBoards')

    await user.clear(within(dialog).getByRole('textbox', { name: 'Name' }))
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Name' }),
      'Cardigan v2',
    )
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(await wide().findByText('Cardigan v2')).toBeInTheDocument()
    expect(refreshButton()).not.toHaveAttribute('aria-busy')
    await act(async () => release())
  })

  it('keeps the list and shows a toast when Refresh fails', async () => {
    const { user, dataAccess, wide, refreshButton } = renderBoardList()
    await wide().findByText('Cardigan v1')
    dataAccess.failNext('listBoards', { kind: 'other' })

    await user.click(refreshButton())

    expect(
      await screen.findByText(
        'Couldn’t refresh your boards. Check your connection and try again.',
      ),
    ).toBeInTheDocument()
    expect(wide().getByText('Cardigan v1')).toBeInTheDocument()
    expect(refreshButton()).not.toHaveAttribute('aria-busy')
  })

  it('shows no toast when the session ended during a refresh', async () => {
    const { user, dataAccess, wide, refreshButton } = renderBoardList()
    await wide().findByText('Cardigan v1')
    dataAccess.failNext('listBoards', { kind: 'sessionEnded' })

    await user.click(refreshButton())

    await vi.waitFor(() =>
      expect(refreshButton()).not.toHaveAttribute('aria-busy'),
    )
    expect(screen.queryByText(/Couldn’t refresh/)).toBeNull()
  })

  describe('board menu', () => {
    const threeBoards = () =>
      createInMemoryBoardsDataAccess(sampleBoards.slice(0, 3))

    async function openMenuItem(
      user: ReturnType<typeof userEvent.setup>,
      boardName: string,
      item: 'Rename' | 'Delete board',
    ) {
      const menuButton = await within(
        screen.getByTestId('board-list-wide'),
      ).findByRole('button', { name: `Actions for board “${boardName}”` })
      await user.click(menuButton)
      const menu = screen.getByRole('menu')
      expect(
        within(menu)
          .getAllByRole('menuitem')
          .map((i) => i.textContent),
      ).toEqual(['Rename', 'Delete board'])
      await user.click(within(menu).getByRole('menuitem', { name: item }))
      return menuButton
    }

    it('opens Rename board for the board and keeps it open after the menu closes', async () => {
      const { user } = renderBoardList(threeBoards())

      await openMenuItem(user, 'Cardigan v1', 'Rename')

      expect(screen.queryByRole('menu')).toBeNull()
      const dialog = screen.getByRole('dialog', { name: 'Rename board' })
      expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveValue(
        'Cardigan v1',
      )
    })

    it('opens Delete board for the board and keeps it open after the menu closes', async () => {
      const { user } = renderBoardList(threeBoards())

      await openMenuItem(user, 'Raytracer', 'Delete board')

      expect(screen.queryByRole('menu')).toBeNull()
      expect(
        screen.getByRole('dialog', { name: 'Delete board “Raytracer”?' }),
      ).toBeInTheDocument()
    })

    it('returns focus to the menu button when the dialog closes and the board is still there', async () => {
      const { user } = renderBoardList(threeBoards())
      const menuButton = await openMenuItem(user, 'Raytracer', 'Rename')

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      await vi.waitFor(() => expect(menuButton).toHaveFocus())
    })

    async function deleteBoard(
      user: ReturnType<typeof userEvent.setup>,
      boardName: string,
    ) {
      await openMenuItem(user, boardName, 'Delete board')
      await user.click(screen.getByRole('button', { name: 'Delete board' }))
      await vi.waitFor(() =>
        expect(
          within(screen.getByTestId('board-list-wide')).queryByText(boardName),
        ).toBeNull(),
      )
    }

    it('moves focus to the next board after deleting the first one with the keyboard', async () => {
      const { user } = renderBoardList(threeBoards())
      const menuButton = await within(
        screen.getByTestId('board-list-wide'),
      ).findByRole('button', { name: 'Actions for board “Cardigan v1”' })

      menuButton.focus()
      await user.keyboard('{Enter}')
      await user.keyboard('{ArrowDown}{Enter}')
      const dialog = await screen.findByRole('dialog', {
        name: 'Delete board “Cardigan v1”?',
      })
      within(dialog).getByRole('button', { name: 'Delete board' }).focus()
      await user.keyboard('{Enter}')

      await vi.waitFor(() =>
        expect(document.activeElement).toHaveAccessibleName(
          'Actions for board “Raytracer”',
        ),
      )
    })

    it('moves focus to the previous board after deleting the last one', async () => {
      const { user } = renderBoardList(threeBoards())

      await deleteBoard(user, 'Conference talk')

      await vi.waitFor(() =>
        expect(document.activeElement).toHaveAccessibleName(
          'Actions for board “Raytracer”',
        ),
      )
    })

    it('moves focus to New board after deleting the only board', async () => {
      const { user } = renderBoardList(
        createInMemoryBoardsDataAccess(sampleBoards.slice(0, 1)),
      )

      await deleteBoard(user, 'Cardigan v1')

      await vi.waitFor(() =>
        expect(document.activeElement).toHaveAccessibleName('New board'),
      )
    })
  })
})
