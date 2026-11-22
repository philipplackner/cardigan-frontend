import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, Field, Input } from '@/core/ui'
import { boardKeyErrorMessageKey } from '@/core/utils/boardKey'
import type { ImportReducerState } from '../hooks/importReducer'
import { useLastPresent } from '../hooks/useLastPresent'
import type { ImportScreenAction } from './ImportScreen'

type ClashState = Extract<ImportReducerState, { step: 'clash' }>

type ClashDialogProps = {
  state: ClashState | null
  onAction: (action: ImportScreenAction) => void
}

export function ClashDialog({
  state: currentState,
  onAction,
}: ClashDialogProps) {
  const { t } = useTranslation('transfer')
  const { t: tCommon } = useTranslation()
  const state = useLastPresent(currentState)
  const formId = useId()
  const clashingKey = state?.usedKeys.at(-1) ?? ''
  const isUsedKey = state ? state.usedKeys.includes(state.keyValue) : false
  const error = !state
    ? undefined
    : isUsedKey
      ? tCommon('keyErrors.alreadyUsed', { key: state.keyValue })
      : state.fieldError &&
        tCommon(boardKeyErrorMessageKey(state.fieldError.code))

  return (
    <Dialog
      open={currentState !== null}
      onOpenChange={(open) => {
        if (!open) onAction({ type: 'cancel' })
      }}
      title={t('clash.title')}
      description={
        state?.existingName
          ? t('clash.bodyNamed', { name: state.existingName, key: clashingKey })
          : t('clash.bodyUnnamed', { key: clashingKey })
      }
      actions={
        <>
          <Button
            variant="secondary"
            className="phone:flex-1"
            onClick={() => onAction({ type: 'cancel' })}
          >
            {t('clash.cancel')}
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={isUsedKey}
            className="phone:flex-1"
          >
            {t('clash.submit')}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          onAction({ type: 'clashSubmit' })
        }}
      >
        <Field
          label={t('clash.keyLabel')}
          error={error}
          description={
            <p className="type-sans-12-regular-145 text-text-muted">
              {t('clash.keyHelp')}
            </p>
          }
        >
          <Input
            value={state?.keyValue ?? ''}
            onChange={(event) =>
              onAction({ type: 'keyChange', value: event.target.value })
            }
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
        </Field>
      </form>
    </Dialog>
  )
}
