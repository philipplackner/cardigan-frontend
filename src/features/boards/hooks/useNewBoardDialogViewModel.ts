import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/core/ui'
import { boardsErrorOf, useBoards, useCreateBoard } from '../api/boardsQueries'
import type { BoardFieldError, BoardSummary } from '../types'

type Params = {
  onCreated: (board: BoardSummary) => void
}

export type NewBoardValues = { name: string; key: string }

export type NewBoardState = {
  isSaving: boolean
  /** A failed create reloads the list; "Create board" waits for it so a retry sees current keys. */
  isWaitingForReload: boolean
  /** Keys of the loaded boards, or `null` while the list hasn't loaded. */
  existingKeys: ReadonlySet<string> | null
}

export function useNewBoardDialogViewModel({ onCreated }: Params) {
  const { t } = useTranslation('boards')
  const toast = useToast()
  const boards = useBoards()
  const createBoard = useCreateBoard()
  const [hasFailed, setHasFailed] = useState(false)

  const state: NewBoardState = {
    isSaving: createBoard.isPending,
    isWaitingForReload: hasFailed && boards.isFetching,
    existingKeys: boards.data
      ? new Set(boards.data.map((board) => board.key))
      : null,
  }

  /** Sends the create once. Resolves with the field errors to show, empty when there are none. */
  const create = async (values: NewBoardValues): Promise<BoardFieldError[]> => {
    setHasFailed(false)
    try {
      const board = await createBoard.mutateAsync(values)
      onCreated(board)
      return []
    } catch (error) {
      const failure = boardsErrorOf(error)
      if (failure.kind === 'sessionEnded') return []
      setHasFailed(true)
      const fieldErrors = failure.kind === 'invalid' ? failure.fields : []
      if (fieldErrors.length === 0) {
        toast.show({ type: 'error', message: t('newBoardDialog.failed') })
      }
      return fieldErrors
    }
  }

  return { state, create }
}
