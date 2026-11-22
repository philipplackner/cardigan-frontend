import { useTranslation } from 'react-i18next'
import { Button, Dialog } from '@/core/ui'
import { useDeleteBoard } from '../api/boardsQueries'
import type { BoardDialogResult } from '../hooks/boardDialogResult'
import { useLastPresent } from '../hooks/useLastPresent'
import type { BoardSummary } from '../types'

type DeleteBoardDialogProps = {
  /** The board to delete. `null` closes the dialog. */
  board: BoardSummary | null
  onClose: (result: BoardDialogResult) => void
}

export function DeleteBoardDialog({
  board: currentBoard,
  onClose,
}: DeleteBoardDialogProps) {
  const { t } = useTranslation('boards')
  const { t: tCommon } = useTranslation()
  const board = useLastPresent(currentBoard)
  const deleteBoard = useDeleteBoard()

  const confirm = () => {
    if (!board) return
    deleteBoard.mutate(board.id, {
      onSuccess: () => onClose({ kind: 'deleted' }),
    })
  }

  return (
    <Dialog
      open={currentBoard !== null}
      onOpenChange={(open) => {
        if (!open) onClose({ kind: 'unchanged' })
      }}
      title={t('deleteDialog.title', { name: board?.name ?? '' })}
      description={t('deleteDialog.body', { count: board?.cardCount ?? 0 })}
      actions={
        <>
          <Button
            variant="secondary"
            className="phone:flex-1"
            onClick={() => onClose({ kind: 'unchanged' })}
          >
            {tCommon('cancel')}
          </Button>
          <Button variant="danger" className="phone:flex-1" onClick={confirm}>
            {t('deleteDialog.submit')}
          </Button>
        </>
      }
    />
  )
}
