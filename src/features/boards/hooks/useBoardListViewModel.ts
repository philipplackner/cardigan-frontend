import { useQueryClient } from '@tanstack/react-query'
import { useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/core/ui'
import { boardsErrorOf, boardsKeys, useBoards } from '../api/boardsQueries'
import type { BoardSummary } from '../types'
import {
  boardListReducer,
  initialBoardListState,
  type BoardListAction,
  type BoardListReducerState,
} from './boardListReducer'
import { useNow } from './useNow'

export type BoardListStatus =
  | { type: 'loading' }
  | { type: 'error' }
  | { type: 'ready'; boards: BoardSummary[] }

export type BoardListState = BoardListReducerState & {
  status: BoardListStatus
  /** True only while a refresh the user started runs. */
  isRefreshing: boolean
  /** The time relative times are measured against. */
  now: Date
}

export function useBoardListViewModel() {
  const { t } = useTranslation('boards')
  const toast = useToast()
  const queryClient = useQueryClient()
  const { data, isFetching, isError, dataUpdatedAt, refetch } = useBoards()
  const [uiState, dispatch] = useReducer(
    boardListReducer,
    initialBoardListState,
  )
  const [isRefreshing, setIsRefreshing] = useState(false)
  // A ref as well, so a second click before the next render doesn't start another request.
  const refreshRunning = useRef(false)
  const now = useNow(dataUpdatedAt)

  const status: BoardListStatus = data
    ? { type: 'ready', boards: data }
    : isError && !isFetching
      ? { type: 'error' }
      : { type: 'loading' }

  const refresh = async () => {
    if (refreshRunning.current) return
    refreshRunning.current = true
    setIsRefreshing(true)
    const result = await refetch()
    refreshRunning.current = false
    setIsRefreshing(false)
    if (result.isError && boardsErrorOf(result.error).kind !== 'sessionEnded') {
      toast.show({ type: 'error', message: t('refreshFailed') })
    }
  }

  const currentIds = () =>
    (queryClient.getQueryData<BoardSummary[]>(boardsKeys.all) ?? []).map(
      (board) => board.id,
    )

  const onAction = (action: BoardListAction) => {
    dispatch(action)
    switch (action.type) {
      case 'refreshClick':
        if (status.type === 'ready') void refresh()
        else if (!isFetching) void refetch()
        break
      case 'tryAgainClick':
        if (!isFetching) void refetch()
        break
      case 'renameClick':
      case 'deleteClick':
        dispatch({
          type: 'dialogOpen',
          dialog: action.type === 'renameClick' ? 'rename' : 'delete',
          board: action.board,
          listIds: currentIds(),
        })
        break
      case 'dialogClose':
        dispatch({
          type: 'dialogFinish',
          result: action.result,
          remainingIds: currentIds(),
        })
        break
    }
  }

  const state: BoardListState = { ...uiState, status, isRefreshing, now }
  return { state, onAction }
}
