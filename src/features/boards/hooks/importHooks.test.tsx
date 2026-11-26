import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { createTestQueryClient } from '@/core/api/queryClient'
import { boardsKeys } from '../api/boardsQueries'
import { sampleBoards } from '../testing/sampleBoards'
import { useBoardsChanged, useFindBoardNameByKey } from './importHooks'

function setup<T>(
  useHook: () => T,
  boards: readonly unknown[] | null = sampleBoards.slice(0, 3),
) {
  const queryClient = createTestQueryClient()
  if (boards) queryClient.setQueryData(boardsKeys.all, boards)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(useHook, { wrapper })
  return { result, queryClient }
}

describe('useBoardsChanged', () => {
  it('reloads the board list and nothing else', () => {
    const { result, queryClient } = setup(() => useBoardsChanged())
    queryClient.setQueryData(['boardView', 'detail', 'x'], {})

    result.current()

    expect(queryClient.getQueryState(boardsKeys.all)?.isInvalidated).toBe(true)
    expect(
      queryClient.getQueryState(['boardView', 'detail', 'x'])?.isInvalidated,
    ).toBe(false)
  })
})

describe('useFindBoardNameByKey', () => {
  it('finds the name of a loaded board by its key', () => {
    const board = sampleBoards[1]!
    const { result } = setup(() => useFindBoardNameByKey())

    expect(result.current(board.key)).toBe(board.name)
  })

  it('finds nothing for an unknown key', () => {
    const { result } = setup(() => useFindBoardNameByKey())

    expect(result.current('NOPE')).toBeUndefined()
  })

  it('finds nothing before the list is loaded', () => {
    const { result } = setup(() => useFindBoardNameByKey(), null)

    expect(result.current(sampleBoards[0]!.key)).toBeUndefined()
  })
})
