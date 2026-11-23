import { useTranslation } from 'react-i18next'
import {
  IconButton,
  LabelIcon,
  LogOutIcon,
  Menu,
  MenuDivider,
  MenuHeader,
  MenuItem,
  MoreIcon,
  UploadIcon,
} from '@/core/ui'

type PhoneMenuProps = {
  /** `null` while the session is still loading it; the "Signed in as" line is then hidden. */
  email: string | null
  onImport: () => void
  onOpenLabels: () => void
  onLogOut: () => void
}

/** The phone app bar's ⋯ menu. The import dialogs render outside, because the menu unmounts on close. */
export function PhoneMenu({
  email,
  onImport,
  onOpenLabels,
  onLogOut,
}: PhoneMenuProps) {
  const { t } = useTranslation('boards')
  return (
    <Menu
      trigger={
        <IconButton size="large" icon={MoreIcon} label={t('phoneMenu.label')} />
      }
    >
      {email && (
        <MenuHeader
          label={t('phoneMenu.signedInAs', { email })}
          className="flex min-h-[60px] items-center"
        />
      )}
      <MenuItem
        icon={UploadIcon}
        label={t('importMenuItem')}
        onSelect={onImport}
      />
      <MenuItem
        icon={LabelIcon}
        label={t('phoneMenu.labels')}
        onSelect={onOpenLabels}
      />
      <MenuDivider />
      <MenuItem icon={LogOutIcon} label={t('logOut')} onSelect={onLogOut} />
    </Menu>
  )
}
