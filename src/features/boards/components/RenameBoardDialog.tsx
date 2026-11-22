import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, Field, Input } from '@/core/ui'
import type { BoardDialogResult } from '../hooks/boardDialogResult'
import { useLastPresent } from '../hooks/useLastPresent'
import { useOpenSession } from '../hooks/useOpenSession'
import { useRenameBoardDialogViewModel } from '../hooks/useRenameBoardDialogViewModel'
import type { BoardFieldError, BoardSummary } from '../types'
import { checkBoardName } from '../utils/boardName'
import { useNameErrorText } from './useFieldErrorText'

type RenameBoardDialogProps = {
  /** The board to rename. `null` closes the dialog. */
  board: BoardSummary | null
  /** Reports `renamed` with the updated board, `deleted` after a 404, or `unchanged`. */
  onClose: (result: BoardDialogResult) => void
}

export function RenameBoardDialog({ board, onClose }: RenameBoardDialogProps) {
  const { isSaving, save } = useRenameBoardDialogViewModel({ board, onClose })
  const shownBoard = useLastPresent(board)
  const session = useOpenSession(board !== null)
  if (!shownBoard) return null
  return (
    <RenameBoardDialogScreen
      key={session}
      open={board !== null}
      board={shownBoard}
      isSaving={isSaving}
      onSubmit={save}
      onCancel={() => onClose({ kind: 'unchanged' })}
    />
  )
}

type RenameBoardDialogScreenProps = {
  open: boolean
  board: BoardSummary
  isSaving: boolean
  /** Resolves with the server's field errors, empty when there are none. */
  onSubmit: (name: string) => Promise<BoardFieldError[]>
  onCancel: () => void
}

export function RenameBoardDialogScreen({
  open,
  board,
  isSaving,
  onSubmit,
  onCancel,
}: RenameBoardDialogScreenProps) {
  const { t } = useTranslation('boards')
  const { t: tCommon } = useTranslation()
  const nameErrorText = useNameErrorText()
  const formId = useId()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<{ name: string }>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { name: board.name },
  })

  const submit = handleSubmit(async ({ name }) => {
    const fieldErrors = await onSubmit(checkBoardName(name).value)
    for (const fieldError of fieldErrors) {
      setError('name', {
        type: 'server',
        message: nameErrorText(fieldError.code, fieldError.max),
      })
    }
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isSaving) onCancel()
      }}
      title={t('renameDialog.title')}
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
            {t('renameDialog.submit')}
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
          <Input
            {...register('name', {
              validate: (value) => {
                const { error } = checkBoardName(value)
                return error ? nameErrorText(error) : true
              },
            })}
            disabled={isSaving}
            autoComplete="off"
          />
        </Field>
        <Field
          label={t('keyLabel')}
          description={
            <p className="type-sans-12-regular-145 text-text-muted">
              {t('renameDialog.keyHint')}
            </p>
          }
        >
          {/* Figma draws the key read-only, not faded like other disabled inputs. */}
          <Input value={board.key} readOnly disabled className="opacity-100" />
        </Field>
      </form>
    </Dialog>
  )
}
