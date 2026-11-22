import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { AuthRequestState } from '../hooks/authRequestReducer'
import {
  useRegisterViewModel,
  type RegisterViewModelParams,
} from '../hooks/useRegisterViewModel'
import type { ServerFieldError } from '../utils/fieldErrorText'
import type { RegisterFormValues } from '../utils/registerForm'
import { AuthBanner } from './AuthBanner'
import { AuthLayout } from './AuthLayout'
import { AuthSwitchLink, type RenderAuthLink } from './AuthSwitchLink'
import { RegisterForm } from './RegisterForm'

export type RegisterRootProps = RegisterViewModelParams & {
  renderLogInLink: RenderAuthLink
}

export function RegisterRoot({
  register,
  onRegistered,
  renderLogInLink,
}: RegisterRootProps) {
  const { state, submit, edit } = useRegisterViewModel({
    register,
    onRegistered,
  })
  return (
    <RegisterScreen
      state={state}
      onSubmit={submit}
      onEdit={edit}
      renderLogInLink={renderLogInLink}
    />
  )
}

type RegisterScreenProps = {
  state: AuthRequestState
  onSubmit: (values: RegisterFormValues) => Promise<ServerFieldError[]>
  onEdit: () => void
  renderLogInLink: RenderAuthLink
}

export function RegisterScreen({
  state,
  onSubmit,
  onEdit,
  renderLogInLink,
}: RegisterScreenProps) {
  const { t } = useTranslation('auth')
  const titleId = useId()

  return (
    <AuthLayout
      titleId={titleId}
      title={t('register.title')}
      footer={
        <AuthSwitchLink
          i18nKey="register.haveAccount"
          renderLink={renderLogInLink}
        />
      }
    >
      <RegisterForm
        titleId={titleId}
        isSubmitting={state.isSubmitting}
        banner={<AuthBanner banner={state.banner} />}
        onSubmit={onSubmit}
        onEdit={onEdit}
      />
    </AuthLayout>
  )
}
