import { useTranslation } from 'react-i18next'
import { Button, Field, Input } from '@/core/ui'
import { isComposing } from '../utils/isComposing'
import { InlineForm } from './InlineForm'

type AddColumnFormProps = {
  text: string
  error?: string
  isSaving: boolean
  onChange: (text: string) => void
  onSubmit: () => void
  onCancel: () => void
  onOutside: () => void
}

/** The inline form after the last column, or in place of the no-columns empty state. */
export function AddColumnForm({
  text,
  error,
  isSaving,
  onChange,
  onSubmit,
  onCancel,
  onOutside,
}: AddColumnFormProps) {
  const { t } = useTranslation('boardView')
  const { t: tCommon } = useTranslation()
  return (
    <InlineForm
      data-inline-form="addColumn"
      isSaving={isSaving}
      className="flex w-[276px] flex-col gap-8 rounded-10 border border-border bg-background-column p-9 phone:w-[300px]"
      onSubmit={() => {
        if (!isSaving) onSubmit()
      }}
      onOutside={onOutside}
    >
      <Field label={t('addColumnForm.nameLabel')} isLabelHidden error={error}>
        <Input
          data-inline-field
          value={text}
          disabled={isSaving}
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (isComposing(event)) {
              if (event.key === 'Enter') event.preventDefault()
              return
            }
            if (event.key === 'Escape' && !isSaving) {
              event.preventDefault()
              onCancel()
            }
          }}
        />
      </Field>
      <div className="flex items-center gap-6">
        <Button
          type="submit"
          size="small"
          isLoading={isSaving}
          disabled={error !== undefined}
        >
          {t('addColumnForm.submit')}
        </Button>
        <Button
          variant="ghost"
          size="small"
          disabled={isSaving}
          onClick={onCancel}
        >
          {tCommon('cancel')}
        </Button>
      </div>
    </InlineForm>
  )
}
