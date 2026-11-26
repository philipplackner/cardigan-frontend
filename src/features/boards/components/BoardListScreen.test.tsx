import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient } from '@/core/api/queryClient'
import { initialBoardListState } from '../hooks/boardListReducer'
import type {
  BoardListState,
  BoardListStatus,
} from '../hooks/useBoardListViewModel'
import { BoardsTestProviders } from '../testing/BoardsTestProviders'
import { installIntersectionObserverStub } from '../testing/intersectionObserverStub'
import { createInMemoryBoardsDataAccess } from '../testing/createInMemoryBoardsDataAccess'
import { sampleBoards, sampleNow } from '../testing/sampleBoards'
import type { BoardSummary } from '../types'
import { BoardListScreen } from './BoardListScreen'

let observer: ReturnType<typeof installIntersectionObserverStub>
beforeEach(() => {
  observer = installIntersectionObserverStub()
})
afterEach(() => observer.restore())

const sixBoards: BoardSummary[] = sampleBoards.slice(0, 6)

const ready = (boards: BoardSummary[]): BoardListStatus => ({
  type: 'ready',
  boards,
})

function renderScreen(status: BoardListStatus, isRefreshing = false) {
  const state: BoardListState = {
    ...initialBoardListState,
    status,
    isRefreshing,
    now: sampleNow,
  }
  const onAction = vi.fn()
  const onNewBoard = vi.fn()
  const openedBoards: string[] = []
  const importAction = { open: vi.fn(), dialogs: null }
  const user = userEvent.setup()
  render(
    <BoardsTestProviders
      queryClient={createTestQueryClient()}
      dataAccess={createInMemoryBoardsDataAccess([])}
    >
      <BoardListScreen
        state={state}
        onAction={onAction}
        onNewBoard={onNewBoard}
        renderBoardLink={(boardId) => (
          <button type="button" onClick={() => openedBoards.push(boardId)} />
        )}
        onOpenLabels={vi.fn()}
        importAction={importAction}
        account={{ email: 'philipp@example.com', onLogOut: vi.fn() }}
      />
    </BoardsTestProviders>,
  )
  return {
    user,
    onAction,
    onNewBoard,
    openedBoards,
    importAction,
    phone: () => within(screen.getByTestId('board-list-phone')),
    wide: () => within(screen.getByTestId('board-list-wide')),
    appBar: () => within(screen.getByTestId('app-bar')),
  }
}

