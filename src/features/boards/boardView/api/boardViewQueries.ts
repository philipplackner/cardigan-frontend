import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { boardsKeys } from '../../api/boardsQueries'
import {
  BoardViewError,
  type BoardDetail,
  type BoardViewDataAccess,
  type BoardViewErrorKind,
} from '../types'
import {
  addCard,
  addColumn,
  applyColumnPositions,
  removeColumn,
  renameColumn,
  sortBoard,
} from '../utils/applyChanges'
import { useBoardViewDataAccess } from './BoardViewDataAccessContext'

/** The root is not `['boards']`, so invalidating the board list never reloads the open board. */
export const boardViewKeys = {
  all: ['boardView'] as const,
  detail: (boardId: string) => ['boardView', 'detail', boardId] as const,
}

export function boardViewQueryOptions(
  dataAccess: BoardViewDataAccess,
  boardId: string,
) {
  return queryOptions({
    queryKey: boardViewKeys.detail(boardId),
    queryFn: async () => sortBoard(await dataAccess.loadBoard(boardId)),
  })
}

export function useBoardDetail(boardId: string) {
  return useQuery(boardViewQueryOptions(useBoardViewDataAccess(), boardId))
}

/** The failure kind of a rejected board view call. Anything that isn't a `BoardViewError` counts as `other`. */
export function boardViewErrorOf(error: unknown): BoardViewErrorKind {
  return error instanceof BoardViewError ? error.error : { kind: 'other' }
}

/**
 * Writes a change into the cached board. A missing entry stays missing, so a late response never
 * recreates a board the cache dropped, for example after `queryClient.clear()` at the end of a session.
 */
export function updateCachedBoard(
  queryClient: QueryClient,
  boardId: string,
  update: (board: BoardDetail) => BoardDetail,
) {
  queryClient.setQueryData<BoardDetail>(
    boardViewKeys.detail(boardId),
    (board) => (board === undefined ? undefined : update(board)),
  )
}

/**
 * After a change: the board list shows the board's card count and updated time, so it reloads. A
 * board load that started before the change could overwrite it, so it is started again.
 */
function afterChange(queryClient: QueryClient, boardId: string) {
  void queryClient.invalidateQueries({ queryKey: boardsKeys.all })
  const key = boardViewKeys.detail(boardId)
  if (queryClient.isFetching({ queryKey: key }) > 0) {
    void queryClient.invalidateQueries({ queryKey: key })
  }
}

export function useCreateColumn() {
  const dataAccess = useBoardViewDataAccess()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ boardId, name }: { boardId: string; name: string }) =>
      dataAccess.createColumn(boardId, name),
    onSuccess: (column, { boardId }) => {
      updateCachedBoard(queryClient, boardId, (board) =>
        addColumn(board, column),
      )
      afterChange(queryClient, boardId)
    },
  })
}

export function useRenameColumn() {
  const dataAccess = useBoardViewDataAccess()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      boardId,
      columnId,
      name,
    }: {
      boardId: string
      columnId: string
      name: string
    }) => dataAccess.renameColumn(boardId, columnId, name),
    onSuccess: (column, { boardId }) => {
      updateCachedBoard(queryClient, boardId, (board) =>
        renameColumn(board, column),
      )
      afterChange(queryClient, boardId)
    },
  })
}

/** Resolves with `isStale` when the move applied but the board changed elsewhere and must reload. */
export function useMoveColumn() {
  const dataAccess = useBoardViewDataAccess()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      boardId,
      columnId,
      position,
    }: {
      boardId: string
      columnId: string
      position: number
    }) => {
      const positions = await dataAccess.moveColumn(boardId, columnId, position)
      let isStale = false
      updateCachedBoard(queryClient, boardId, (board) => {
        const result = applyColumnPositions(board, positions)
        isStale = result.isStale
        return result.board
      })
      afterChange(queryClient, boardId)
      return { isStale }
    },
  })
}

/** Deletes a column. A 404 counts as deleted (D15). */
export function useDeleteColumn() {
  const dataAccess = useBoardViewDataAccess()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      boardId,
      columnId,
    }: {
      boardId: string
      columnId: string
    }) => {
      try {
        await dataAccess.deleteColumn(boardId, columnId)
      } catch (error) {
        if (boardViewErrorOf(error).kind !== 'notFound') throw error
      }
    },
    onSuccess: (_, { boardId, columnId }) => {
      updateCachedBoard(queryClient, boardId, (board) =>
        removeColumn(board, columnId),
      )
      afterChange(queryClient, boardId)
    },
  })
}

export function useCreateCard() {
  const dataAccess = useBoardViewDataAccess()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      boardId,
      columnId,
      title,
    }: {
      boardId: string
      columnId: string
      title: string
    }) => dataAccess.createCard(boardId, columnId, title),
    onSuccess: (card, { boardId, columnId }) => {
      updateCachedBoard(queryClient, boardId, (board) =>
        addCard(board, columnId, card),
      )
      afterChange(queryClient, boardId)
    },
  })
}
