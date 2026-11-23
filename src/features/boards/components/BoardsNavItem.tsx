import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { BoardsIcon, NavItem } from '@/core/ui'

type BoardsNavItemProps = {
  /** True while the board list is open. */
  isCurrent: boolean
  /** The element that opens the board list, without children. */
  link: ReactElement
}

/** "All boards" in the sidebar's main navigation. */
export function BoardsNavItem({ isCurrent, link }: BoardsNavItemProps) {
  const { t } = useTranslation('boards')
  return (
    <NavItem
      label={t('sidebar.allBoards')}
      icon={BoardsIcon}
      isSelected={isCurrent}
      asChild
    >
      {link}
    </NavItem>
  )
}
