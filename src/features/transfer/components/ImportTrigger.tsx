import { useTranslation } from 'react-i18next'
import { Button, UploadIcon } from '@/core/ui'
import { useImportFlow } from '../hooks/useImportFlow'
import type { ImportFlowParams } from '../hooks/useImportViewModel'

/** The board list header's "Import" button with its dialogs. */
export function ImportTrigger(props: ImportFlowParams) {
  const { t } = useTranslation('transfer')
  const { open, dialogs } = useImportFlow(props)
  return (
    <>
      <Button variant="secondary" icon={UploadIcon} onClick={open}>
        {t('import.button')}
      </Button>
      {dialogs}
    </>
  )
}
