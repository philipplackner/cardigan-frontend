import { Children, type ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'

/** Renders the link to the other auth screen. The host passes a router link or, on the preview page, a button. */
export type RenderAuthLink = (label: string) => ReactNode

type LinkSlotProps = {
  render: RenderAuthLink
  children?: ReactNode
}

function LinkSlot({ render, children }: LinkSlotProps) {
  return (
    <span className="type-sans-13.5-medium-145 text-accent">
      {render(Children.toArray(children).join(''))}
    </span>
  )
}

type AuthSwitchLinkProps = {
  i18nKey: 'login.noAccount' | 'register.haveAccount'
  renderLink: RenderAuthLink
}

/** The sentence below the card, such as "No account yet? Create one", with the link text kept in the translation. */
export function AuthSwitchLink({ i18nKey, renderLink }: AuthSwitchLinkProps) {
  const { t } = useTranslation('auth')
  return (
    <Trans
      t={t}
      i18nKey={i18nKey}
      // Not <link>: Trans parses it as a void HTML tag and drops the link text.
      components={{ action: <LinkSlot render={renderLink} /> }}
    />
  )
}
