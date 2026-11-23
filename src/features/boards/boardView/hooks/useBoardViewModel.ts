import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/core/ui'
import { useBoardsDataAccess } from '../../api/BoardsDataAccessContext'
import { boardsQueryOptions } from '../../api/boardsQueries'
import {
  boardViewErrorOf,
  boardViewKeys,
  useBoardDetail,
} from '../api/boardViewQueries'
import type { BoardDetail } from '../types'
import {
  boardViewReducer,
  initialBoardViewUiState,
  type BoardViewUiAction,
  type BoardViewUiState,
} from './boardViewReducer'

/** What the host does when the board view leaves or opens something. */
export type BoardViewCallbacks = {
  /** Opens the card with this ID. */
  onOpenCard: (cardId: string) => void
  /** Starts the board export. */
  onExport: (board: { id: string; name: string }) => void
  /** The phone back button: go to the board list. */
  onBack: () => void
  /** The board was deleted: go to the board list. */
  onBoardGone: () => void
  /** The first load found no board: show the app's not-found page. May throw. */
  onNotFound: () => void
}

export type BoardViewStatus =
  | { type: 'loading' }
  | { type: 'error' }
  | { type: 'ready'; board: BoardDetail }

export type BoardViewState = {
  /** Name and key for the header. From the board, else from the board list, else `null`. */
  header: { name: string; key: string } | null
  status: BoardViewStatus
  /** True while a load runs and a board or a load error is shown. */
  isRefreshing: boolean
  ui: BoardViewUiState
}

export type BoardViewAction =
  | BoardViewUiAction
  | { type: 'openCard'; cardId: string }
  | { type: 'back' }
  | { type: 'refresh' }
  | { type: 'tryAgain' }

export function useBoardViewModel(
  boardId: string,
  { onOpenCard, onBack, onBoardGone, onNotFound }: BoardViewCallbacks,
) {
  const { t } = useTranslation('boardView')
  const toast = useToast()
  const queryClient = useQueryClient()
  // After the board is gone the host navigates away; until then nothing loads it again.
  const [isGone, setIsGone] = useState(false)
  const query = useBoardDetail(boardId, { enabled: !isGone })
  const { data: boards } = useQuery({
    ...boardsQueryOptions(useBoardsDataAccess()),
    enabled: false,
  })
  const [ui, dispatch] = useReducer(boardViewReducer, initialBoardViewUiState)
  const isRefreshRequested = useRef(false)
  const handledErrorAt = useRef(0)
  const isMounted = useRef(true)
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const { data: board, error, isFetching, isPending, errorUpdatedAt } = query
  const errorKind = error ? boardViewErrorOf(error).kind : null

  if (!isGone && !board && errorKind === 'notFound' && !isFetching) {
    onNotFound()
  }

  const boardGone = () => {
    if (!isMounted.current) return
    setIsGone(true)
    queryClient.removeQueries({ queryKey: boardViewKeys.detail(boardId) })
    toast.show({ type: 'error', message: t('boardGone') })
    onBoardGone()
  }

  useEffect(() => {
    if (isFetching || !error || errorUpdatedAt === handledErrorAt.current) {
      return
    }
    handledErrorAt.current = errorUpdatedAt
    const wasRefresh = isRefreshRequested.current
    isRefreshRequested.current = false
    if (board && boardViewErrorOf(error).kind === 'notFound') {
      boardGone()
    } else if (board && wasRefresh) {
      toast.show({ type: 'error', message: t('refreshFailed') })
    }
  })

  useEffect(() => {
    if (!isFetching) isRefreshRequested.current = false
  }, [isFetching])

  const columnIds = board?.columns.map((column) => column.id).join(' ')
  useEffect(() => {
    if (columnIds === undefined) return
    dispatch({ type: 'columnsChanged', columnIds: columnIds.split(' ') })
  }, [columnIds])

  const reload = () => {
    if (isFetching) return
    isRefreshRequested.current = true
    void query.refetch()
  }

  const onAction = (action: BoardViewAction) => {
    switch (action.type) {
      case 'openCard':
        onOpenCard(action.cardId)
        break
      case 'back':
        onBack()
        break
      case 'refresh':
      case 'tryAgain':
        reload()
        break
      default:
        dispatch(action)
    }
  }

  const summary = boards?.find((candidate) => candidate.id === boardId)
  const header = board
    ? { name: board.name, key: board.key }
    : summary
      ? { name: summary.name, key: summary.key }
      : null
  const status: BoardViewStatus = board
    ? { type: 'ready', board }
    : error && !isFetching
      ? { type: 'error' }
      : { type: 'loading' }
  const state: BoardViewState = {
    header,
    status,
    isRefreshing: isFetching && !isPending,
    ui,
  }
  return { state, onAction }
}