describe('BoardListScreen', () => {
  describe('board count', () => {
    it.each<[string, BoardListStatus]>([
      ['loading', { type: 'loading' }],
      ['empty', ready([])],
      ['in the load error state', { type: 'error' }],
    ])('is hidden while %s', (_, status) => {
      const { phone, wide } = renderScreen(status)

      expect(wide().queryByText(/\d+ boards?$/)).toBeNull()
      expect(phone().queryByText(/\d+ boards?$/)).toBeNull()
      expect(wide().getByRole('heading', { name: 'Boards' })).toBeVisible()
    })

    it('reads "1 board" for one board', () => {
      const { wide } = renderScreen(ready(sixBoards.slice(0, 1)))

      expect(wide().getByText('1 board')).toBeInTheDocument()
    })

    it('shows the count in the header, the phone title and at the end of the phone list', () => {
      const { phone, wide } = renderScreen(ready([...sampleBoards]))

      expect(wide().getByText('14 boards')).toBeInTheDocument()
      expect(phone().getAllByText('14 boards')).toHaveLength(2)
    })
  })

  it('shows tile and row texts', () => {
    const { phone, wide } = renderScreen(ready(sixBoards))

    const tile = wide()
      .getByRole('button', { name: 'Cardigan v1' })
      .closest('article')!
    expect(tile).toHaveTextContent('CRD')
    expect(tile).toHaveTextContent('12 cards')
    expect(tile).toHaveTextContent('Updated 2 hours ago')

    const row = phone()
      .getByRole('button', { name: 'Cardigan v1' })
      .closest('article')!
    expect(row).toHaveTextContent('CRD')
    expect(row).toHaveTextContent('12 cards')
    expect(row).toHaveTextContent('2 hours ago')
    expect(row).not.toHaveTextContent('Updated')
  })

  it('shows the phone list under the large title, not busy once loaded', () => {
    const { phone } = renderScreen(ready(sixBoards))

    expect(
      phone().getByRole('heading', { level: 1, name: 'Boards' }),
    ).toBeInTheDocument()
    expect(phone().getByRole('list')).not.toHaveAttribute('aria-busy')
    expect(phone().getAllByRole('listitem')).toHaveLength(6)
  })

  it('shows "1 card" and groups large counts', () => {
    const { wide } = renderScreen(
      ready([
        { ...sixBoards[0]!, cardCount: 1 },
        { ...sixBoards[1]!, cardCount: 1234 },
      ]),
    )

    expect(wide().getByText('1 card')).toBeInTheDocument()
    expect(wide().getByText('1,234 cards')).toBeInTheDocument()
  })

  it('keeps the order it is given', () => {
    const { wide } = renderScreen(ready([sixBoards[1]!, sixBoards[0]!]))

    const names = wide()
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent)
    expect(names).toEqual(['Raytracer', 'Cardigan v1'])
  })

  it('has New board and Menu in the phone app bar, without Refresh', () => {
    const { appBar } = renderScreen(ready(sixBoards))

    expect(appBar().getByRole('button', { name: 'New board' })).toBeVisible()
    expect(appBar().getByRole('button', { name: 'Menu' })).toBeVisible()
    expect(appBar().queryByRole('button', { name: 'Refresh' })).toBeNull()
  })

  it('has Refresh, Import and New board in the header', async () => {
    const { user, wide, onAction, onNewBoard, importAction } = renderScreen(
      ready(sixBoards),
    )

    await user.click(wide().getByRole('button', { name: 'Refresh' }))
    await user.click(wide().getByRole('button', { name: 'Import' }))
    await user.click(wide().getByRole('button', { name: 'New board' }))

    expect(onAction).toHaveBeenCalledWith({ type: 'refreshClick' })
    expect(importAction.open).toHaveBeenCalledOnce()
    expect(onNewBoard).toHaveBeenCalledOnce()
  })

  it('marks Refresh busy while refreshing', () => {
    const { wide } = renderScreen(ready(sixBoards), true)

    expect(wide().getByRole('button', { name: 'Refresh' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
  })

  it('opens New board from the phone +', async () => {
    const { user, appBar, onNewBoard } = renderScreen(ready(sixBoards))

    await user.click(appBar().getByRole('button', { name: 'New board' }))

    expect(onNewBoard).toHaveBeenCalledOnce()
  })

  it('opens New board and Import from the empty state', async () => {
    const { user, wide, onNewBoard, importAction } = renderScreen(ready([]))
    const empty = wide()
      .getByRole('heading', { name: 'No boards yet' })
      .closest('div')!.parentElement!

    expect(empty).toHaveTextContent(
      'Create a board to start adding cards, or import a board from a JSON export.',
    )
    await user.click(within(empty).getByRole('button', { name: 'New board' }))
    await user.click(within(empty).getByRole('button', { name: 'Import' }))

    expect(onNewBoard).toHaveBeenCalledOnce()
    expect(importAction.open).toHaveBeenCalledOnce()
  })

  it('shows skeletons while loading, with the header actions available', () => {
    const { wide, phone } = renderScreen({ type: 'loading' })

    expect(wide().queryByRole('heading', { level: 3 })).toBeNull()
    expect(phone().queryByRole('heading', { level: 3 })).toBeNull()
    expect(phone().getByRole('list')).toHaveAttribute('aria-busy', 'true')
    expect(phone().getAllByRole('listitem', { hidden: true })).toHaveLength(5)
    expect(wide().getByRole('button', { name: 'New board' })).toBeEnabled()
  })

  it('shows the load error with Try again', async () => {
    const { user, wide, onAction } = renderScreen({ type: 'error' })

    expect(
      wide().getByRole('heading', { name: 'Couldn’t load your boards' }),
    ).toBeInTheDocument()
    expect(
      wide().getByText('Check your connection and try again.'),
    ).toBeInTheDocument()
    await user.click(wide().getByRole('button', { name: 'Try again' }))

    expect(onAction).toHaveBeenCalledWith({ type: 'tryAgainClick' })
  })

  it('opens the right board from a tile and a row', async () => {
    const { user, wide, phone, openedBoards } = renderScreen(ready(sixBoards))

    await user.click(wide().getByRole('button', { name: 'Raytracer' }))
    await user.click(phone().getByRole('button', { name: 'Cardigan v1' }))

    expect(openedBoards).toEqual([sixBoards[1]!.id, sixBoards[0]!.id])
  })

  it('does not open the board from its menu button', async () => {
    const { user, wide, openedBoards } = renderScreen(ready(sixBoards))

    await user.click(
      wide().getByRole('button', { name: 'Actions for board “Cardigan v1”' }),
    )

    expect(openedBoards).toEqual([])
  })

  it('names the icon-only controls', () => {
    const { wide, phone } = renderScreen(ready(sixBoards))

    expect(
      wide().getByRole('button', { name: 'Actions for board “Cardigan v1”' }),
    ).toBeInTheDocument()
    expect(
      phone().getByRole('button', { name: 'Actions for board “Cardigan v1”' }),
    ).toBeInTheDocument()
    expect(wide().getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
  })

  describe('phone app bar title', () => {
    const barHeader = () =>
      within(screen.getByTestId('app-bar')).getByRole('banner')

    it('shows the brand at the top', () => {
      renderScreen(ready(sixBoards))

      expect(barHeader()).toHaveTextContent('Cardigan')
      expect(within(barHeader()).queryByRole('heading')).toBeNull()
      expect(barHeader()).not.toHaveClass('shadow-raised')
    })

    it('keeps the brand while the large title is partly hidden', () => {
      renderScreen(ready(sixBoards))

      act(() =>
        observer.report({ isIntersecting: true, intersectionRatio: 0.5 }),
      )

      expect(barHeader()).toHaveTextContent('Cardigan')
      expect(barHeader()).not.toHaveClass('shadow-raised')
    })

    it('shows "Boards" raised once the large title is fully hidden', () => {
      renderScreen(ready(sixBoards))

      act(() =>
        observer.report({ isIntersecting: false, intersectionRatio: 0 }),
      )

      expect(
        within(barHeader()).getByRole('heading', { name: 'Boards' }),
      ).toBeInTheDocument()
      expect(barHeader()).not.toHaveTextContent('Cardigan')
      expect(barHeader()).toHaveClass('shadow-raised')
      expect(
        within(barHeader()).getByRole('button', { name: 'New board' }),
      ).toBeInTheDocument()
      expect(
        within(barHeader()).getByRole('button', { name: 'Menu' }),
      ).toBeInTheDocument()
    })
  })
})
