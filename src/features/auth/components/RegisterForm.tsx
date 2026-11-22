import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Field, Input } from '@/core/ui'
import { fieldErrorText, type ServerFieldError } from '../utils/fieldErrorText'
import {
  registerFormSchema,
  type RegisterFormValues,
} from '../utils/registerForm'
import { PasswordRules } from './PasswordRules'

type RegisterFormProps = {
  titleId: string
  isSubmitting: boolean
  banner: ReactNode
  onSubmit: (values: RegisterFormValues) => Promise<ServerFieldError[]>
  onEdit: () => void
}

export function RegisterForm({
  titleId,
  isSubmitting,
  banner,
  onSubmit,
  onEdit,
}: RegisterFormProps) {
  const { t } = useTranslation('auth')
  const {
    control,
    register,
    handleSubmit,
    setError,
    trigger,
    getFieldState,
    formState,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '', repeatPassword: '' },
  })
  const { errors } = formState

  const submit = handleSubmit(async (values) => {
    for (const { field, message } of await onSubmit(values)) {
      setError(field, { type: 'server', message })
    }
  })

  const onPasswordChange = () => {
    onEdit()
    // Not `deps`: that would also validate an untouched repeat field.
    if (getFieldState('repeatPassword').isTouched || formState.isSubmitted) {
      void trigger('repeatPassword')
    }
  }

  return (
    <form
      aria-labelledby={titleId}
      noValidate
      onSubmit={(event) => void submit(event)}
      className="flex flex-col gap-18 tablet:gap-16"
    >
      {banner}
      <Field
        label={t('register.email')}
        error={fieldErrorText(t, errors.email?.message)}
      >
        <Input
          type="email"
          autoComplete="username"
          placeholder={t('register.emailPlaceholder')}
          disabled={isSubmitting}
          {...register('email', { onChange: onEdit })}
        />
      </Field>
      <Field
        label={t('register.password')}
        error={fieldErrorText(t, errors.password?.message)}
        description={<PasswordRules control={control} />}
      >
        <Input
          type="password"
          autoComplete="new-password"
          placeholder={t('register.passwordPlaceholder')}
          disabled={isSubmitting}
          isInvalid={Boolean(errors.password)}
          {...register('password', { onChange: onPasswordChange })}
        />
      </Field>
      <Field
        label={t('register.repeatPassword')}
        error={fieldErrorText(t, errors.repeatPassword?.message)}
      >
        <Input
          type="password"
          autoComplete="new-password"
          placeholder={t('register.repeatPasswordPlaceholder')}
          disabled={isSubmitting}
          {...register('repeatPassword', { onChange: onEdit })}
        />
      </Field>
      <Button type="submit" isLoading={isSubmitting} className="w-full">
        {isSubmitting ? t('register.submitting') : t('register.submit')}
      </Button>
    </form>
  )
}
