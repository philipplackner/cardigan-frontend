import { useTranslation } from 'react-i18next'
import { Banner } from '@/core/ui'
import type { AuthBanner as AuthBannerState } from '../hooks/authRequestReducer'
import { retryAfterText } from '../utils/retryAfterText'

type AuthBannerProps = {
  banner: AuthBannerState
}

/** Errors are announced as alerts. The session expired notice is a status. */
export function AuthBanner({ banner }: AuthBannerProps) {
  const { t } = useTranslation('auth')
  if (banner === null) return null
  if (banner === 'sessionExpired') {
    return (
      <Banner type="info" role="status">
        {t('banners.sessionExpired')}
      </Banner>
    )
  }
  const text =
    banner === 'invalidCredentials'
      ? t('banners.invalidCredentials')
      : banner === 'other'
        ? t('banners.other')
        : t('banners.rateLimited', { time: retryAfterText(t, banner.seconds) })
  return (
    <Banner type="error" role="alert">
      {text}
    </Banner>
  )
}
