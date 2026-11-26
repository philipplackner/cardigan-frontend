import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { createTestQueryClient } from '@/core/api/queryClient'
import { boardsKeys, boardsQueryOptions } from '../../api/boardsQueries'
import { BoardsDataAccessProvider } from '../../api/BoardsDataAccessProvider'
import { createInMemoryBoardsDataAccess } from '../../testing/createInMemoryBoardsDataAccess'
import { createInMemoryBoardViewDataAccess } from '../testing/createInMemoryBoardViewDataAccess'
import {
  CARDIGAN_BOARD_ID,
  cardiganColumns,
} from '../testing/sampleBoardContent'
import { BoardViewDataAccessProvider } from './BoardViewDataAccessProvider'
import {
  boardViewErrorOf,
  boardViewKeys,
  boardViewQueryOptions,
  useBoardDetail,
  useCreateCard,
  useCreateColumn,
  useDeleteColumn,
  useMoveColumn,
  useRenameColumn,
} from './boardViewQueries'

const firstColumnId = cardiganColumns[0]!.id

function setup() {
  const queryClient = createTestQueryClient()
  const boards = createInMemoryBoardsDataAccess()
  const dataAccess = createInMemoryBoardViewDataAccess(boards)
  const loadBoard = dataAccess.loadBoard
  let loads = 0
  dataAccess.loadBoard = (boardId) => {
    loads++
    return loadBoard(boardId)
  }
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BoardsDataAccessProvider dataAccess={boards}>
        <BoardViewDataAccessProvider dataAccess={dataAccess}>
          {children}
        </BoardViewDataAccessProvider>
      </BoardsDataAccessProvider>
    </QueryClientProvider>
  )
  return {
    queryClient,
    boards,
    dataAccess,
    wrapper,
    loads: () => loads,
  }
}

describe('boardViewErrorOf', () => {
  it('counts an error that is not a BoardViewError as other', () => {
    expect(boardViewErrorOf(new TypeError('Failed to fetch'))).toEqual({
      kind: 'other',
    })
  })
})

describe('useBoardDetail', () => {
  it('loads the board unless it is disabled', async () => {
    const { wrapper } = setup()

    const { result } = renderHook(() => useBoardDetail(CARDIGAN_BOARD_ID), {
      wrapper,
    })

    await waitFor(() => expect(result.current.data?.id).toBe(CARDIGAN_BOARD_ID))
  })
})

describe('board view mutations', () => {
  it('leave the cache empty when it was cleared while a create ran', async () => {
    const { queryClient, dataAccess, wrapper } = setup()
    const board = await queryClient.fetchQuery(
      boardViewQueryOptions(dataAccess, CARDIGAN_BOARD_ID),
    )
    const { result } = renderHook(() => useCreateCard(), { wrapper })
    const release = dataAccess.holdNext('createCard')

    act(() =>
      result.current.mutate({
        boardId: board.id,
        columnId: board.columns[0]!.id,
        title: 'Write docs',
      }),
    )
    queryClient.clear()
    await act(async () => release())

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(
      queryClient.getQueryData(boardViewKeys.detail(CARDIGAN_BOARD_ID)),
    ).toBeUndefined()
  })

  const target = { boardId: CARDIGAN_BOARD_ID, columnId: firstColumnId }
  it.each<[string, () => () => Promise<unknown>]>([
    [
      'adding a column',
      () => {
        const { mutateAsync } = useCreateColumn()
        return () => mutateAsync({ boardId: target.boardId, name: 'Blocked' })
      },
    ],
    [
      'renaming a column',
      () => {
        const { mutateAsync } = useRenameColumn()
        return () => mutateAsync({ ...target, name: 'Blocked' })
      },
    ],
    [
      'moving a column',
      () => {
        const { mutateAsync } = useMoveColumn()
        return () => mutateAsync({ ...target, position: 1 })
      },
    ],
    [
      'deleting a column',
      () => {
        const { mutateAsync } = useDeleteColumn()
        return () => mutateAsync(target)
      },
    ],
  ])('reload the board list after %s', async (_, useChange) => {
    const { queryClient, boards, wrapper } = setup()
    queryClient.setQueryData(boardsKeys.all, boards.boards())
    const { result } = renderHook(useChange, { wrapper })

    await act(() => result.current())

    expect(queryClient.getQueryState(boardsKeys.all)?.isInvalidated).toBe(true)
  })

  it('start a board load again when it was running during the change', async () => {
    const { dataAccess, wrapper, loads } = setup()
    const { result } = renderHook(
      () => ({
        detail: useBoardDetail(CARDIGAN_BOARD_ID),
        createColumn: useCreateColumn(),
      }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.detail.isSuccess).toBe(true))
    const release = dataAccess.holdNext('loadBoard')
    act(() => void result.current.detail.refetch())

    await act(() =>
      result.current.createColumn.mutateAsync({
        boardId: CARDIGAN_BOARD_ID,
        name: 'Blocked',
      }),
    )

    expect(loads()).toBe(3)
    await act(async () => release())
  })

  it('do not load the board again when only the board list is loading', async () => {
    const { boards, wrapper, loads } = setup()
    const { result } = renderHook(
      () => ({
        list: useQuery(boardsQueryOptions(boards)),
        detail: useBoardDetail(CARDIGAN_BOARD_ID),
        createColumn: useCreateColumn(),
      }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.detail.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))

    await act(() =>
      result.current.createColumn.mutateAsync({
        boardId: CARDIGAN_BOARD_ID,
        name: 'Blocked',
      }),
    )

    expect(loads()).toBe(1)
  })

  it('report a move as not stale when the board is not cached', async () => {
    const { wrapper } = setup()
    const { result } = renderHook(() => useMoveColumn(), { wrapper })

    await expect(
      act(() =>
        result.current.mutateAsync({
          boardId: CARDIGAN_BOARD_ID,
          columnId: firstColumnId,
          position: 1,
        }),
      ),
    ).resolves.toEqual({ isStale: false })
  })
})
