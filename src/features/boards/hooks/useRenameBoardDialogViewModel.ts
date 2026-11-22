import { useTranslation } from 'react-i18next'
import { useToast } from '@/core/ui'
import { normalizeText } from '@/core/utils/text'
import { boardsErrorOf, useRenameBoard } from '../api/boardsQueries'
import type { BoardFieldError, BoardSummary } from '../types'
import type { BoardDialogResult } from './boardDialogResult'

type Params = {
  board: BoardSummary | null
  onClose: (result: BoardDialogResult) => void
}

export function useRenameBoardDialogViewModel({ board, onClose }: Params) {
  const { t } = useTranslation('boards')
  const toast = useToast()
  const renameBoard = useRenameBoard()

  /** Saves the name. Resolves with the field errors to show, empty when there are none. */
  const save = async (name: string): Promise<BoardFieldError[]> => {
    if (!board) return []
    if (normalizeText(name, 'singleLine') === board.name) {
      onClose({ kind: 'unchanged' })
      return []
    }
    try {
      const renamed = await renameBoard.mutateAsync({ id: board.id, name })
      onClose({
        kind: 'renamed',
        board: { ...board, name: renamed.name, updatedAt: renamed.updatedAt },
      })
      return []
    } catch (error) {
      const failure = boardsErrorOf(error)
      switch (failure.kind) {
        case 'sessionEnded':
          return []
        case 'notFound':
          onClose({ kind: 'deleted' })
          toast.show({
            type: 'error',
            message: t('renameDialog.notFound', { name: board.name }),
          })
          return []
        case 'invalid': {
          const nameErrors = failure.fields.filter(
            (field) => field.field === 'name',
          )
          if (nameErrors.length > 0) return nameErrors
          break
        }
        case 'other':
          break
      }
      toast.show({ type: 'error', message: t('renameDialog.failed') })
      return []
    }
  }

  return { isSaving: renameBoard.isPending, save }
}
