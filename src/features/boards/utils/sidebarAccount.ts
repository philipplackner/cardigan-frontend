import type { TFunction } from 'i18next'

type Account = {
  /** `null` while the session is still loading it. */
  email: string | null
  onLogOut: () => void
}

/** Props for the sidebar's account footer: the email, its first character as the avatar initial, and log out. */
export function sidebarAccount(account: Account, t: TFunction<'boards'>) {
  const firstCharacter = account.email ? [...account.email][0] : undefined
  return {
    email: account.email || null,
    initial: firstCharacter ? firstCharacter.toUpperCase() : null,
    logOutLabel: t('logOut'),
    onLogOut: account.onLogOut,
  }
}
