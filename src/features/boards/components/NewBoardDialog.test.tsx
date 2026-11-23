import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient } from '@/core/api/queryClient'
import { BoardsTestProviders } from '../testing/BoardsTestProviders'
import {
  createInMemoryBoardsDataAccess,
  type InMemoryBoardsDataAccess,
} from '../testing/createInMemoryBoardsDataAccess'
import { installIntersectionObserverStub } from '../testing/intersectionObserverStub'
import { sampleBoards } from '../testing/sampleBoards'
import type { BoardSummary } from '../types'
import { BoardListRoot } from './BoardListScreen'
import { NewBoardDialogProvider } from './NewBoardDialogProvider'

let observer: ReturnType<typeof installIntersectionObserverStub>
beforeEach(() => {
  observer = installIntersectionObserverStub()
})
afterEach(() => observer.restore())

const sixBoards = sampleBoards.slice(0, 6)

function setup(
  dataAccess: InMemoryBoardsDataAccess = createInMemoryBoardsDataAccess(
    sixBoards,
  ),
) {
  const onBoardCreated = vi.fn<(board: BoardSummary) => void>()
  const createBoard = vi.spyOn(dataAccess, 'createBoard')
  const listBoards = vi.spyOn(dataAccess, 'listBoards')
  const user = userEvent.setup()
  render(
    <BoardsTestProviders
      queryClient={createTestQueryClient()}
      dataAccess={dataAccess}
    >
      <NewBoardDialogProvider onBoardCreated={onBoardCreated}>
        <BoardListRoot
          renderBoardLink={() => <button type="button" />}
          onOpenLabels={vi.fn()}
          importAction={{ open: vi.fn(), dialogs: null }}
          account={{ email: null, onLogOut: vi.fn() }}
        />
      </NewBoardDialogProvider>
    </BoardsTestProviders>,
  )
  const wide = () => within(screen.getByTestId('board-list-wide'))
  const dialog = () => screen.getByRole('dialog', { name: 'New board' })
  const nameField = () =>
    within(dialog()).getByRole('textbox', { name: 'Name' })
  const keyField = () => within(dialog()).getByRole('textbox', { name: 'Key' })
  const createButton = () =>
    within(dialog()).getByRole('button', { name: 'Create board' })
  const open = async () => {
    await user.click(wide().getByRole('button', { name: 'New board' }))
    return dialog()
  }
  const openWhenLoaded = async () => {
    await wide().findByText('Cardigan v1')
    return open()
  }
  const fill = async (name: string, key?: string) => {
    await user.type(nameField(), name)
    if (key !== undefined) {
      await user.clear(keyField())
      if (key) await user.type(keyField(), key)
    }
  }
  return {
    user,
    dataAccess,
    onBoardCreated,
    createBoard,
    listBoards,
    wide,
    dialog,
    nameField,
    keyField,
    createButton,
    open,
    openWhenLoaded,
    fill,
  }
}

