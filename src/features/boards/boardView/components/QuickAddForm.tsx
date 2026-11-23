import { useTranslation } from 'react-i18next'
import { Button, Field, TextArea } from '@/core/ui'
import { isComposing } from '../utils/isComposing'
import { InlineForm } from './InlineForm'

type QuickAddFormProps = {
  text: string
  /** Shown under the field. */
  error?: string
  isSaving: boolean
  onChange: (text: string) => void
  onSubmit: () => void
  /** Escape and Cancel: close and drop the text. */
  onCancel: () => void
  /** A click or focus move outside the form. */
  onOutside: () => void
}

/** Title-only quick add at the bottom of a column (D22). */
export function QuickAddForm({
  text,
  error,
  isSaving,
  onChange,
  onSubmit,
  onCancel,
  onOutside,
}: QuickAddFormProps) {
  const { t } = useTranslation('boardView')
  const { t: tCommon } = useTranslation()
  return (
    <InlineForm
      data-inline-form="quickAdd"
      isSaving={isSaving}
      className="flex flex-col gap-8"
      onSubmit={() => {
        if (!isSaving) onSubmit()
      }}
      onOutside={onOutside}
    >
      <Field label={t('quickAdd.titleLabel')} isLabelHidden error={error}>
        <TextArea
          data-inline-field
          value={text}
          disabled={isSaving}
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (isComposing(event)) return
            if (event.key === 'Enter') {
              // Titles are single-line, so Shift+Enter adds no line break either.
              event.preventDefault()
              if (!event.shiftKey && !isSaving) onSubmit()
            } else if (event.key === 'Escape' && !isSaving) {
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
          {t('quickAdd.submit')}
        </Button>
        <Button
          variant="ghost"
          size="small"
          disabled={isSaving}
          onClick={onCancel}
        >
          {tCommon('cancel')}
        </Button>
        <span className="flex-1" />
        <span className="type-sans-12-regular-145 text-text-muted phone:hidden">
          {t('quickAdd.hint')}
        </span>
      </div>
    </InlineForm>
  )
}
