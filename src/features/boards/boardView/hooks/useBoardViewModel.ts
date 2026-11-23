import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/core/ui'
import { normalizeText } from '@/core/utils/text'
import { useBoardsDataAccess } from '../../api/BoardsDataAccessContext'
import { boardsQueryOptions } from '../../api/boardsQueries'
import { nameErrorMessageKey } from '../../utils/boardName'
import {
  boardViewErrorOf,
  boardViewKeys,
  useBoardDetail,
  useCreateCard,
  useCreateColumn,
} from '../api/boardViewQueries'
import type { BoardDetail } from '../types'
import {
  handleBoardViewError,
  type BoardViewChange,
} from '../utils/handleBoardViewError'
import {
  CARD_TITLE_MAX,
  COLUMN_NAME_MAX,
  checkCardTitle,
  checkColumnName,
} from '../utils/limits'
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
  /** The error under the quick add field. */
  quickAddError?: string
  /** The error under the add column field. */
  addColumnError?: string
  /** True while a quick add or add column form saves. */
  isInlineSaving: boolean
}

export type BoardViewAction =
  | BoardViewUiAction
  | { type: 'openCard'; cardId: string }
  | { type: 'back' }
  | { type: 'refresh' }
  | { type: 'tryAgain' }
  /** A click or focus move outside the open inline form. */
  | { type: 'inlineOutside' }

export function useBoardViewModel(
  boardId: string,
  { onOpenCard, onBack, onBoardGone, onNotFound }: BoardViewCallbacks,
) {
  const { t } = useTranslation('boardView')
  const { t: tCommon } = useTranslation()
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

  const createCard = useCreateCard()
  const createColumn = useCreateColumn()
  const isInlineSaving = createCard.isPending || createColumn.isPending
  // A ref as well, so a second Enter before the next render doesn't send another request.
  const isInlineSavingNow = useRef(false)
  const [serverError, setServerError] = useState<{
    form: 'quickAdd' | 'addColumn'
    message: string
  } | null>(null)

  const nameErrorText = (code: string, max: number) =>
    tCommon(nameErrorMessageKey(code), { n: max })

  /** Loads the board again. Shows `message` afterwards, unless the board itself is gone. */
  const reloadBoard = async (message?: string) => {
    const result = await query.refetch()
    if (!isMounted.current) return
    if (result.isError && boardViewErrorOf(result.error).kind === 'notFound') {
      return
    }
    if (message) toast.show({ type: 'error', message })
  }

  /** Shows the toasts and reloads that follow a failed change. Returns the outcome for the caller. */
  const handleFailure = (
    change: BoardViewChange,
    error: unknown,
    columnName: string,
    failedMessage: string,
  ) => {
    const outcome = handleBoardViewError(change, boardViewErrorOf(error))
    if (!isMounted.current) return outcome
    switch (outcome.type) {
      case 'failed':
        toast.show({ type: 'error', message: failedMessage })
        if (outcome.reload) void reloadBoard()
        break
      case 'columnGone':
        void reloadBoard(t('columnGone', { name: columnName }))
        break
      case 'staleMove':
        void reloadBoard(t('moveColumn.stale', { name: columnName }))
        break
      case 'fieldErrors':
      case 'deleted':
        break
    }
    return outcome
  }

  const submitQuickAdd = async () => {
    const quickAdd = ui.quickAdd
    const column = board?.columns.find(
      (candidate) => candidate.id === quickAdd?.columnId,
    )
    if (!quickAdd || !column || isInlineSavingNow.current) return
    const check = checkCardTitle(quickAdd.text)
    if (check.value === '') return
    dispatch({ type: 'quickAddSubmit' })
    if (check.error) return
    isInlineSavingNow.current = true
    try {
      await createCard.mutateAsync({
        boardId,
        columnId: column.id,
        title: check.value,
      })
      if (isMounted.current) dispatch({ type: 'quickAddAdded' })
    } catch (failure) {
      const outcome = handleFailure(
        'createCard',
        failure,
        column.name,
        t('quickAdd.failed'),
      )
      const field = outcome.type === 'fieldErrors' ? outcome.fields[0] : null
      if (field && isMounted.current) {
        setServerError({
          form: 'quickAdd',
          message: nameErrorText(field.code, field.max ?? CARD_TITLE_MAX),
        })
      }
    } finally {
      isInlineSavingNow.current = false
    }
  }

  const submitAddColumn = async () => {
    const addColumn = ui.addColumn
    if (!addColumn || isInlineSavingNow.current) return
    dispatch({ type: 'addColumnSubmit' })
    const check = checkColumnName(addColumn.text)
    if (check.error) return
    isInlineSavingNow.current = true
    try {
      const column = await createColumn.mutateAsync({
        boardId,
        name: check.value,
      })
      if (isMounted.current) {
        dispatch({ type: 'addColumnAdded', columnId: column.id })
      }
    } catch (failure) {
      const outcome = handleFailure(
        'createColumn',
        failure,
        check.value,
        t('addColumnForm.failed'),
      )
      const field = outcome.type === 'fieldErrors' ? outcome.fields[0] : null
      if (field && isMounted.current) {
        setServerError({
          form: 'addColumn',
          message: nameErrorText(field.code, field.max ?? COLUMN_NAME_MAX),
        })
      }
    } finally {
      isInlineSavingNow.current = false
    }
  }

  const nameError = (text: string) => {
    const { error: code } = checkColumnName(text)
    return code ? nameErrorText(code, COLUMN_NAME_MAX) : undefined
  }

  const titleError = (text: string) => {
    const { error: code } = checkCardTitle(text)
    return code && code !== 'EMPTY'
      ? nameErrorText(code, CARD_TITLE_MAX)
      : undefined
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
      case 'quickAddSubmit':
        void submitQuickAdd()
        break
      case 'addColumnSubmit':
        void submitAddColumn()
        break
      case 'inlineOutside': {
        const text = ui.quickAdd?.text ?? ui.addColumn?.text
        if (text !== undefined && normalizeText(text, 'singleLine') === '') {
          setServerError(null)
          dispatch({ type: 'inlineClose' })
        }
        break
      }
      case 'inlineOpen':
        if (isInlineSaving) break
        setServerError(null)
        dispatch(action)
        break
      case 'quickAddChange':
      case 'addColumnChange':
      case 'inlineClose':
      case 'discardConfirm':
        setServerError(null)
        dispatch(action)
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
    quickAddError:
      serverError?.form === 'quickAdd'
        ? serverError.message
        : ui.quickAdd?.submitted
          ? titleError(ui.quickAdd.text)
          : undefined,
    addColumnError:
      serverError?.form === 'addColumn'
        ? serverError.message
        : ui.addColumn?.submitted
          ? nameError(ui.addColumn.text)
          : undefined,
    isInlineSaving,
  }
  return { state, onAction }
}
