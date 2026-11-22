import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, Field, Input } from '@/core/ui'
import { useRenameBoard } from '../api/boardsQueries'
import type { BoardDialogResult } from '../hooks/boardDialogResult'
import { useLastPresent } from '../hooks/useLastPresent'
import type { BoardSummary } from '../types'

type RenameBoardDialogProps = {
  /** The board to rename. `null` closes the dialog. */
  board: BoardSummary | null
  onClose: (result: BoardDialogResult) => void
}

export function RenameBoardDialog({
  board: currentBoard,
  onClose,
}: RenameBoardDialogProps) {
  const { t } = useTranslation('boards')
  const { t: tCommon } = useTranslation()
  const board = useLastPresent(currentBoard)
  const formId = useId()
  const renameBoard = useRenameBoard()
  const [name, setName] = useState(board?.name ?? '')
  const [shownBoardId, setShownBoardId] = useState(board?.id)
  if (board && board.id !== shownBoardId) {
    setShownBoardId(board.id)
    setName(board.name)
  }

  return (
    <Dialog
      open={currentBoard !== null}
      onOpenChange={(open) => {
        if (!open) onClose({ kind: 'unchanged' })
      }}
      title={t('renameDialog.title')}
      actions={
        <>
          <Button
            variant="secondary"
            className="phone:flex-1"
            onClick={() => onClose({ kind: 'unchanged' })}
          >
            {tCommon('cancel')}
          </Button>
          <Button type="submit" form={formId} className="phone:flex-1">
            {t('renameDialog.submit')}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        className="flex flex-col gap-16"
        onSubmit={(event) => {
          event.preventDefault()
          if (!board) return
          renameBoard.mutate(
            { id: board.id, name },
            {
              onSuccess: (renamed) =>
                onClose({ kind: 'renamed', board: renamed }),
            },
          )
        }}
      >
        <Field label={t('nameLabel')}>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label={t('keyLabel')}>
          <Input value={board?.key ?? ''} disabled readOnly />
        </Field>
      </form>
    </Dialog>
  )
}
