import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Field, Input } from '@/core/ui'
import { fieldErrorText, type ServerFieldError } from '../utils/fieldErrorText'
import { loginFormSchema, type LoginFormValues } from '../utils/loginForm'

type LoginFormProps = {
  titleId: string
  isSubmitting: boolean
  /** Wrong credentials mark the password without a form error, so the next edit clears it with the banner. */
  isPasswordInvalid: boolean
  /** Banner above the fields. */
  banner: ReactNode
  onSubmit: (values: LoginFormValues) => Promise<ServerFieldError[]>
  onEdit: () => void
}

export function LoginForm({
  titleId,
  isSubmitting,
  isPasswordInvalid,
  banner,
  onSubmit,
  onEdit,
}: LoginFormProps) {
  const { t } = useTranslation('auth')
  const { register, handleSubmit, setError, formState } =
    useForm<LoginFormValues>({
      resolver: zodResolver(loginFormSchema),
      mode: 'onTouched',
      reValidateMode: 'onChange',
      defaultValues: { email: '', password: '' },
    })
  const { errors } = formState

  const submit = handleSubmit(async (values) => {
    for (const { field, message } of await onSubmit(values)) {
      setError(field, { type: 'server', message })
    }
  })

  return (
    <form
      aria-labelledby={titleId}
      noValidate
      onSubmit={(event) => void submit(event)}
      className="flex flex-col gap-18 tablet:gap-16"
    >
      {banner}
      <Field
        label={t('login.email')}
        error={fieldErrorText(t, errors.email?.message)}
      >
        <Input
          type="email"
          autoComplete="username"
          placeholder={t('login.emailPlaceholder')}
          disabled={isSubmitting}
          {...register('email', { onChange: onEdit })}
        />
      </Field>
      <Field
        label={t('login.password')}
        error={fieldErrorText(t, errors.password?.message)}
      >
        <Input
          type="password"
          autoComplete="current-password"
          placeholder={t('login.passwordPlaceholder')}
          disabled={isSubmitting}
          isInvalid={Boolean(errors.password) || isPasswordInvalid}
          {...register('password', { onChange: onEdit })}
        />
      </Field>
      <Button type="submit" isLoading={isSubmitting} className="w-full">
        {isSubmitting ? t('login.submitting') : t('login.submit')}
      </Button>
    </form>
  )
}
