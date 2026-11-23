import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Dialog } from '@/core/ui'

type DiscardInlineDialogProps = {
  open: boolean
  /** The column of the open quick add, or `null` when the add column form is open. */
  quickAddColumnName: string | null
  onKeepEditing: () => void
  onDiscard: () => void
}

/**
 * Asks before another inline form replaces one with text (WBV-24), like the card detail's "Unsaved
 * changes" dialog. Focus goes to the kept or newly opened form, not back to the button pressed.
 */
export function DiscardInlineDialog({
  open,
  quickAddColumnName,
  onKeepEditing,
  onDiscard,
}: DiscardInlineDialogProps) {
  const { t } = useTranslation('boardView')
  // Keeps the body while the dialog animates out, after the form it names has closed.
  const [shownName, setShownName] = useState(quickAddColumnName)
  if (open && shownName !== quickAddColumnName) setShownName(quickAddColumnName)
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onKeepEditing()
      }}
      returnFocus={false}
      title={t('discardInline.title')}
      description={
        shownName === null
          ? t('discardInline.columnBody')
          : t('discardInline.cardBody', { column: shownName })
      }
      actions={
        <>
          <Button
            variant="secondary"
            className="phone:flex-1"
            onClick={onKeepEditing}
          >
            {t('discardInline.keepEditing')}
          </Button>
          <Button variant="danger" className="phone:flex-1" onClick={onDiscard}>
            {t('discardInline.discard')}
          </Button>
        </>
      }
    />
  )
}
