import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient } from '@/core/api/queryClient'
import { AppBarSlotProvider, AppBarSlotTarget, ToastProvider } from '@/core/ui'
import {
  BoardListRoot,
  BoardsDataAccessProvider,
  createInMemoryBoardsDataAccess,
  NewBoardDialogProvider,
  sampleBoards,
  useBoardsChanged,
  useFindBoardNameByKey,
  type InMemoryBoardsDataAccess,
} from '@/features/boards'
import { useImportFlow, type ImportBoard } from '@/features/transfer'

class NoIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

const originalObserver = window.IntersectionObserver
beforeEach(() => {
  window.IntersectionObserver =
    NoIntersectionObserver as unknown as typeof IntersectionObserver
})
afterEach(() => {
  window.IntersectionObserver = originalObserver
})

function BoardListWithImport({ importBoard }: { importBoard: ImportBoard }) {
  const importAction = useImportFlow({
    importBoard,
    findBoardNameByKey: useFindBoardNameByKey(),
    onBoardsChanged: useBoardsChanged(),
  })
  return (
    <BoardListRoot
      renderBoardLink={() => <button type="button" />}
      onOpenLabels={vi.fn()}
      importAction={importAction}
      account={{ email: null, onLogOut: vi.fn() }}
    />
  )
}

function exportFile(key: string) {
  return new File(
    [
      JSON.stringify({
        format: 'cardigan.board',
        formatVersion: 1,
        board: { key },
      }),
    ],
    'board.json',
  )
}

function renderWithImport(
  dataAccess: InMemoryBoardsDataAccess,
  importBoard: ImportBoard,
) {
  const user = userEvent.setup()
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <BoardsDataAccessProvider dataAccess={dataAccess}>
        <ToastProvider closeLabel="Close">
          <AppBarSlotProvider>
            <AppBarSlotTarget />
            <NewBoardDialogProvider onBoardCreated={vi.fn()}>
              <BoardListWithImport importBoard={importBoard} />
            </NewBoardDialogProvider>
          </AppBarSlotProvider>
        </ToastProvider>
      </BoardsDataAccessProvider>
    </QueryClientProvider>,
  )
  const wide = within(screen.getByTestId('board-list-wide'))
  const importFile = async (key: string) => {
    await wide.findByText('Cardigan v1')
    await user.click(wide.getByRole('button', { name: 'Import' }))
    await screen.findByRole('dialog', { name: 'Import board' })
    await user.upload(
      document.querySelector<HTMLInputElement>('input[type="file"]')!,
      exportFile(key),
    )
  }
  return { wide, importFile }
}

describe('import from the board list', () => {
  it('reloads the board list after an import', async () => {
    const dataAccess = createInMemoryBoardsDataAccess(sampleBoards.slice(0, 6))
    const importBoard: ImportBoard = async () => {
      const board = await dataAccess.createBoard({
        name: 'Imported board',
        key: 'IMP',
      })
      return { ok: true, board }
    }
    const { wide, importFile } = renderWithImport(dataAccess, importBoard)

    await importFile('IMP')

    expect(await wide.findByText('Imported board')).toBeInTheDocument()
  })

  it('names the loaded board that already uses the key', async () => {
    const { importFile } = renderWithImport(
      createInMemoryBoardsDataAccess(sampleBoards.slice(0, 6)),
      async () => ({ ok: false, error: { kind: 'keyUsed' } }),
    )

    await importFile('CRD')

    expect(
      await screen.findByRole('dialog', { name: 'Choose a different key' }),
    ).toHaveTextContent('Your board “Cardigan v1” already uses the key CRD.')
  })
})
