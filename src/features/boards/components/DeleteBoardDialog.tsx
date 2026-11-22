import { useTranslation } from 'react-i18next'
import { Button, Dialog } from '@/core/ui'
import type { BoardDialogResult } from '../hooks/boardDialogResult'
import { useDeleteBoardDialogViewModel } from '../hooks/useDeleteBoardDialogViewModel'
import { useLastPresent } from '../hooks/useLastPresent'
import type { BoardSummary } from '../types'

type DeleteBoardDialogProps = {
  /** The board to delete. `null` closes the dialog. */
  board: BoardSummary | null
  /** Reports `deleted` after a delete or a 404, `unchanged` after Cancel. */
  onClose: (result: BoardDialogResult) => void
}

export function DeleteBoardDialog({ board, onClose }: DeleteBoardDialogProps) {
  const { isDeleting, confirm } = useDeleteBoardDialogViewModel({
    board,
    onClose,
  })
  const shownBoard = useLastPresent(board)
  if (!shownBoard) return null
  return (
    <DeleteBoardDialogScreen
      open={board !== null}
      board={shownBoard}
      isDeleting={isDeleting}
      onConfirm={confirm}
      onCancel={() => onClose({ kind: 'unchanged' })}
    />
  )
}

type DeleteBoardDialogScreenProps = {
  open: boolean
  board: BoardSummary
  isDeleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteBoardDialogScreen({
  open,
  board,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteBoardDialogScreenProps) {
  const { t } = useTranslation('boards')
  const { t: tCommon } = useTranslation()
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isDeleting) onCancel()
      }}
      title={t('deleteDialog.title', { name: board.name })}
      description={t('deleteDialog.body', { count: board.cardCount })}
      actions={
        <>
          <Button
            variant="secondary"
            className="phone:flex-1"
            disabled={isDeleting}
            onClick={onCancel}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            variant="danger"
            className="phone:flex-1"
            isLoading={isDeleting}
            onClick={onConfirm}
          >
            {t('deleteDialog.submit')}
          </Button>
        </>
      }
    />
  )
}
