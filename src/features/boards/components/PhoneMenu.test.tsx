import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient } from '@/core/api/queryClient'
import { Dialog } from '@/core/ui'
import { initialBoardListState } from '../hooks/boardListReducer'
import { BoardsTestProviders } from '../testing/BoardsTestProviders'
import { createInMemoryBoardsDataAccess } from '../testing/createInMemoryBoardsDataAccess'
import { installIntersectionObserverStub } from '../testing/intersectionObserverStub'
import { sampleBoards, sampleNow } from '../testing/sampleBoards'
import { BoardListScreen } from './BoardListScreen'

let observer: ReturnType<typeof installIntersectionObserverStub>
beforeEach(() => {
  observer = installIntersectionObserverStub()
})
afterEach(() => observer.restore())

type HostProps = {
  email: string | null
  onOpenLabels: () => void
  onLogOut: () => void
}

function Host({ email, onOpenLabels, onLogOut }: HostProps) {
  const [isImportOpen, setIsImportOpen] = useState(false)
  return (
    <BoardListScreen
      state={{
        ...initialBoardListState,
        status: { type: 'ready', boards: sampleBoards.slice(0, 6) },
        isRefreshing: false,
        now: sampleNow,
      }}
      onAction={vi.fn()}
      onNewBoard={vi.fn()}
      renderBoardLink={() => <button type="button" />}
      onOpenLabels={onOpenLabels}
      importAction={{
        open: () => setIsImportOpen(true),
        dialogs: (
          <Dialog
            open={isImportOpen}
            onOpenChange={setIsImportOpen}
            title="Import board"
          />
        ),
      }}
      account={{ email, onLogOut }}
    />
  )
}

function renderMenu(email: string | null = 'philipp@example.com') {
  const onOpenLabels = vi.fn()
  const onLogOut = vi.fn()
  const user = userEvent.setup()
  render(
    <BoardsTestProviders
      queryClient={createTestQueryClient()}
      dataAccess={createInMemoryBoardsDataAccess([])}
    >
      <Host email={email} onOpenLabels={onOpenLabels} onLogOut={onLogOut} />
    </BoardsTestProviders>,
  )
  const openMenu = async () => {
    await user.click(
      within(screen.getByTestId('app-bar')).getByRole('button', {
        name: 'Menu',
      }),
    )
    return screen.getByRole('menu')
  }
  return { user, onOpenLabels, onLogOut, openMenu }
}

describe('phone menu', () => {
  it('shows the account line, Import board, Labels, a divider and Log out', async () => {
    const { openMenu } = renderMenu()

    const menu = await openMenu()

    expect(menu.firstElementChild).toHaveTextContent(
      'Signed in as philipp@example.com',
    )
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Import board', 'Labels', 'Log out'])
    const divider = within(menu).getByRole('separator')
    expect(divider.nextElementSibling).toHaveTextContent('Log out')
  })

  it('starts with Import board while the email is unknown', async () => {
    const { openMenu } = renderMenu(null)

    const menu = await openMenu()

    expect(menu).not.toHaveTextContent('Signed in as')
    expect(menu.firstElementChild).toHaveTextContent('Import board')
  })

  it('opens the import dialog, which stays open after the menu closes', async () => {
    const { user, openMenu } = renderMenu()

    await openMenu()
    await user.click(screen.getByRole('menuitem', { name: 'Import board' }))

    expect(screen.queryByRole('menu')).toBeNull()
    expect(
      screen.getByRole('dialog', { name: 'Import board' }),
    ).toBeInTheDocument()
  })

  it('asks the app to open the labels page', async () => {
    const { user, openMenu, onOpenLabels } = renderMenu()

    await openMenu()
    await user.click(screen.getByRole('menuitem', { name: 'Labels' }))

    expect(onOpenLabels).toHaveBeenCalledOnce()
  })

  it('logs out without a confirmation', async () => {
    const { user, openMenu, onLogOut } = renderMenu()

    await openMenu()
    await user.click(screen.getByRole('menuitem', { name: 'Log out' }))

    expect(onLogOut).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
