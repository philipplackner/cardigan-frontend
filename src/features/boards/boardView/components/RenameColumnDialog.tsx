import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, Field, Input } from '@/core/ui'
import { nameErrorMessageKey } from '../../utils/boardName'
import { useLastPresent } from '../../hooks/useLastPresent'
import { useOpenSession } from '../../hooks/useOpenSession'
import { isComposing } from '../utils/isComposing'
import { checkColumnName, COLUMN_NAME_MAX } from '../utils/limits'

type RenameColumnDialogProps = {
  /** The column to rename. `null` closes the dialog. */
  column: { id: string; name: string } | null
  isSaving: boolean
  /** Saves the normalized name. Resolves with the error to show under the field, if any. */
  onSubmit: (name: string) => Promise<string | undefined>
  onCancel: () => void
}

export function RenameColumnDialog({
  column,
  isSaving,
  onSubmit,
  onCancel,
}: RenameColumnDialogProps) {
  const shownColumn = useLastPresent(column)
  const session = useOpenSession(column !== null)
  if (!shownColumn) return null
  return (
    <RenameColumnForm
      key={session}
      open={column !== null}
      name={shownColumn.name}
      isSaving={isSaving}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  )
}

type RenameColumnFormProps = {
  open: boolean
  name: string
  isSaving: boolean
  onSubmit: (name: string) => Promise<string | undefined>
  onCancel: () => void
}

function RenameColumnForm({
  open,
  name,
  isSaving,
  onSubmit,
  onCancel,
}: RenameColumnFormProps) {
  const { t } = useTranslation('boardView')
  const { t: tCommon } = useTranslation()
  const formId = useId()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<{ name: string }>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { name },
  })

  const submit = handleSubmit(async (values) => {
    const error = await onSubmit(checkColumnName(values.name).value)
    if (error) setError('name', { type: 'server', message: error })
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isSaving) onCancel()
      }}
      title={t('renameColumn.title')}
      actions={
        <>
          <Button
            variant="secondary"
            className="phone:flex-1"
            disabled={isSaving}
            onClick={onCancel}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            type="submit"
            form={formId}
            className="phone:flex-1"
            isLoading={isSaving}
            disabled={errors.name !== undefined}
          >
            {t('renameColumn.submit')}
          </Button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
        <Field label={t('renameColumn.nameLabel')} error={errors.name?.message}>
          <Input
            {...register('name', {
              validate: (value) => {
                const { error } = checkColumnName(value)
                return error
                  ? tCommon(nameErrorMessageKey(error), { n: COLUMN_NAME_MAX })
                  : true
              },
            })}
            disabled={isSaving}
            autoComplete="off"
            onKeyDown={(event) => {
              if (isComposing(event) && event.key === 'Enter') {
                event.preventDefault()
              }
            }}
          />
        </Field>
      </form>
    </Dialog>
  )
}
