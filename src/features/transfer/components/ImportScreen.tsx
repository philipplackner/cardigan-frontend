import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Banner, Button, Dialog, DropZone, FileRow } from '@/core/ui'
import type { ImportBoxError, ImportReducerState } from '../hooks/importReducer'
import { formatFileSize } from '../utils/formatFileSize'

export type ImportScreenAction =
  | { type: 'filesChoose'; files: File[] }
  | { type: 'cancel' }
  | { type: 'keyChange'; value: string }
  | { type: 'clashSubmit' }

type ImportScreenProps = {
  state: ImportReducerState
  onAction: (action: ImportScreenAction) => void
}

function carriesFiles(event: DragEvent) {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files')
}

/** Stops the browser from opening a file dropped next to the drop zone. */
function useBlockStrayFileDrops(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return
    const block = (event: DragEvent) => {
      if (carriesFiles(event)) event.preventDefault()
    }
    window.addEventListener('dragover', block)
    window.addEventListener('drop', block)
    return () => {
      window.removeEventListener('dragover', block)
      window.removeEventListener('drop', block)
    }
  }, [isActive])
}

function ErrorText({ error, file }: { error: ImportBoxError; file?: File }) {
  const { t } = useTranslation('transfer')
  switch (error) {
    case 'tooLarge':
      return t('import.tooLarge', { size: formatFileSize(file?.size ?? 0) })
    case 'invalidFile':
      return t('import.invalidFile')
    case 'other':
      return t('import.failed')
  }
}

export function ImportScreen({ state, onAction }: ImportScreenProps) {
  const { t } = useTranslation('transfer')
  const { t: tCommon } = useTranslation()
  const isChoosing = state.step === 'choosing' || state.step === 'checking'
  const failed = state.step === 'choosing' && state.error ? state : null
  useBlockStrayFileDrops(isChoosing)

  return (
    <>
      <Dialog
        open={isChoosing}
        onOpenChange={(open) => {
          if (!open) onAction({ type: 'cancel' })
        }}
        title={t('import.title')}
        description={t('import.description')}
        actions={
          <Button
            variant="secondary"
            className="phone:w-full"
            onClick={() => onAction({ type: 'cancel' })}
          >
            {tCommon('cancel')}
          </Button>
        }
      >
        <DropZone
          title={t('import.dropTitle')}
          overTitle={t('import.dropOverTitle')}
          hintPrefix={t('import.dropHintPrefix')}
          browseLabel={t('import.browse')}
          accept=".json,application/json"
          onFiles={(files) => onAction({ type: 'filesChoose', files })}
        />
        {failed?.file && (
          <FileRow
            name={failed.file.name}
            sizeText={formatFileSize(failed.file.size)}
          />
        )}
        {failed?.error && (
          <Banner type="error" role="alert">
            <ErrorText error={failed.error} file={failed.file} />
          </Banner>
        )}
        <p className="type-sans-12-regular-145 text-text-muted">
          {t('import.hint')}
        </p>
      </Dialog>
      <Dialog
        open={state.step === 'uploading'}
        onOpenChange={() => {}}
        type="progress"
        title={t('import.progressTitle', {
          fileName: state.step === 'uploading' ? state.file.name : '',
        })}
        description={t('import.progressBody')}
      />
    </>
  )
}
