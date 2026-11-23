import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Brand, cn } from '@/core/ui'

type AuthLayoutProps = {
  /** The id the form uses to name itself after the title. */
  titleId: string
  title: string
  /** The form, with the banner, fields and button. */
  children: ReactNode
  /** The sentence with the link to the other auth screen. */
  footer: ReactNode
  className?: string
}

/** Figma "Auth": brand, title and form at the top on phones; brand and a centered card from tablet up. */
export function AuthLayout({
  titleId,
  title,
  children,
  footer,
  className,
}: AuthLayoutProps) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'flex min-h-dvh w-full flex-col bg-background-app px-20 py-24 tablet:items-center tablet:justify-center tablet:p-24',
        className,
      )}
    >
      <div className="flex w-full flex-col gap-22 pt-28 tablet:w-auth-card tablet:gap-18 tablet:pt-0">
        <div className="flex tablet:justify-center">
          <Brand name={t('appName')} size="auth" />
        </div>
        <div className="flex flex-col gap-18 tablet:gap-16 tablet:rounded-12 tablet:border tablet:border-border tablet:bg-background-surface tablet:p-25 tablet:shadow-small">
          <h1 id={titleId} className="type-page-title text-text-primary">
            {title}
          </h1>
          {children}
        </div>
        <p className="text-center type-sans-13.5-regular-145 text-text-muted">
          {footer}
        </p>
      </div>
    </div>
  )
}
