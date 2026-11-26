import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { createTestQueryClient } from '@/core/api/queryClient'
import {
  createInMemoryBoardsDataAccess,
  type InMemoryBoardsDataAccess,
} from '../testing/createInMemoryBoardsDataAccess'
import { sampleBoards } from '../testing/sampleBoards'
import type { BoardFieldError, BoardSummary } from '../types'
import { BoardsDataAccessProvider } from './BoardsDataAccessProvider'
import {
  boardsErrorOf,
  boardsKeys,
  boardsQueryOptions,
  useCreateBoard,
  useDeleteBoard,
  useRenameBoard,
} from './boardsQueries'

const threeBoards = sampleBoards.slice(0, 3)
const [first, second, third] = threeBoards.map((board) => board.id) as [
  string,
  string,
  string,
]

async function setup<T>(useHook: () => T) {
  const queryClient = createTestQueryClient()
  const dataAccess = createInMemoryBoardsDataAccess(threeBoards)
  await queryClient.fetchQuery(boardsQueryOptions(dataAccess))
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BoardsDataAccessProvider dataAccess={dataAccess}>
        {children}
      </BoardsDataAccessProvider>
    </QueryClientProvider>
  )
  const { result } = renderHook(useHook, { wrapper })
  return {
    result,
    dataAccess,
    cachedIds: () =>
      queryClient
        .getQueryData<BoardSummary[]>(boardsKeys.all)
        ?.map((board) => board.id),
    isListInvalidated: () =>
      queryClient.getQueryState(boardsKeys.all)?.isInvalidated,
  }
}

async function settle(run: () => Promise<unknown>) {
  await act(async () => {
    await run().catch(() => {})
  })
}

describe('boardsErrorOf', () => {
  it('counts an error that is not a BoardsError as other', () => {
    expect(boardsErrorOf(new TypeError('Failed to fetch'))).toEqual({
      kind: 'other',
    })
  })
})

describe('useCreateBoard', () => {
  const create = (
    dataAccess: InMemoryBoardsDataAccess,
    mutateAsync: (input: { name: string; key: string }) => Promise<unknown>,
    fields?: BoardFieldError[],
  ) => {
    if (fields) dataAccess.failNext('createBoard', { kind: 'invalid', fields })
    return settle(() => mutateAsync({ name: 'Garden', key: 'GDN' }))
  }

  it('reloads the list after a create', async () => {
    const { result, dataAccess, isListInvalidated } = await setup(() =>
      useCreateBoard(),
    )

    await create(dataAccess, result.current.mutateAsync)

    expect(isListInvalidated()).toBe(true)
  })

  it('reloads the list after a lost response', async () => {
    const { result, dataAccess, isListInvalidated } = await setup(() =>
      useCreateBoard(),
    )
    dataAccess.applyThenFailNextCreate()

    await create(dataAccess, result.current.mutateAsync)

    expect(isListInvalidated()).toBe(true)
  })

  it('reloads the list after a key clash reported next to a name error', async () => {
    const { result, dataAccess, isListInvalidated } = await setup(() =>
      useCreateBoard(),
    )

    await create(dataAccess, result.current.mutateAsync, [
      { field: 'name', code: 'TOO_LONG', max: 100 },
      { field: 'key', code: 'ALREADY_USED' },
    ])

    expect(isListInvalidated()).toBe(true)
  })

  it.each<[string, BoardFieldError]>([
    ['a name error', { field: 'name', code: 'REQUIRED' }],
    ['a key format error', { field: 'key', code: 'INVALID_FORMAT' }],
    ['ALREADY_USED on another field', { field: 'name', code: 'ALREADY_USED' }],
  ])('keeps the list for %s', async (_, field) => {
    const { result, dataAccess, isListInvalidated } = await setup(() =>
      useCreateBoard(),
    )

    await create(dataAccess, result.current.mutateAsync, [field])

    expect(isListInvalidated()).toBe(false)
  })
})

describe('useRenameBoard', () => {
  it('drops the board from the list and reloads it after a 404', async () => {
    const { result, dataAccess, cachedIds, isListInvalidated } = await setup(
      () => useRenameBoard(),
    )
    dataAccess.failNext('renameBoard', { kind: 'notFound' })

    await settle(() => result.current.mutateAsync({ id: second, name: 'X' }))

    expect(cachedIds()).toEqual([first, third])
    expect(isListInvalidated()).toBe(true)
  })

  it('keeps the list as it is after a field error', async () => {
    const { result, dataAccess, cachedIds, isListInvalidated } = await setup(
      () => useRenameBoard(),
    )
    dataAccess.failNext('renameBoard', {
      kind: 'invalid',
      fields: [{ field: 'name', code: 'TOO_LONG', max: 100 }],
    })

    await settle(() => result.current.mutateAsync({ id: second, name: 'X' }))

    expect(cachedIds()).toEqual([first, second, third])
    expect(isListInvalidated()).toBe(false)
  })
})

describe('useDeleteBoard', () => {
  it('drops only the deleted board from the list at once', async () => {
    const { result, cachedIds, isListInvalidated } = await setup(() =>
      useDeleteBoard(),
    )

    await settle(() => result.current.mutateAsync(second))

    expect(cachedIds()).toEqual([first, third])
    expect(isListInvalidated()).toBe(true)
  })

  it('drops a board that was already deleted elsewhere', async () => {
    const { result, dataAccess, cachedIds } = await setup(() =>
      useDeleteBoard(),
    )
    await dataAccess.deleteBoard(second)

    await settle(() => result.current.mutateAsync(second))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(cachedIds()).toEqual([first, third])
  })
})
