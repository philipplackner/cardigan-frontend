import { act, renderHook, screen, waitFor } from '@testing-library/react'
import { useSyncExternalStore, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { createTestQueryClient } from '@/core/api/queryClient'
import {
  createInMemoryBoardsDataAccess,
  type InMemoryBoardsDataAccess,
} from '../../testing/createInMemoryBoardsDataAccess'
import { boardViewKeys } from '../api/boardViewQueries'
import { BoardViewTestProviders } from '../testing/BoardViewTestProviders'
import {
  createInMemoryBoardViewDataAccess,
  type InMemoryBoardViewDataAccess,
} from '../testing/createInMemoryBoardViewDataAccess'
import { CARDIGAN_BOARD_ID } from '../testing/sampleBoardContent'
import type { BoardColumn } from '../types'
import { useBoardViewModel, type BoardViewAction } from './useBoardViewModel'

const RAYTRACER_BOARD_ID = '00000000-0000-4000-8000-000000000002'
const columnId = (n: number) =>
  `20000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const TO_DO = columnId(1)
const IN_PROGRESS = columnId(2)
const DONE = columnId(4)

const CARD_FAILED =
  "Couldn't add the card. Check your connection and try again."
const REFRESH_FAILED =
  "Couldn't refresh the board. Check your connection and try again."
const BOARD_GONE = 'This board no longer exists.'
const TO_DO_GONE = '“To do” no longer exists. The board was reloaded.'

/** Lets a test unmount the hook while the providers, and so the toasts, stay. */
function createGate() {
  let isOpen = true
  const listeners = new Set<() => void>()
  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    isOpen: () => isOpen,
    close() {
      isOpen = false
      listeners.forEach((listener) => listener())
    },
  }
}

type Gate = ReturnType<typeof createGate>

/** Collects the text of every node added to the page, so a toast that a later one replaced still counts. */
function recordAddedText() {
  const texts: string[] = []
  const observer = new MutationObserver((records) =>
    records.forEach((record) =>
      record.addedNodes.forEach((node) => texts.push(node.textContent ?? '')),
    ),
  )
  observer.observe(document.body, { childList: true, subtree: true })
  return () => {
    observer.disconnect()
    return texts.join('\n')
  }
}

function GateView({ gate, children }: { gate: Gate; children: ReactNode }) {
  return useSyncExternalStore(gate.subscribe, gate.isOpen) ? children : null
}

type Options = {
  boardId?: string
  prepare?: (fakes: {
    boards: InMemoryBoardsDataAccess
    boardView: InMemoryBoardViewDataAccess
  }) => void
  withBoardList?: boolean
}

async function setup({
  boardId = CARDIGAN_BOARD_ID,
  prepare,
  withBoardList = false,
}: Options = {}) {
  const boards = createInMemoryBoardsDataAccess()
  const boardView = createInMemoryBoardViewDataAccess(boards)
  const queryClient = createTestQueryClient()
  if (withBoardList) {
    queryClient.setQueryData(['boards'], await boards.listBoards())
  }
  prepare?.({ boards, boardView })
  const callbacks = {
    onOpenCard: vi.fn(),
    onExport: vi.fn(),
    onBack: vi.fn(),
    onBoardGone: vi.fn(),
    onNotFound: vi.fn(),
  }
  const gate = createGate()
  const { result } = renderHook(() => useBoardViewModel(boardId, callbacks), {
    wrapper: ({ children }) => (
      <BoardViewTestProviders
        queryClient={queryClient}
        boards={boards}
        boardView={boardView}
      >
        <GateView gate={gate}>{children}</GateView>
      </BoardViewTestProviders>
    ),
  })
  const state = () => result.current.state
  const send = (action: BoardViewAction) =>
    act(() => result.current.onAction(action))
  const flush = () =>
    act(() => new Promise((resolve) => setTimeout(resolve, 20)))
  const ready = () => waitFor(() => expect(state().status.type).toBe('ready'))
  const columns = (): readonly BoardColumn[] => {
    const status = state().status
    return status.type === 'ready' ? status.board.columns : []
  }
  const openQuickAdd = async (column: string, text: string) => {
    await send({
      type: 'inlineOpen',
      target: { kind: 'quickAdd', columnId: column },
    })
    await send({ type: 'quickAddChange', text })
  }
  const openAddColumn = async (text: string) => {
    await send({ type: 'inlineOpen', target: { kind: 'addColumn' } })
    await send({ type: 'addColumnChange', text })
  }
  return {
    result,
    state,
    send,
    flush,
    ready,
    columns,
    openQuickAdd,
    openAddColumn,
    unmount: () => act(() => gate.close()),
    boards,
    boardView,
    queryClient,
    ...callbacks,
  }
}

const removeColumn =
  (id: string) =>
  (columns: BoardColumn[]): BoardColumn[] =>
    columns.filter((column) => column.id !== id)

const tooLong = (max: number) => ({
  kind: 'invalid' as const,
  fields: [{ field: 'name' as const, code: 'TOO_LONG', max }],
})

describe('useBoardViewModel', () => {
  describe('loading', () => {
    it('is loading, not failed, while the first load runs', async () => {
      let release = () => {}
      const { state, ready, onNotFound } = await setup({
        prepare: ({ boardView }) => {
          release = boardView.holdNext('loadBoard')
        },
      })

      expect(state().status).toEqual({ type: 'loading' })
      await act(async () => release())
      await ready()
      expect(onNotFound).not.toHaveBeenCalled()
    })

    it('shows the error state without leaving when the first load fails for another reason', async () => {
      const { state, onNotFound } = await setup({
        prepare: ({ boardView }) =>
          boardView.failNext('loadBoard', { kind: 'other' }),
      })

      await waitFor(() => expect(state().status).toEqual({ type: 'error' }))
      expect(onNotFound).not.toHaveBeenCalled()
    })

    it('is loading again while Try again runs after a failed load', async () => {
      const { state, send, ready, boardView } = await setup({
        prepare: ({ boardView: fake }) =>
          fake.failNext('loadBoard', { kind: 'other' }),
      })
      await waitFor(() => expect(state().status.type).toBe('error'))
      const release = boardView.holdNext('loadBoard')

      await send({ type: 'tryAgain' })

      await waitFor(() => expect(state().status).toEqual({ type: 'loading' }))
      await act(async () => release())
      await ready()
    })

    it('never loads the board list itself', async () => {
      const { ready, flush, boards } = await setup({
        prepare: ({ boards: fake }) => vi.spyOn(fake, 'listBoards'),
      })
      await ready()
      await flush()

      expect(boards.listBoards).not.toHaveBeenCalled()
    })

    it('takes the header of its own board from the board list while loading', async () => {
      const { state } = await setup({
        boardId: RAYTRACER_BOARD_ID,
        withBoardList: true,
        prepare: ({ boardView }) => {
          boardView.holdNext('loadBoard')
        },
      })

      expect(state().header).toEqual({ name: 'Raytracer', key: 'RAY' })
    })

    it('counts the cards of all columns in the board summary', async () => {
      const { result, ready } = await setup()
      await ready()

      expect(result.current.boardSummary).toEqual({
        id: CARDIGAN_BOARD_ID,
        name: 'Cardigan v1',
        key: 'CRD',
        cardCount: 12,
        updatedAt: new Date(0),
      })
    })

    it('takes the summary update time from the board list', async () => {
      const { result, ready } = await setup({ withBoardList: true })
      await ready()

      expect(result.current.boardSummary?.updatedAt).toEqual(
        new Date('2026-10-14T13:00:00+02:00'),
      )
    })
  })

  describe('refresh', () => {
    it('loads once when Refresh is pressed again while it loads', async () => {
      const { state, send, ready, flush, boardView } = await setup()
      await ready()
      const loadBoard = vi.spyOn(boardView, 'loadBoard')
      const release = boardView.holdNext('loadBoard')

      await send({ type: 'refresh' })
      await waitFor(() => expect(state().isRefreshing).toBe(true))
      await send({ type: 'refresh' })
      await act(async () => release())
      await flush()

      expect(loadBoard).toHaveBeenCalledTimes(1)
    })

    it('shows no toast after a refresh that worked', async () => {
      const { send, ready, flush, boardView } = await setup()
      await ready()
      const loadBoard = vi.spyOn(boardView, 'loadBoard')

      await send({ type: 'refresh' })
      await waitFor(() => expect(loadBoard).toHaveBeenCalled())
      await flush()

      expect(screen.queryByRole('status')).toBeNull()
      expect(screen.queryByText(REFRESH_FAILED)).toBeNull()
    })

    it('forgets a refresh that worked, so a later failed reload shows no refresh toast', async () => {
      const { state, send, ready, flush, boardView, openQuickAdd } =
        await setup()
      await ready()
      const release = boardView.holdNext('loadBoard')
      await send({ type: 'refresh' })
      await waitFor(() => expect(state().isRefreshing).toBe(true))
      await act(async () => release())
      await flush()
      await openQuickAdd(TO_DO, 'Write docs')
      boardView.failNext('createCard', { kind: 'other' })
      boardView.failNext('loadBoard', { kind: 'other' })

      await send({ type: 'quickAddSubmit' })
      await flush()

      expect(screen.getByText(CARD_FAILED)).toBeInTheDocument()
    })

    it('shows the refresh toast when a slow refresh fails', async () => {
      const { state, send, ready, boardView } = await setup()
      await ready()
      const release = boardView.holdNext('loadBoard')
      await send({ type: 'refresh' })
      await waitFor(() => expect(state().isRefreshing).toBe(true))
      boardView.failNext('loadBoard', { kind: 'other' })

      await act(async () => release())

      expect(await screen.findByText(REFRESH_FAILED)).toBeInTheDocument()
      expect(state().status.type).toBe('ready')
    })

    it('shows the refresh toast once for a failed refresh, not again for a later failed reload', async () => {
      const { send, ready, flush, boardView, openQuickAdd } = await setup()
      await ready()
      boardView.failNext('loadBoard', { kind: 'other' })
      await send({ type: 'refresh' })
      expect(await screen.findByText(REFRESH_FAILED)).toBeInTheDocument()
      await openQuickAdd(TO_DO, 'Write docs')
      boardView.failNext('createCard', { kind: 'other' })
      boardView.failNext('loadBoard', { kind: 'other' })

      await send({ type: 'quickAddSubmit' })
      await flush()

      expect(screen.getByText(CARD_FAILED)).toBeInTheDocument()
    })
  })

  describe('board gone', () => {
    it('stops loading and drops only its own cache entry when a refresh finds no board', async () => {
      const {
        state,
        send,
        ready,
        flush,
        boards,
        boardView,
        queryClient,
        onBoardGone,
        onNotFound,
      } = await setup({ withBoardList: true })
      await ready()
      await act(() => boards.deleteBoard(CARDIGAN_BOARD_ID))
      const loadBoard = vi.spyOn(boardView, 'loadBoard')

      await send({ type: 'refresh' })
      await waitFor(() => expect(onBoardGone).toHaveBeenCalledTimes(1))
      await flush()

      expect(loadBoard).toHaveBeenCalledTimes(1)
      expect(state().status).toEqual({ type: 'loading' })
      expect(
        queryClient.getQueryData(boardViewKeys.detail(CARDIGAN_BOARD_ID)),
      ).toBeUndefined()
      expect(queryClient.getQueryData(['boards'])).toBeDefined()
      expect(onNotFound).not.toHaveBeenCalled()
    })

    it('ignores a deleted board result that arrives after unmount', async () => {
      const { send, ready, unmount, onBoardGone } = await setup()
      await ready()
      await unmount()

      await send({ type: 'boardDialogClose', result: { kind: 'deleted' } })

      expect(onBoardGone).not.toHaveBeenCalled()
    })
  })

  describe('columns changed elsewhere', () => {
    it('drops the quick add of a column another device removed', async () => {
      const { state, send, ready, boardView, openQuickAdd } = await setup()
      await ready()
      await openQuickAdd(TO_DO, '')
      act(() => boardView.changeBoard(CARDIGAN_BOARD_ID, removeColumn(TO_DO)))

      await send({ type: 'refresh' })

      await waitFor(() => expect(state().ui.quickAdd).toBeNull())
    })

    it('keeps the quick add when another device adds a column', async () => {
      const { state, send, ready, columns, boardView, openQuickAdd } =
        await setup()
      await ready()
      await openQuickAdd(TO_DO, 'Write docs')
      act(() =>
        boardView.changeBoard(CARDIGAN_BOARD_ID, (current) => [
          ...current,
          { id: 'blocked', name: 'Blocked', position: 4, cards: [] },
        ]),
      )

      await send({ type: 'refresh' })

      await waitFor(() => expect(columns()).toHaveLength(5))
      expect(state().ui.quickAdd).toEqual({
        columnId: TO_DO,
        text: 'Write docs',
        submitted: false,
      })
    })
  })

  describe('failed changes', () => {
    it('reloads, then says the column is gone when the card had no column', async () => {
      const { send, ready, columns, boardView, openQuickAdd } = await setup()
      await ready()
      await openQuickAdd(TO_DO, 'Write docs')
      boardView.changeBoard(CARDIGAN_BOARD_ID, removeColumn(TO_DO))

      await send({ type: 'quickAddSubmit' })

      expect(await screen.findByText(TO_DO_GONE)).toBeInTheDocument()
      expect(columns()).toHaveLength(3)
    })

    it('says the column is gone even when the reload fails', async () => {
      const { send, ready, boardView, openQuickAdd } = await setup()
      await ready()
      await openQuickAdd(TO_DO, 'Write docs')
      boardView.failNext('createCard', { kind: 'notFound' })
      boardView.failNext('loadBoard', { kind: 'other' })

      await send({ type: 'quickAddSubmit' })

      expect(await screen.findByText(TO_DO_GONE)).toBeInTheDocument()
    })

    it('leaves with the board toast, not the column toast, when the whole board is gone', async () => {
      const { send, ready, flush, boards, openQuickAdd, onBoardGone } =
        await setup()
      await ready()
      await openQuickAdd(TO_DO, 'Write docs')
      await act(() => boards.deleteBoard(CARDIGAN_BOARD_ID))
      const addedText = recordAddedText()

      await send({ type: 'quickAddSubmit' })
      await waitFor(() => expect(onBoardGone).toHaveBeenCalledTimes(1))
      await flush()

      expect(screen.getByText(BOARD_GONE)).toBeInTheDocument()
      expect(addedText()).not.toContain(TO_DO_GONE)
    })

    it('shows no toast and does not reload when a change fails after unmount', async () => {
      const { send, ready, flush, boardView, openQuickAdd, unmount } =
        await setup()
      await ready()
      await openQuickAdd(TO_DO, 'Write docs')
      const loadBoard = vi.spyOn(boardView, 'loadBoard')
      const release = boardView.holdNext('createCard')
      boardView.failNext('createCard', { kind: 'other' })
      await send({ type: 'quickAddSubmit' })

      await unmount()
      await act(async () => release())
      await flush()

      expect(screen.queryByText(CARD_FAILED)).toBeNull()
      expect(loadBoard).not.toHaveBeenCalled()
    })

    it('shows no column toast when the reload ends after unmount', async () => {
      const { send, ready, flush, boardView, openQuickAdd, unmount } =
        await setup()
      await ready()
      await openQuickAdd(TO_DO, 'Write docs')
      boardView.failNext('createCard', { kind: 'notFound' })
      const loadBoard = vi.spyOn(boardView, 'loadBoard')
      const release = boardView.holdNext('loadBoard')
      await send({ type: 'quickAddSubmit' })
      await waitFor(() => expect(loadBoard).toHaveBeenCalled())

      await unmount()
      await act(async () => release())
      await flush()

      expect(screen.queryByText(TO_DO_GONE)).toBeNull()
    })

    it('does not reload after a failed rename', async () => {
      const { result, send, ready, flush, boardView } = await setup()
      await ready()
      await send({
        type: 'dialogOpen',
        dialog: { kind: 'renameColumn', columnId: TO_DO },
      })
      const loadBoard = vi.spyOn(boardView, 'loadBoard')
      boardView.failNext('renameColumn', { kind: 'other' })

      await act(() => result.current.onRenameColumn('Backlog'))
      await flush()

      expect(
        screen.getByText(
          "Couldn't rename “To do”. Check your connection and try again.",
        ),
      ).toBeInTheDocument()
      expect(loadBoard).not.toHaveBeenCalled()
    })
  })

  describe('quick add', () => {
    it('ignores a submit while the board loads', async () => {
      const { send, flush, boardView } = await setup({
        prepare: ({ boardView: fake }) => {
          fake.holdNext('loadBoard')
          vi.spyOn(fake, 'createCard')
        },
      })

      await send({ type: 'quickAddSubmit' })
      await flush()

      expect(boardView.createCard).not.toHaveBeenCalled()
    })

    it('ignores a submit without an open quick add', async () => {
      const { send, ready, flush, boardView } = await setup()
      await ready()
      const createCard = vi.spyOn(boardView, 'createCard')

      await send({ type: 'quickAddSubmit' })
      await flush()

      expect(createCard).not.toHaveBeenCalled()
    })

    it('ignores a submit for a column that is not on the board', async () => {
      const { state, send, ready, flush, boardView, openQuickAdd } =
        await setup()
      await ready()
      await openQuickAdd('missing', 'Write docs')
      const createCard = vi.spyOn(boardView, 'createCard')

      await send({ type: 'quickAddSubmit' })
      await flush()

      expect(createCard).not.toHaveBeenCalled()
      expect(state().ui.quickAdd?.submitted).toBe(false)
    })

    it('sends one card when Enter is pressed twice while it saves', async () => {
      const { send, ready, flush, columns, boardView, openQuickAdd } =
        await setup()
      await ready()
      await openQuickAdd(TO_DO, 'Write docs')
      const createCard = vi.spyOn(boardView, 'createCard')
      const release = boardView.holdNext('createCard')

      await send({ type: 'quickAddSubmit' })
      await send({ type: 'quickAddSubmit' })
      await act(async () => release())
      await flush()

      expect(createCard).toHaveBeenCalledTimes(1)
      expect(columns()[0]?.cards).toHaveLength(5)
    })

    it('ignores a blank title without marking the form submitted', async () => {
      const { state, send, ready, flush, boardView, openQuickAdd } =
        await setup()
      await ready()
      await openQuickAdd(TO_DO, ' \n ')
      const createCard = vi.spyOn(boardView, 'createCard')

      await send({ type: 'quickAddSubmit' })
      await flush()

      expect(state().ui.quickAdd?.submitted).toBe(false)
      expect(createCard).not.toHaveBeenCalled()
    })

    it('shows the limit the server sends in its field error', async () => {
      const { state, send, ready, boardView, openQuickAdd } = await setup()
      await ready()
      await openQuickAdd(TO_DO, 'Write docs')
      boardView.failNext('createCard', {
        kind: 'invalid',
        fields: [{ field: 'title', code: 'TOO_LONG', max: 150 }],
      })

      await send({ type: 'quickAddSubmit' })

      await waitFor(() =>
        expect(state().quickAddError).toBe('Use at most 150 characters.'),
      )
    })

    it('shows no title error after a valid title failed to save', async () => {
      const { state, send, ready, boardView, openQuickAdd } = await setup()
      await ready()
      await openQuickAdd(TO_DO, 'Write docs')
      boardView.failNext('createCard', { kind: 'other' })

      await send({ type: 'quickAddSubmit' })
      await screen.findByText(CARD_FAILED)

      expect(state().ui.quickAdd?.submitted).toBe(true)
      expect(state().quickAddError).toBeUndefined()
    })

    it('hides the title error when the submitted title is cleared', async () => {
      const { state, send, ready, openQuickAdd } = await setup()
      await ready()
      await openQuickAdd(TO_DO, 'x'.repeat(201))
      await send({ type: 'quickAddSubmit' })
      expect(state().quickAddError).toBe('Use at most 200 characters.')

      await send({ type: 'quickAddChange', text: '' })

      expect(state().quickAddError).toBeUndefined()
    })

    it.each<[string, BoardViewAction]>([
      ['typing', { type: 'quickAddChange', text: 'Write the docs' }],
      [
        'refocusing the form',
        { type: 'inlineOpen', target: { kind: 'quickAdd', columnId: TO_DO } },
      ],
      ['closing the form', { type: 'inlineClose' }],
    ])('clears the server error on %s', async (_, action) => {
      const { state, send, ready, boardView, openQuickAdd } = await setup()
      await ready()
      await openQuickAdd(TO_DO, 'Write docs')
      boardView.failNext('createCard', {
        kind: 'invalid',
        fields: [{ field: 'title', code: 'INVALID_CHARACTER' }],
      })
      await send({ type: 'quickAddSubmit' })
      await waitFor(() => expect(state().quickAddError).toBeDefined())

      await send(action)

      expect(state().quickAddError).toBeUndefined()
    })

    it('drops a late server error when a click outside closes the emptied form', async () => {
      const { state, send, ready, flush, boardView, openQuickAdd } =
        await setup()
      await ready()
      await openQuickAdd(TO_DO, 'Write docs')
      const release = boardView.holdNext('createCard')
      boardView.failNext('createCard', {
        kind: 'invalid',
        fields: [{ field: 'title', code: 'INVALID_CHARACTER' }],
      })
      await send({ type: 'quickAddSubmit' })
      await send({ type: 'quickAddChange', text: '' })
      await act(async () => release())
      await flush()
      expect(state().quickAddError).toBeDefined()

      await send({ type: 'inlineOutside' })

      expect(state().ui.quickAdd).toBeNull()
      expect(state().quickAddError).toBeUndefined()
    })

    it('ignores opening another form while one saves', async () => {
      const { state, send, ready, flush, boardView, openQuickAdd } =
        await setup()
      await ready()
      await openQuickAdd(TO_DO, 'Write docs')
      const release = boardView.holdNext('createCard')
      await send({ type: 'quickAddSubmit' })
      await waitFor(() => expect(state().isInlineSaving).toBe(true))

      await send({ type: 'inlineOpen', target: { kind: 'addColumn' } })

      expect(state().ui.addColumn).toBeNull()
      expect(state().ui.dialog).toBeNull()
      expect(state().ui.quickAdd?.columnId).toBe(TO_DO)
      await act(async () => release())
      await flush()
    })

    it('ignores a click outside when no form is open', async () => {
      const { state, send, ready } = await setup()
      await ready()
      const before = state().ui

      await send({ type: 'inlineOutside' })

      expect(state().ui).toBe(before)
    })
  })

  describe('add column', () => {
    it('ignores a submit without an open add column form', async () => {
      const { send, ready, flush, boardView } = await setup()
      await ready()
      const createColumn = vi.spyOn(boardView, 'createColumn')

      await send({ type: 'addColumnSubmit' })
      await flush()

      expect(createColumn).not.toHaveBeenCalled()
    })

    it('sends one column when submitted twice while it saves', async () => {
      const { send, ready, flush, boardView, openAddColumn } = await setup()
      await ready()
      await openAddColumn('Blocked')
      const createColumn = vi.spyOn(boardView, 'createColumn')
      const release = boardView.holdNext('createColumn')

      await send({ type: 'addColumnSubmit' })
      await send({ type: 'addColumnSubmit' })
      await act(async () => release())
      await flush()

      expect(createColumn).toHaveBeenCalledTimes(1)
    })

    it('adds a second column right after the first one saved', async () => {
      const { send, ready, flush, columns, openAddColumn } = await setup()
      await ready()
      await openAddColumn('Blocked')
      await send({ type: 'addColumnSubmit' })
      await flush()

      await openAddColumn('Archive')
      await send({ type: 'addColumnSubmit' })
      await flush()

      expect(columns().map((column) => column.name)).toEqual([
        'To do',
        'In progress',
        'Review',
        'Done',
        'Blocked',
        'Archive',
      ])
    })

    it('clears the server error on typing', async () => {
      const { state, send, ready, boardView, openAddColumn } = await setup()
      await ready()
      await openAddColumn('Blocked')
      boardView.failNext('createColumn', tooLong(20))
      await send({ type: 'addColumnSubmit' })
      await waitFor(() => expect(state().addColumnError).toBeDefined())

      await send({ type: 'addColumnChange', text: 'Blocked by' })

      expect(state().addColumnError).toBeUndefined()
    })

    it('shows the limit the server sends in its field error', async () => {
      const { state, send, ready, boardView, openAddColumn } = await setup()
      await ready()
      await openAddColumn('Blocked')
      boardView.failNext('createColumn', tooLong(20))

      await send({ type: 'addColumnSubmit' })

      await waitFor(() =>
        expect(state().addColumnError).toBe('Use at most 20 characters.'),
      )
    })
  })

  describe('move column', () => {
    it('ignores a move while the board loads', async () => {
      const { send, flush, boardView } = await setup({
        prepare: ({ boardView: fake }) => {
          fake.holdNext('loadBoard')
          vi.spyOn(fake, 'moveColumn')
        },
      })

      await send({ type: 'moveColumn', columnId: TO_DO, direction: 'right' })
      await flush()

      expect(boardView.moveColumn).not.toHaveBeenCalled()
    })

    it('ignores a move of a column that is not on the board', async () => {
      const { send, ready, flush, boardView } = await setup()
      await ready()
      const moveColumn = vi.spyOn(boardView, 'moveColumn')

      await send({
        type: 'moveColumn',
        columnId: 'missing',
        direction: 'right',
      })
      await flush()

      expect(moveColumn).not.toHaveBeenCalled()
    })

    it('ignores moves past either end', async () => {
      const { send, ready, flush, boardView } = await setup()
      await ready()
      const moveColumn = vi.spyOn(boardView, 'moveColumn')

      await send({ type: 'moveColumn', columnId: TO_DO, direction: 'left' })
      await send({ type: 'moveColumn', columnId: DONE, direction: 'right' })
      await flush()

      expect(moveColumn).not.toHaveBeenCalled()
    })

    it('moves the second column to the first position without reloading', async () => {
      const { send, ready, flush, columns, boardView } = await setup()
      await ready()
      const moveColumn = vi.spyOn(boardView, 'moveColumn')
      const loadBoard = vi.spyOn(boardView, 'loadBoard')

      await send({
        type: 'moveColumn',
        columnId: IN_PROGRESS,
        direction: 'left',
      })
      await flush()

      expect(moveColumn).toHaveBeenCalledWith(CARDIGAN_BOARD_ID, IN_PROGRESS, 0)
      expect(columns()[0]?.id).toBe(IN_PROGRESS)
      expect(loadBoard).not.toHaveBeenCalled()
    })

    it('runs one move at a time and allows the next one afterwards', async () => {
      const { state, send, ready, flush, boardView } = await setup()
      await ready()
      const moveColumn = vi.spyOn(boardView, 'moveColumn')
      const release = boardView.holdNext('moveColumn')

      await send({ type: 'moveColumn', columnId: TO_DO, direction: 'right' })
      await send({ type: 'moveColumn', columnId: DONE, direction: 'left' })
      expect(state().ui.movingColumnId).toBe(TO_DO)
      await act(async () => release())
      await flush()
      expect(moveColumn).toHaveBeenCalledTimes(1)
      expect(state().ui.movingColumnId).toBeNull()

      await send({ type: 'moveColumn', columnId: DONE, direction: 'left' })
      await flush()

      expect(moveColumn).toHaveBeenCalledTimes(2)
    })
  })

  describe('rename column', () => {
    it('renames nothing while the board loads', async () => {
      const { result, send, boardView } = await setup({
        prepare: ({ boardView: fake }) => {
          fake.holdNext('loadBoard')
          vi.spyOn(fake, 'renameColumn')
        },
      })
      await send({
        type: 'dialogOpen',
        dialog: { kind: 'renameColumn', columnId: TO_DO },
      })

      const error = await act(() => result.current.onRenameColumn('Backlog'))

      expect(error).toBeUndefined()
      expect(boardView.renameColumn).not.toHaveBeenCalled()
    })

    it.each<[string, BoardViewAction | null]>([
      ['no dialog', null],
      [
        'the delete dialog',
        {
          type: 'dialogOpen',
          dialog: { kind: 'deleteColumn', columnId: TO_DO },
        },
      ],
      [
        'a rename dialog of a missing column',
        {
          type: 'dialogOpen',
          dialog: { kind: 'renameColumn', columnId: 'missing' },
        },
      ],
    ])('renames nothing with %s open', async (_, open) => {
      const { result, send, ready, boardView } = await setup()
      await ready()
      if (open) await send(open)
      const renameColumn = vi.spyOn(boardView, 'renameColumn')

      const error = await act(() => result.current.onRenameColumn('Backlog'))

      expect(error).toBeUndefined()
      expect(renameColumn).not.toHaveBeenCalled()
    })

    it('closes the dialog after a rename', async () => {
      const { result, state, send, ready, columns } = await setup()
      await ready()
      await send({
        type: 'dialogOpen',
        dialog: { kind: 'renameColumn', columnId: TO_DO },
      })

      await act(() => result.current.onRenameColumn('Backlog'))

      expect(state().ui.dialog).toBeNull()
      expect(columns()[0]?.name).toBe('Backlog')
    })

    it('resolves with the limit the server sends in its field error', async () => {
      const { result, send, ready, boardView } = await setup()
      await ready()
      await send({
        type: 'dialogOpen',
        dialog: { kind: 'renameColumn', columnId: TO_DO },
      })
      boardView.failNext('renameColumn', tooLong(25))

      const error = await act(() => result.current.onRenameColumn('Backlog'))

      expect(error).toBe('Use at most 25 characters.')
    })
  })

  describe('delete column', () => {
    it('ignores a confirm while the board loads', async () => {
      const { send, flush, boardView } = await setup({
        prepare: ({ boardView: fake }) => {
          fake.holdNext('loadBoard')
          vi.spyOn(fake, 'deleteColumn')
        },
      })
      await send({
        type: 'dialogOpen',
        dialog: { kind: 'deleteColumn', columnId: TO_DO },
      })

      await send({ type: 'deleteColumnConfirm' })
      await flush()

      expect(boardView.deleteColumn).not.toHaveBeenCalled()
    })

    it.each<[string, BoardViewAction | null]>([
      ['no dialog', null],
      [
        'the rename dialog',
        {
          type: 'dialogOpen',
          dialog: { kind: 'renameColumn', columnId: TO_DO },
        },
      ],
      [
        'a delete dialog of a missing column',
        {
          type: 'dialogOpen',
          dialog: { kind: 'deleteColumn', columnId: 'missing' },
        },
      ],
    ])('deletes nothing with %s open', async (_, open) => {
      const { send, ready, flush, boardView } = await setup()
      await ready()
      if (open) await send(open)
      const deleteColumn = vi.spyOn(boardView, 'deleteColumn')

      await send({ type: 'deleteColumnConfirm' })
      await flush()

      expect(deleteColumn).not.toHaveBeenCalled()
    })

    it('deletes once when confirmed twice', async () => {
      const { state, send, ready, flush, boardView } = await setup()
      await ready()
      await send({
        type: 'dialogOpen',
        dialog: { kind: 'deleteColumn', columnId: TO_DO },
      })
      const deleteColumn = vi.spyOn(boardView, 'deleteColumn')
      const release = boardView.holdNext('deleteColumn')

      await send({ type: 'deleteColumnConfirm' })
      await waitFor(() => expect(state().isDeletingColumn).toBe(true))
      await send({ type: 'deleteColumnConfirm' })
      await act(async () => release())
      await flush()

      expect(deleteColumn).toHaveBeenCalledTimes(1)
    })

    it.each([
      [TO_DO, { kind: 'columnMenu', columnId: IN_PROGRESS }],
      [DONE, { kind: 'addColumnButton' }],
    ])(
      'closes the dialog after deleting %s and focuses what follows',
      async (deleted, focus) => {
        const { state, send, ready, flush } = await setup()
        await ready()
        await send({
          type: 'dialogOpen',
          dialog: { kind: 'deleteColumn', columnId: deleted },
        })

        await send({ type: 'deleteColumnConfirm' })
        await flush()

        expect(state().ui.dialog).toBeNull()
        expect(state().ui.focusRequest?.target).toEqual(focus)
      },
    )
  })

  describe('export', () => {
    it('exports only a loaded board', async () => {
      let release = () => {}
      const { send, ready, onExport } = await setup({
        prepare: ({ boardView }) => {
          release = boardView.holdNext('loadBoard')
        },
      })

      await send({ type: 'export' })
      expect(onExport).not.toHaveBeenCalled()
      await act(async () => release())
      await ready()
      await send({ type: 'export' })

      expect(onExport).toHaveBeenCalledExactlyOnceWith({
        id: CARDIGAN_BOARD_ID,
        name: 'Cardigan v1',
      })
    })
  })
})
