import { useId, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, Field, Input } from '@/core/ui'
import { checkBoardKey, normalizeKeyInput } from '@/core/utils/boardKey'
import {
  useNewBoardDialogViewModel,
  type NewBoardState,
  type NewBoardValues,
} from '../hooks/useNewBoardDialogViewModel'
import type { BoardFieldError, BoardSummary } from '../types'
import { checkBoardName } from '../utils/boardName'
import { keyFromName } from '../utils/keyFromName'
import { useKeyErrorText, useNameErrorText } from './useFieldErrorText'

type NewBoardDialogProps = {
  open: boolean
  onClose: () => void
  onBoardCreated: (board: BoardSummary) => void
}

export function NewBoardDialog({
  open,
  onClose,
  onBoardCreated,
}: NewBoardDialogProps) {
  const { state, create } = useNewBoardDialogViewModel({
    onCreated: (board) => {
      onClose()
      onBoardCreated(board)
    },
  })
  return (
    <NewBoardDialogScreen
      open={open}
      state={state}
      onSubmit={create}
      onClose={onClose}
    />
  )
}

type NewBoardDialogScreenProps = {
  open: boolean
  state: NewBoardState
  /** Resolves with the server's field errors, empty when there are none. */
  onSubmit: (values: NewBoardValues) => Promise<BoardFieldError[]>
  onClose: () => void
}

export function NewBoardDialogScreen({
  open,
  state,
  onSubmit,
  onClose,
}: NewBoardDialogScreenProps) {
  const { t } = useTranslation('boards')
  const { t: tCommon } = useTranslation()
  const nameErrorText = useNameErrorText()
  const keyErrorText = useKeyErrorText()
  const formId = useId()
  const [isKeyEdited, setIsKeyEdited] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors, isSubmitted },
  } = useForm<NewBoardValues>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { name: '', key: '' },
  })
  const key = useWatch({ control, name: 'key' })
  const { isSaving, isWaitingForReload, existingKeys } = state

  const nameField = register('name', {
    validate: (value) => {
      const { error } = checkBoardName(value)
      return error ? nameErrorText(error) : true
    },
    onChange: (event: { target: HTMLInputElement }) => {
      if (isKeyEdited) return
      setValue('key', keyFromName(event.target.value), {
        shouldValidate: isSubmitted,
      })
    },
  })
  const keyField = register('key', {
    validate: (value) => {
      const error = checkBoardKey(value)
      if (error) return keyErrorText(error, value)
      if (existingKeys?.has(value)) return keyErrorText('ALREADY_USED', value)
      return true
    },
  })

  const submit = handleSubmit(async ({ name, key }) => {
    const fieldErrors = await onSubmit({
      name: checkBoardName(name).value,
      key,
    })
    for (const fieldError of fieldErrors) {
      setError(fieldError.field, {
        type: 'server',
        message:
          fieldError.field === 'name'
            ? nameErrorText(fieldError.code, fieldError.max)
            : keyErrorText(fieldError.code, key),
      })
    }
  })

  const hasError = Object.keys(errors).length > 0

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isSaving) onClose()
      }}
      title={t('newBoardDialog.title')}
      actions={
        <>
          <Button
            variant="secondary"
            className="phone:flex-1"
            disabled={isSaving}
            onClick={onClose}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            type="submit"
            form={formId}
            className="phone:flex-1"
            isLoading={isSaving}
            disabled={hasError || isWaitingForReload}
          >
            {t('newBoardDialog.submit')}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        className="flex flex-col gap-16"
        onSubmit={(event) => void submit(event)}
      >
        <Field label={t('nameLabel')} error={errors.name?.message}>
          <Input {...nameField} disabled={isSaving} autoComplete="off" />
        </Field>
        <Field
          label={t('keyLabel')}
          error={errors.key?.message}
          description={
            errors.key ? undefined : (
              <p className="type-sans-12-regular-145 text-text-muted">
                {key
                  ? t('newBoardDialog.keyHint', { key })
                  : t('newBoardDialog.keyHintEmpty')}
              </p>
            )
          }
        >
          <Input
            {...keyField}
            onChange={(event) => {
              setIsKeyEdited(true)
              const input = event.target
              const normalized = normalizeKeyInput(input.value)
              if (normalized !== input.value) {
                const { selectionStart, selectionEnd } = input
                input.value = normalized
                input.setSelectionRange(selectionStart, selectionEnd)
              }
              void keyField.onChange(event)
            }}
            disabled={isSaving}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
        </Field>
        <p className="type-sans-12.5-regular-145 text-text-muted">
          {t('newBoardDialog.columnsNote')}
        </p>
      </form>
    </Dialog>
  )
}
