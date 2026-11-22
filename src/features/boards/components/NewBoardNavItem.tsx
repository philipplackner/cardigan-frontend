import { useTranslation } from 'react-i18next'
import { NavItem, PlusIcon } from '@/core/ui'
import { useNewBoardDialog } from '../hooks/NewBoardDialogContext'

/** "+ New board" after the sidebar's board rows. Opens the shared New board dialog. */
export function NewBoardNavItem() {
  const { t } = useTranslation('boards')
  const { openNewBoardDialog } = useNewBoardDialog()
  return (
    <NavItem label={t('sidebar.newBoard')} icon={PlusIcon} isDim asChild>
      <button type="button" onClick={openNewBoardDialog} />
    </NavItem>
  )
}
