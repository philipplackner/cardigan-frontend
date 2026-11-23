import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import {
  BoardsError,
  type BoardsDataAccess,
  type BoardsErrorKind,
  type BoardSummary,
} from '../types'
import { useBoardsDataAccess } from './BoardsDataAccessContext'

export const boardsKeys = {
  all: ['boards'] as const,
}

/** The board list. The list, the sidebar and the local key check all read this one cache entry. */
export function boardsQueryOptions(dataAccess: BoardsDataAccess) {
  return queryOptions({
    queryKey: boardsKeys.all,
    queryFn: () => dataAccess.listBoards(),
  })
}

export function useBoards() {
  return useQuery(boardsQueryOptions(useBoardsDataAccess()))
}

/** The failure kind of a rejected board call. Anything that isn't a `BoardsError` counts as `other`. */
export function boardsErrorOf(error: unknown): BoardsErrorKind {
  return error instanceof BoardsError ? error.error : { kind: 'other' }
}

const invalidateBoards = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({ queryKey: boardsKeys.all })

function removeBoard(queryClient: QueryClient, boardId: string) {
  queryClient.setQueryData<BoardSummary[]>(boardsKeys.all, (boards) =>
    boards?.filter((board) => board.id !== boardId),
  )
}

/**
 * Creates a board. After a lost response or a key clash the list reloads, so a board created despite
 * the lost response shows up and the local key check sees its key (`api-conventions` › Retries after
 * a lost response). The request is never repeated.
 */
export function useCreateBoard() {
  const dataAccess = useBoardsDataAccess()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; key: string }) =>
      dataAccess.createBoard(input),
    onSuccess: () => invalidateBoards(queryClient),
    onError: (error) => {
      const failure = boardsErrorOf(error)
      const isKeyClash =
        failure.kind === 'invalid' &&
        failure.fields.some(
          (field) => field.field === 'key' && field.code === 'ALREADY_USED',
        )
      if (failure.kind === 'other' || isKeyClash) {
        void invalidateBoards(queryClient)
      }
    },
  })
}

/** Renames a board. The cached board takes the new name and time at once; its card count stays. */
export function useRenameBoard() {
  const dataAccess = useBoardsDataAccess()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      dataAccess.renameBoard(id, name),
    onSuccess: (renamed) => {
      queryClient.setQueryData<BoardSummary[]>(boardsKeys.all, (boards) =>
        boards?.map((board) =>
          board.id === renamed.id
            ? { ...board, name: renamed.name, updatedAt: renamed.updatedAt }
            : board,
        ),
      )
      void invalidateBoards(queryClient)
    },
    onError: (error, { id }) => {
      if (boardsErrorOf(error).kind !== 'notFound') return
      removeBoard(queryClient, id)
      void invalidateBoards(queryClient)
    },
  })
}

/** Deletes a board. A 404 counts as deleted (`api-conventions` › Deleting a missing resource is not found). */
export function useDeleteBoard() {
  const dataAccess = useBoardsDataAccess()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await dataAccess.deleteBoard(id)
      } catch (error) {
        if (boardsErrorOf(error).kind !== 'notFound') throw error
      }
    },
    onSuccess: (_, id) => {
      removeBoard(queryClient, id)
      void invalidateBoards(queryClient)
    },
  })
}
