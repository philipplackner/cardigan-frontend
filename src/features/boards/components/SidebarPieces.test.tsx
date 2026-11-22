import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18next from 'i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient } from '@/core/api/queryClient'
import { Sidebar } from '@/core/ui'
import { BoardsTestProviders } from '../testing/BoardsTestProviders'
import {
  createInMemoryBoardsDataAccess,
  type InMemoryBoardsDataAccess,
} from '../testing/createInMemoryBoardsDataAccess'
import { installIntersectionObserverStub } from '../testing/intersectionObserverStub'
import { sampleBoards } from '../testing/sampleBoards'
import { sidebarAccount } from '../utils/sidebarAccount'
import { BoardListRoot } from './BoardListScreen'
import { BoardsNavItem } from './BoardsNavItem'
import { BoardsNavList } from './BoardsNavList'
import { NewBoardDialogProvider } from './NewBoardDialogProvider'
import { NewBoardNavItem } from './NewBoardNavItem'

let observer: ReturnType<typeof installIntersectionObserverStub>
beforeEach(() => {
  observer = installIntersectionObserverStub()
})
afterEach(() => observer.restore())

const t = i18next.getFixedT('en', 'boards')

type Options = {
  dataAccess?: InMemoryBoardsDataAccess
  isListOpen?: boolean
  currentBoardId?: string
  email?: string | null
  withBoardList?: boolean
}

function renderSidebar({
  dataAccess = createInMemoryBoardsDataAccess(sampleBoards.slice(0, 6)),
  isListOpen = true,
  currentBoardId,
  email = 'philipp@example.com',
  withBoardList = false,
}: Options = {}) {
  const openedBoards: string[] = []
  const onLogOut = vi.fn()
  const user = userEvent.setup()
  render(
    <BoardsTestProviders
      queryClient={createTestQueryClient()}
      dataAccess={dataAccess}
    >
      <NewBoardDialogProvider onBoardCreated={vi.fn()}>
        <Sidebar
          brandName="Cardigan"
          navLabel="Main"
          mainNav={
            <BoardsNavItem
              isCurrent={isListOpen}
              link={<button type="button" />}
            />
          }
          boardsHeading={t('sidebar.boardsHeading')}
          boards={
            <BoardsNavList
              currentBoardId={currentBoardId}
              renderBoardLink={(boardId) => (
                <button
                  type="button"
                  onClick={() => openedBoards.push(boardId)}
                />
              )}
            />
          }
          boardsAction={<NewBoardNavItem />}
          account={sidebarAccount({ email, onLogOut }, t)}
        />
        {withBoardList && (
          <BoardListRoot
            renderBoardLink={() => <button type="button" />}
            onOpenLabels={vi.fn()}
            importAction={{ open: vi.fn(), dialogs: null }}
            account={{ email, onLogOut }}
          />
        )}
      </NewBoardDialogProvider>
    </BoardsTestProviders>,
  )
  const nav = () => within(screen.getByRole('navigation', { name: 'Main' }))
  const boardRows = () =>
    nav()
      .getAllByRole('button')
      .filter((button) => button.textContent !== 'All boards')
      .map((button) => button.textContent)
  return { user, nav, boardRows, openedBoards, onLogOut, dataAccess }
}

describe('sidebar board section', () => {
  it('lists the boards with their keys in list order, then New board', async () => {
    const { nav, boardRows } = renderSidebar()

    await nav().findByText('Cardigan v1')

    expect(boardRows()).toEqual([
      'Cardigan v1CRD',
      'RaytracerRAY',
      'Conference talkTALK',
      'Home serverHOME',
      'Dotfiles cleanupDOT',
      'Reading listREAD',
      'New board',
    ])
    expect(nav().getByRole('heading', { name: 'Boards' })).toBeInTheDocument()
  })

  it('keeps the server order', async () => {
    const dataAccess = createInMemoryBoardsDataAccess(sampleBoards.slice(0, 2))
    const raytracer = sampleBoards[1]!
    await dataAccess.renameBoard(raytracer.id, 'Raytracer')
    const { nav, boardRows } = renderSidebar({ dataAccess })

    await nav().findByText('Cardigan v1')

    expect(boardRows().slice(0, 2)).toEqual(['RaytracerRAY', 'Cardigan v1CRD'])
  })

  it('marks All boards current while the board list is open', async () => {
    const { nav } = renderSidebar()

    expect(nav().getByRole('button', { name: 'All boards' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('marks the open board current instead of All boards', async () => {
    const { nav } = renderSidebar({
      isListOpen: false,
      currentBoardId: sampleBoards[0]!.id,
    })

    expect(
      await nav().findByRole('button', { name: /^Cardigan v1/ }),
    ).toHaveAttribute('aria-current', 'page')
    expect(
      nav().getByRole('button', { name: 'All boards' }),
    ).not.toHaveAttribute('aria-current')
  })

  it('opens a board through its link', async () => {
    const { user, nav, openedBoards } = renderSidebar()

    await user.click(await nav().findByRole('button', { name: /^Raytracer/ }))

    expect(openedBoards).toEqual([sampleBoards[1]!.id])
  })

  it('shows no rows while loading', () => {
    const dataAccess = createInMemoryBoardsDataAccess(sampleBoards.slice(0, 6))
    dataAccess.holdNext('listBoards')
    const { boardRows } = renderSidebar({ dataAccess })

    expect(boardRows()).toEqual(['New board'])
  })

  it('shows only New board when there are no boards', async () => {
    const dataAccess = createInMemoryBoardsDataAccess([])
    const listBoards = vi.spyOn(dataAccess, 'listBoards')
    const { boardRows } = renderSidebar({ dataAccess })

    await vi.waitFor(() => expect(listBoards).toHaveBeenCalled())
    await act(() => Promise.resolve())
    expect(boardRows()).toEqual(['New board'])
  })

  it('shows only New board after a load error', async () => {
    const dataAccess = createInMemoryBoardsDataAccess(sampleBoards.slice(0, 6))
    dataAccess.failNext('listBoards', { kind: 'other' })
    const { boardRows } = renderSidebar({ dataAccess, withBoardList: true })

    await screen.findAllByRole('heading', {
      name: 'Couldn’t load your boards',
    })
    expect(boardRows()).toEqual(['New board'])
  })

  it('opens the New board dialog on a page without the board list', async () => {
    const { user, nav } = renderSidebar()

    await user.click(nav().getByRole('button', { name: 'New board' }))

    expect(
      screen.getByRole('dialog', { name: 'New board' }),
    ).toBeInTheDocument()
  })

  it('shares one New board dialog with the header button', async () => {
    const { user, nav } = renderSidebar({ withBoardList: true })
    const wide = within(screen.getByTestId('board-list-wide'))

    await user.click(nav().getByRole('button', { name: 'New board' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Name' }),
      'Garden irrigation',
    )
    await user.keyboard('{Escape}')
    await user.click(wide.getByRole('button', { name: 'New board' }))

    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('')
  })

  describe('account footer', () => {
    it('shows the email and its initial, and logs out', async () => {
      const { user, onLogOut } = renderSidebar()

      expect(screen.getByText('philipp@example.com')).toBeInTheDocument()
      expect(screen.getByText('P')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Log out' }))

      expect(onLogOut).toHaveBeenCalledOnce()
    })

    it('hides the email and the initial while the email is unknown', () => {
      renderSidebar({ email: null })

      const footer = screen.getByRole('button', {
        name: 'Log out',
      }).parentElement!
      expect(footer).toHaveTextContent(/^$/)
    })
  })
})
