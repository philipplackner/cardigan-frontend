import { useQueryClient } from '@tanstack/react-query'
import { boardsKeys } from '../api/boardsQueries'
import type { BoardSummary } from '../types'

/** Reloads the board list. For `transfer`'s `onBoardsChanged`. */
export function useBoardsChanged() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: boardsKeys.all })
  }
}

/** Finds a loaded board's name by key, without loading. For `transfer`'s `findBoardNameByKey`. */
export function useFindBoardNameByKey() {
  const queryClient = useQueryClient()
  return (key: string) =>
    queryClient
      .getQueryData<BoardSummary[]>(boardsKeys.all)
      ?.find((board) => board.key === key)?.name
}