describe('NewBoardDialog', () => {
  it('opens with the Name field focused, the empty-key hint and the columns note', async () => {
    const { openWhenLoaded, nameField } = setup()

    const dialog = await openWhenLoaded()

    expect(nameField()).toHaveFocus()
    expect(dialog).toHaveTextContent(
      '2–5 uppercase letters. The key can’t be changed later.',
    )
    expect(dialog).toHaveTextContent(
      'New boards start with the columns To do, In progress and Done.',
    )
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeEnabled()
  })

  describe('key prefill', () => {
    it('fills the key from the name and shows it in the hint', async () => {
      const { openWhenLoaded, fill, keyField, dialog } = setup()
      await openWhenLoaded()

      await fill('Garden irrigation')

      expect(keyField()).toHaveValue('GARD')
      expect(dialog()).toHaveTextContent(
        '2–5 uppercase letters. Card IDs will look like GARD-1. The key can’t be changed later.',
      )
    })

    it('leaves the key empty for a name with fewer than 2 letters', async () => {
      const { openWhenLoaded, fill, keyField } = setup()
      await openWhenLoaded()

      await fill('Q3 2026')

      expect(keyField()).toHaveValue('')
    })

    it('stops following the name once the key was edited', async () => {
      const { user, openWhenLoaded, fill, keyField, nameField } = setup()
      await openWhenLoaded()

      await fill('Garden', 'GI')
      await user.type(nameField(), ' irrigation')

      expect(keyField()).toHaveValue('GI')
    })

    it('starts over when the dialog opens again', async () => {
      const { user, openWhenLoaded, open, fill, keyField, nameField, dialog } =
        setup()
      await openWhenLoaded()
      await fill('Garden', 'GI')
      await user.click(within(dialog()).getByRole('button', { name: 'Cancel' }))

      await open()
      await user.type(nameField(), 'Raytracer two')

      expect(keyField()).toHaveValue('RAYT')
    })
  })

  describe('key input', () => {
    it('uppercases a–z as the user types', async () => {
      const { user, openWhenLoaded, keyField } = setup()
      await openWhenLoaded()

      await user.type(keyField(), 'crd')

      expect(keyField()).toHaveValue('CRD')
    })

    it('keeps other characters as typed', async () => {
      const { user, openWhenLoaded, keyField } = setup()
      await openWhenLoaded()

      await user.type(keyField(), 'cä')

      expect(keyField()).toHaveValue('Cä')
    })

    it('rejects a digit without sending', async () => {
      const { user, openWhenLoaded, fill, createButton, dialog, createBoard } =
        setup()
      await openWhenLoaded()

      await fill('Garden', 'CR1')
      await user.click(createButton())

      expect(dialog()).toHaveTextContent('Use only the letters A–Z.')
      expect(createBoard).not.toHaveBeenCalled()
    })

    it('replaces the hint with the error', async () => {
      const { user, openWhenLoaded, fill, createButton, dialog } = setup()
      await openWhenLoaded()

      await fill('Garden', 'C')
      await user.click(createButton())

      expect(dialog()).toHaveTextContent('Use at least 2 letters.')
      expect(dialog()).not.toHaveTextContent('2–5 uppercase letters.')
    })
  })

  describe('validation timing', () => {
    it('shows no error and keeps Create board enabled before the first submit', async () => {
      const { user, openWhenLoaded, fill, nameField, createButton, dialog } =
        setup()
      await openWhenLoaded()

      await fill('Garden')
      await user.clear(nameField())

      expect(dialog()).not.toHaveTextContent('Enter a name.')
      expect(createButton()).toBeEnabled()
    })

    it('shows errors on submit, disables Create board and updates while typing', async () => {
      const {
        user,
        openWhenLoaded,
        createButton,
        dialog,
        keyField,
        nameField,
      } = setup()
      await openWhenLoaded()

      await user.click(createButton())

      expect(dialog()).toHaveTextContent('Enter a name.')
      expect(dialog()).toHaveTextContent('Enter a key.')
      expect(createButton()).toBeDisabled()

      await user.type(nameField(), 'X')
      await user.type(keyField(), 'G')
      expect(dialog()).not.toHaveTextContent('Enter a name.')
      expect(dialog()).toHaveTextContent('Use at least 2 letters.')
      expect(createButton()).toBeDisabled()

      await user.type(keyField(), 'I')
      expect(dialog()).not.toHaveTextContent('Use at least 2 letters.')
      expect(createButton()).toBeEnabled()
    })
  })

  describe('name checks', () => {
    it('rejects a name of only spaces', async () => {
      const { user, openWhenLoaded, fill, createButton, dialog, createBoard } =
        setup()
      await openWhenLoaded()

      await fill('   ', 'GARD')
      await user.click(createButton())

      expect(dialog()).toHaveTextContent('Enter a name.')
      expect(createBoard).not.toHaveBeenCalled()
    })

    it('sends 100 letters with surrounding spaces trimmed', async () => {
      const {
        user,
        openWhenLoaded,
        nameField,
        keyField,
        createButton,
        createBoard,
      } = setup()
      await openWhenLoaded()
      const name = 'a'.repeat(100)

      await user.click(nameField())
      await user.paste(`  ${name}  `)
      await user.clear(keyField())
      await user.type(keyField(), 'LONG')
      await user.click(createButton())

      expect(createBoard).toHaveBeenCalledWith({ name, key: 'LONG' })
    })

    it('rejects 101 code points', async () => {
      const {
        user,
        openWhenLoaded,
        nameField,
        keyField,
        createButton,
        dialog,
      } = setup()
      await openWhenLoaded()

      await user.click(nameField())
      await user.paste('a'.repeat(101))
      await user.type(keyField(), 'LONG')
      await user.click(createButton())

      expect(dialog()).toHaveTextContent('Use at most 100 characters.')
    })

    it('rejects a pasted tab on submit', async () => {
      const {
        user,
        openWhenLoaded,
        nameField,
        keyField,
        createButton,
        dialog,
        createBoard,
      } = setup()
      await openWhenLoaded()

      await user.click(nameField())
      await user.paste('Road\tmap')
      await user.type(keyField(), 'ROAD')
      await user.click(createButton())

      expect(dialog()).toHaveTextContent(
        'Use a single line without control characters.',
      )
      expect(createBoard).not.toHaveBeenCalled()
    })

    it('drops a pasted line break', async () => {
      const { user, openWhenLoaded, nameField } = setup()
      await openWhenLoaded()

      await user.click(nameField())
      await user.paste('Road\nmap')

      expect(nameField()).toHaveValue('Roadmap')
    })
  })

  describe('local key clash', () => {
    it('rejects a key a loaded board uses without sending', async () => {
      const { user, openWhenLoaded, fill, createButton, dialog, createBoard } =
        setup()
      await openWhenLoaded()

      await fill('Another', 'CRD')
      await user.click(createButton())

      expect(dialog()).toHaveTextContent(
        'You already have a board with the key CRD.',
      )
      expect(createBoard).not.toHaveBeenCalled()
    })

    it('leaves the check to the server while the boards are loading', async () => {
      const dataAccess = createInMemoryBoardsDataAccess(sixBoards)
      dataAccess.holdNext('listBoards')
      const { user, open, fill, createButton, createBoard } = setup(dataAccess)
      await open()

      await fill('Another', 'CRD')
      await user.click(createButton())

      expect(createBoard).toHaveBeenCalledWith({ name: 'Another', key: 'CRD' })
    })

    it('accepts a key freed elsewhere after Refresh', async () => {
      const { user, wide, dataAccess, open, fill, createButton, createBoard } =
        setup()
      await wide().findByText('Cardigan v1')
      await act(() => dataAccess.deleteBoard(sixBoards[0]!.id))
      await user.click(wide().getByRole('button', { name: 'Refresh' }))
      await vi.waitFor(() =>
        expect(wide().queryByText('Cardigan v1')).toBeNull(),
      )

      await open()
      await fill('Cardigan again', 'CRD')
      await user.click(createButton())

      expect(createBoard).toHaveBeenCalledOnce()
    })
  })

  describe('saving', () => {
    it('shows the spinner, disables the fields and Cancel, and ignores Escape', async () => {
      const {
        user,
        dataAccess,
        openWhenLoaded,
        fill,
        createButton,
        dialog,
        nameField,
        keyField,
      } = setup()
      await openWhenLoaded()
      const release = dataAccess.holdNext('createBoard')

      await fill('Garden irrigation')
      await user.click(createButton())

      expect(createButton()).toHaveAttribute('aria-busy', 'true')
      expect(nameField()).toBeDisabled()
      expect(keyField()).toBeDisabled()
      expect(
        within(dialog()).getByRole('button', { name: 'Cancel' }),
      ).toBeDisabled()
      await user.keyboard('{Escape}')
      expect(dialog()).toBeInTheDocument()
      await act(async () => release())
    })
  })

  describe('result', () => {
    it('closes and asks the app to open the new board', async () => {
      const { user, openWhenLoaded, fill, createButton, onBoardCreated } =
        setup()
      await openWhenLoaded()

      await fill('Garden irrigation')
      await user.click(createButton())

      await vi.waitFor(() =>
        expect(screen.queryByRole('dialog', { name: 'New board' })).toBeNull(),
      )
      expect(onBoardCreated).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Garden irrigation', key: 'GARD' }),
      )
      expect(screen.queryByRole('status')).toBeNull()
    })

    it('shows a server name error under Name', async () => {
      const { user, dataAccess, openWhenLoaded, fill, createButton, dialog } =
        setup()
      await openWhenLoaded()
      dataAccess.failNext('createBoard', {
        kind: 'invalid',
        fields: [{ field: 'name', code: 'TOO_LONG', max: 100 }],
      })

      await fill('Garden irrigation')
      await user.click(createButton())

      expect(
        await within(dialog()).findByText('Use at most 100 characters.'),
      ).toBeInTheDocument()
    })

    it('shows the invalid-character message for an unknown name code', async () => {
      const { user, dataAccess, openWhenLoaded, fill, createButton, dialog } =
        setup()
      await openWhenLoaded()
      dataAccess.failNext('createBoard', {
        kind: 'invalid',
        fields: [{ field: 'name', code: 'NEW_CODE' }],
      })

      await fill('Garden irrigation')
      await user.click(createButton())

      expect(
        await within(dialog()).findByText(
          'Use a single line without control characters.',
        ),
      ).toBeInTheDocument()
    })

    it('shows the format message for an unknown key code', async () => {
      const { user, dataAccess, openWhenLoaded, fill, createButton, dialog } =
        setup()
      await openWhenLoaded()
      dataAccess.failNext('createBoard', {
        kind: 'invalid',
        fields: [{ field: 'key', code: 'NEW_CODE' }],
      })

      await fill('Garden irrigation')
      await user.click(createButton())

      expect(
        await within(dialog()).findByText('Use only the letters A–Z.'),
      ).toBeInTheDocument()
    })

    it('shows the failure toast for an invalid response without a field error', async () => {
      const { user, dataAccess, openWhenLoaded, fill, createButton, dialog } =
        setup()
      await openWhenLoaded()
      dataAccess.failNext('createBoard', { kind: 'invalid', fields: [] })

      await fill('Garden irrigation')
      await user.click(createButton())

      expect(
        await screen.findByText(
          'Couldn’t create the board. Check your connection and try again.',
        ),
      ).toBeInTheDocument()
      expect(dialog()).toBeInTheDocument()
    })

    it('shows no toast and does not reload when the session ended', async () => {
      const {
        user,
        dataAccess,
        openWhenLoaded,
        fill,
        createButton,
        listBoards,
        dialog,
      } = setup()
      await openWhenLoaded()
      listBoards.mockClear()
      dataAccess.failNext('createBoard', { kind: 'sessionEnded' })

      await fill('Garden irrigation')
      await user.click(createButton())

      await vi.waitFor(() =>
        expect(createButton()).not.toHaveAttribute('aria-busy'),
      )
      expect(screen.queryByText(/Couldn’t create/)).toBeNull()
      expect(listBoards).not.toHaveBeenCalled()
      expect(dialog()).toBeInTheDocument()
    })

    it('shows the toast, keeps the input, sends once and waits for the reload after a lost response', async () => {
      const {
        user,
        dataAccess,
        openWhenLoaded,
        fill,
        createButton,
        createBoard,
        nameField,
      } = setup()
      await openWhenLoaded()
      dataAccess.failNext('createBoard', { kind: 'other' })
      const release = dataAccess.holdNext('listBoards')

      await fill('Garden irrigation')
      await user.click(createButton())

      expect(
        await screen.findByText(
          'Couldn’t create the board. Check your connection and try again.',
        ),
      ).toBeInTheDocument()
      expect(nameField()).toHaveValue('Garden irrigation')
      expect(createButton()).toBeDisabled()
      await act(async () => release())
      await vi.waitFor(() => expect(createButton()).toBeEnabled())
      expect(createBoard).toHaveBeenCalledOnce()
    })

    it('shows the server clash under Key and reloads the boards', async () => {
      const {
        user,
        dataAccess,
        openWhenLoaded,
        fill,
        createButton,
        dialog,
        listBoards,
      } = setup()
      await openWhenLoaded()
      listBoards.mockClear()
      dataAccess.failNext('createBoard', {
        kind: 'invalid',
        fields: [{ field: 'key', code: 'ALREADY_USED' }],
      })

      await fill('Garden irrigation')
      await user.click(createButton())

      expect(
        await within(dialog()).findByText(
          'You already have a board with the key GARD.',
        ),
      ).toBeInTheDocument()
      await vi.waitFor(() => expect(listBoards).toHaveBeenCalledOnce())
    })

    it('finds a board created despite a lost response after the reload', async () => {
      const {
        user,
        dataAccess,
        openWhenLoaded,
        fill,
        createButton,
        dialog,
        createBoard,
      } = setup()
      await openWhenLoaded()
      dataAccess.applyThenFailNextCreate()

      await fill('Garden irrigation')
      await user.click(createButton())
      await screen.findByText(
        'Couldn’t create the board. Check your connection and try again.',
      )
      await vi.waitFor(() => expect(createButton()).toBeEnabled())
      await user.click(createButton())

      expect(dialog()).toHaveTextContent(
        'You already have a board with the key GARD.',
      )
      expect(createBoard).toHaveBeenCalledOnce()
    })
  })
})
