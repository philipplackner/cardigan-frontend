import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/core/ui'
import { useBoardsDataAccess } from '../../api/BoardsDataAccessContext'
import { boardsQueryOptions } from '../../api/boardsQueries'
import type { BoardDialogResult } from '../../hooks/boardDialogResult'
import type { BoardSummary } from '../../types'
import { nameErrorMessageKey } from '../../utils/boardName'
import {
  boardViewErrorOf,
  boardViewKeys,
  updateCachedBoard,
  useBoardDetail,
  useCreateCard,
  useCreateColumn,
  useDeleteColumn,
  useMoveColumn,
  useRenameColumn,
} from '../api/boardViewQueries'
import type { BoardColumn, BoardDetail } from '../types'
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
  isBlank,
  type BoardViewUiAction,
  type FocusTarget,
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
  isRenamingColumn: boolean
  isDeletingColumn: boolean
}

export type BoardViewAction =
  | BoardViewUiAction
  | { type: 'openCard'; cardId: string }
  | { type: 'back' }
  | { type: 'refresh' }
  | { type: 'tryAgain' }
  /** A click or focus move outside the open inline form. */
  | { type: 'inlineOutside' }
  | { type: 'moveColumn'; columnId: string; direction: 'left' | 'right' }
  | { type: 'deleteColumnConfirm' }
  | { type: 'export' }
  | { type: 'boardDialogClose'; result: BoardDialogResult }

export function useBoardViewModel(
  boardId: string,
  { onOpenCard, onExport, onBack, onBoardGone, onNotFound }: BoardViewCallbacks,
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

  /** Leaves the board. Only a board that disappeared on its own gets the toast. */
  const boardGone = ({ withToast = true } = {}) => {
    if (!isMounted.current) return
    setIsGone(true)
    queryClient.removeQueries({ queryKey: boardViewKeys.detail(boardId) })
    if (withToast) toast.show({ type: 'error', message: t('boardGone') })
    onBoardGone()
  }

  const closeBoardDialog = (result: BoardDialogResult) => {
    dispatch({ type: 'dialogClose' })
    if (result.kind === 'renamed') {
      updateCachedBoard(queryClient, boardId, (cached) => ({
        ...cached,
        name: result.board.name,
      }))
    } else if (result.kind === 'deleted') {
      // The rename dialog already says the board no longer exists, and a delete needs no toast (F3).
      boardGone({ withToast: false })
    }
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
      dispatch({ type: 'quickAddAdded' })
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
      dispatch({ type: 'addColumnAdded', columnId: column.id })
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

  const moveColumn = useMoveColumn()
  const renameColumn = useRenameColumn()
  const deleteColumn = useDeleteColumn()
  const isMovingNow = useRef(false)

  const columnById = (columnId: string | undefined) =>
    board?.columns.find((column) => column.id === columnId)

  const submitMove = async (columnId: string, direction: 'left' | 'right') => {
    if (!board || isMovingNow.current) return
    const index = board.columns.findIndex((column) => column.id === columnId)
    const column = board.columns[index]
    if (!column) return
    const position = direction === 'left' ? index - 1 : index + 1
    if (position < 0 || position >= board.columns.length) return
    isMovingNow.current = true
    dispatch({ type: 'moveStart', columnId })
    try {
      const { isStale } = await moveColumn.mutateAsync({
        boardId,
        columnId,
        position,
      })
      if (isStale && isMounted.current) void reloadBoard()
    } catch (failure) {
      handleFailure(
        'moveColumn',
        failure,
        column.name,
        t('moveColumn.failed', { name: column.name }),
      )
    } finally {
      isMovingNow.current = false
      dispatch({ type: 'moveEnd' })
    }
  }

  /** Saves a column's new name. Resolves with the error to show under the field, if any. */
  const submitRename = async (name: string): Promise<string | undefined> => {
    const dialog = ui.dialog
    const column =
      dialog?.kind === 'renameColumn' ? columnById(dialog.columnId) : undefined
    if (!column) return undefined
    if (name === column.name) {
      dispatch({ type: 'dialogClose' })
      return undefined
    }
    try {
      await renameColumn.mutateAsync({ boardId, columnId: column.id, name })
      dispatch({ type: 'dialogClose' })
      return undefined
    } catch (failure) {
      const outcome = handleFailure(
        'renameColumn',
        failure,
        column.name,
        t('renameColumn.failed', { name: column.name }),
      )
      const field = outcome.type === 'fieldErrors' ? outcome.fields[0] : null
      return field
        ? nameErrorText(field.code, field.max ?? COLUMN_NAME_MAX)
        : undefined
    }
  }

  /** After a delete, focus moves to the next column's menu, or to Add column when none follows. */
  const focusAfterDelete = (next: BoardColumn | undefined): FocusTarget =>
    next
      ? { kind: 'columnMenu', columnId: next.id }
      : { kind: 'addColumnButton' }

  const submitDelete = async () => {
    const dialog = ui.dialog
    if (!board || dialog?.kind !== 'deleteColumn' || deleteColumn.isPending) {
      return
    }
    const index = board.columns.findIndex(
      (column) => column.id === dialog.columnId,
    )
    const column = board.columns[index]
    if (!column) return
    const focus = focusAfterDelete(board.columns[index + 1])
    try {
      await deleteColumn.mutateAsync({ boardId, columnId: column.id })
      dispatch({ type: 'dialogClose', focus })
    } catch (failure) {
      handleFailure(
        'deleteColumn',
        failure,
        column.name,
        t('deleteColumn.failed', { name: column.name }),
      )
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
      case 'moveColumn':
        void submitMove(action.columnId, action.direction)
        break
      case 'deleteColumnConfirm':
        void submitDelete()
        break
      case 'export':
        if (board) onExport({ id: board.id, name: board.name })
        break
      case 'boardDialogClose':
        closeBoardDialog(action.result)
        break
      case 'inlineOutside': {
        const text = ui.quickAdd?.text ?? ui.addColumn?.text
        if (text !== undefined && isBlank(text)) {
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
    isRenamingColumn: renameColumn.isPending,
    isDeletingColumn: deleteColumn.isPending,
  }
  // The dialogs keep their last board in state, so the object must stay the same between renders.
  const summaryUpdatedAt = summary?.updatedAt
  const boardSummary = useMemo<BoardSummary | null>(
    () =>
      board
        ? {
            id: board.id,
            name: board.name,
            key: board.key,
            cardCount: board.columns.reduce(
              (sum, column) => sum + column.cards.length,
              0,
            ),
            updatedAt: summaryUpdatedAt ?? new Date(0),
          }
        : null,
    [board, summaryUpdatedAt],
  )
  return { state, onAction, onRenameColumn: submitRename, boardSummary }
}
