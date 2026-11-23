import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DownloadIcon,
  IconButton,
  Menu,
  MenuDivider,
  MenuItem,
  MoreIcon,
  RenameIcon,
  TrashIcon,
} from '@/core/ui'

type BoardViewMenuProps = {
  /** `boxed` in the tablet and desktop header, `appBar` in the phone app bar. */
  placement: 'header' | 'appBar'
  onRename: () => void
  onExport: () => void
  onDelete: () => void
}

/** The board's ⋯ menu. Its dialogs render outside, because the menu unmounts on close. */
export function BoardViewMenu({
  placement,
  onRename,
  onExport,
  onDelete,
}: BoardViewMenuProps) {
  const { t } = useTranslation('boardView')
  const [isOpen, setIsOpen] = useState(false)
  return (
    <Menu
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <IconButton
          variant={placement === 'header' ? 'boxed' : 'ghost'}
          size={placement === 'header' ? 'medium' : 'large'}
          icon={MoreIcon}
          isSelected={isOpen}
          label={t('boardActions')}
        />
      }
    >
      <MenuItem
        icon={RenameIcon}
        label={t('boardMenu.rename')}
        onSelect={onRename}
      />
      <MenuItem
        icon={DownloadIcon}
        label={t('boardMenu.export')}
        onSelect={onExport}
      />
      <MenuDivider />
      <MenuItem
        icon={TrashIcon}
        variant="danger"
        label={t('boardMenu.delete')}
        onSelect={onDelete}
      />
    </Menu>
  )
}
