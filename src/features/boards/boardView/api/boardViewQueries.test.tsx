import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { createTestQueryClient } from '@/core/api/queryClient'
import { createInMemoryBoardsDataAccess } from '../../testing/createInMemoryBoardsDataAccess'
import { createInMemoryBoardViewDataAccess } from '../testing/createInMemoryBoardViewDataAccess'
import { CARDIGAN_BOARD_ID } from '../testing/sampleBoardContent'
import { BoardViewDataAccessProvider } from './BoardViewDataAccessProvider'
import {
  boardViewKeys,
  boardViewQueryOptions,
  useCreateCard,
} from './boardViewQueries'

describe('board view mutations', () => {
  it('leave the cache empty when it was cleared while a create ran', async () => {
    const queryClient = createTestQueryClient()
    const dataAccess = createInMemoryBoardViewDataAccess(
      createInMemoryBoardsDataAccess(),
    )
    const board = await queryClient.fetchQuery(
      boardViewQueryOptions(dataAccess, CARDIGAN_BOARD_ID),
    )
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <BoardViewDataAccessProvider dataAccess={dataAccess}>
          {children}
        </BoardViewDataAccessProvider>
      </QueryClientProvider>
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
})
