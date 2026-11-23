import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AppBar, ChevronLeftIcon, IconButton } from '@/core/ui'

type BoardAppBarContentProps = {
  header: { name: string; key: string } | null
  cardCount: number | null
  onBack: () => void
  /** The board menu. Left out until the board has loaded. */
  menu?: ReactNode
}

/** The phone app bar. It has no refresh control: the browser reload covers it on web phones (F5). */
export function BoardAppBarContent({
  header,
  cardCount,
  onBack,
  menu,
}: BoardAppBarContentProps) {
  const { t } = useTranslation('boardView')
  const subtitle =
    header && cardCount
      ? t('subtitle', {
          key: header.key,
          cards: t('cardCount', { count: cardCount }),
        })
      : header?.key
  return (
    <AppBar
      type="title"
      title={header?.name ?? ''}
      subtitle={subtitle}
      leading={
        <IconButton
          size="large"
          icon={ChevronLeftIcon}
          label={t('back')}
          onClick={onBack}
        />
      }
      actions={menu}
    />
  )
}
