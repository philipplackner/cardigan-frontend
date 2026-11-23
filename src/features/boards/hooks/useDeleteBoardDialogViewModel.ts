import { useTranslation } from 'react-i18next'
import { useToast } from '@/core/ui'
import { boardsErrorOf, useDeleteBoard } from '../api/boardsQueries'
import type { BoardSummary } from '../types'
import type { BoardDialogResult } from './boardDialogResult'

type Params = {
  board: BoardSummary | null
  onClose: (result: BoardDialogResult) => void
}

export function useDeleteBoardDialogViewModel({ board, onClose }: Params) {
  const { t } = useTranslation('boards')
  const toast = useToast()
  const deleteBoard = useDeleteBoard()

  const confirm = () => {
    if (!board) return
    deleteBoard.mutate(board.id, {
      onSuccess: () => onClose({ kind: 'deleted' }),
      onError: (error) => {
        if (boardsErrorOf(error).kind === 'sessionEnded') return
        toast.show({
          type: 'error',
          message: t('deleteDialog.failed', { name: board.name }),
        })
      },
    })
  }

  return { isDeleting: deleteBoard.isPending, confirm }
}
