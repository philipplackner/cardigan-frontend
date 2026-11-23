import { useTranslation } from 'react-i18next'
import { Button, Dialog } from '@/core/ui'
import { useLastPresent } from '../../hooks/useLastPresent'

type DeleteColumnDialogProps = {
  /** The column to delete. `null` closes the dialog. */
  column: { id: string; name: string; cardCount: number } | null
  isDeleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Always asks before deleting a column, also an empty one (D23). */
export function DeleteColumnDialog({
  column,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteColumnDialogProps) {
  const { t } = useTranslation('boardView')
  const { t: tCommon } = useTranslation()
  const shown = useLastPresent(column)
  if (!shown) return null
  return (
    <Dialog
      open={column !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isDeleting) onCancel()
      }}
      title={t('deleteColumn.title', { name: shown.name })}
      description={t('deleteColumn.body', { count: shown.cardCount })}
      actions={
        <>
          <Button
            variant="secondary"
            className="phone:basis-full"
            disabled={isDeleting}
            onClick={onCancel}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            variant="danger"
            className="phone:basis-full"
            isLoading={isDeleting}
            onClick={onConfirm}
          >
            {t('deleteColumn.submit', { count: shown.cardCount })}
          </Button>
        </>
      }
    />
  )
}
