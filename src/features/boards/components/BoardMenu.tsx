import { useTranslation } from 'react-i18next'
import {
  IconButton,
  Menu,
  MenuDivider,
  MenuItem,
  MoreIcon,
  RenameIcon,
  TrashIcon,
} from '@/core/ui'

type BoardMenuProps = {
  boardId: string
  boardName: string
  onRename: () => void
  onDelete: () => void
}

/** The ⋯ menu of a board tile or row. Its dialogs render outside, because the menu unmounts on close. */
export function BoardMenu({
  boardId,
  boardName,
  onRename,
  onDelete,
}: BoardMenuProps) {
  const { t } = useTranslation('boards')
  return (
    <Menu
      trigger={
        <IconButton
          icon={MoreIcon}
          label={t('boardActions', { name: boardName })}
          data-board-menu={boardId}
        />
      }
    >
      <MenuItem icon={RenameIcon} label={t('rename')} onSelect={onRename} />
      <MenuDivider />
      <MenuItem
        icon={TrashIcon}
        variant="danger"
        label={t('deleteBoard')}
        onSelect={onDelete}
      />
    </Menu>
  )
}
