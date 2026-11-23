import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { AuthRequestState } from '../hooks/authRequestReducer'
import {
  useLoginViewModel,
  type LoginViewModelParams,
} from '../hooks/useLoginViewModel'
import type { ServerFieldError } from '../utils/fieldErrorText'
import type { LoginFormValues } from '../utils/loginForm'
import { AuthBanner } from './AuthBanner'
import { AuthLayout } from './AuthLayout'
import { AuthSwitchLink, type RenderAuthLink } from './AuthSwitchLink'
import { LoginForm } from './LoginForm'

export type LoginRootProps = LoginViewModelParams & {
  renderRegisterLink: RenderAuthLink
}

export function LoginRoot({
  logIn,
  onLoggedIn,
  isSessionExpired,
  renderRegisterLink,
}: LoginRootProps) {
  const { state, submit, edit } = useLoginViewModel({
    logIn,
    onLoggedIn,
    isSessionExpired,
  })
  return (
    <LoginScreen
      state={state}
      onSubmit={submit}
      onEdit={edit}
      renderRegisterLink={renderRegisterLink}
    />
  )
}

type LoginScreenProps = {
  state: AuthRequestState
  onSubmit: (values: LoginFormValues) => Promise<ServerFieldError[]>
  onEdit: () => void
  renderRegisterLink: RenderAuthLink
}

export function LoginScreen({
  state,
  onSubmit,
  onEdit,
  renderRegisterLink,
}: LoginScreenProps) {
  const { t } = useTranslation('auth')
  const titleId = useId()

  return (
    <AuthLayout
      titleId={titleId}
      title={t('login.title')}
      footer={
        <AuthSwitchLink
          i18nKey="login.noAccount"
          renderLink={renderRegisterLink}
        />
      }
    >
      <LoginForm
        titleId={titleId}
        isSubmitting={state.isSubmitting}
        isPasswordInvalid={state.banner === 'invalidCredentials'}
        banner={<AuthBanner banner={state.banner} />}
        onSubmit={onSubmit}
        onEdit={onEdit}
      />
    </AuthLayout>
  )
}
