import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  IconButton,
  Menu,
  MenuDivider,
  MenuItem,
  MoreIcon,
  RenameIcon,
  TrashIcon,
} from '@/core/ui'

type ColumnMenuProps = {
  columnId: string
  columnName: string
  isFirst: boolean
  isLast: boolean
  /** True while any column move runs. */
  isMoving: boolean
  onMoveLeft: () => void
  onMoveRight: () => void
  onRename: () => void
  onDelete: () => void
}

/** A column's ⋯ menu. Its dialogs render outside, because the menu unmounts on close. */
export function ColumnMenu({
  columnId,
  columnName,
  isFirst,
  isLast,
  isMoving,
  onMoveLeft,
  onMoveRight,
  onRename,
  onDelete,
}: ColumnMenuProps) {
  const { t } = useTranslation('boardView')
  const [isOpen, setIsOpen] = useState(false)
  return (
    <Menu
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <IconButton
          size="small"
          icon={MoreIcon}
          isSelected={isOpen}
          label={t('columnActions', { name: columnName })}
          data-column-menu={columnId}
        />
      }
    >
      <MenuItem
        icon={ArrowLeftIcon}
        label={t('columnMenu.moveLeft')}
        disabled={isFirst || isMoving}
        onSelect={onMoveLeft}
      />
      <MenuItem
        icon={ArrowRightIcon}
        label={t('columnMenu.moveRight')}
        disabled={isLast || isMoving}
        onSelect={onMoveRight}
      />
      <MenuItem
        icon={RenameIcon}
        label={t('columnMenu.rename')}
        onSelect={onRename}
      />
      <MenuDivider />
      <MenuItem
        icon={TrashIcon}
        variant="danger"
        label={t('columnMenu.delete')}
        onSelect={onDelete}
      />
    </Menu>
  )
}
