import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton, PageHeader, RefreshIcon, cn } from '@/core/ui'

type BoardHeaderProps = {
  header: { name: string; key: string } | null
  /** Left out when the board has no cards or hasn't loaded. */
  cardCount: number | null
  isRefreshing: boolean
  onRefresh: () => void
  /** The board menu. Left out until the board has loaded. */
  menu?: ReactNode
}

/** The board header on tablet and desktop. */
export function BoardHeader({
  header,
  cardCount,
  isRefreshing,
  onRefresh,
  menu,
}: BoardHeaderProps) {
  const { t } = useTranslation('boardView')
  return (
    <PageHeader
      className="phone:hidden"
      title={header?.name ?? ''}
      keyValue={header?.key}
      meta={cardCount ? t('cardCount', { count: cardCount }) : undefined}
      actions={
        <>
          <IconButton
            variant="boxed"
            icon={RefreshIcon}
            label={t('refresh')}
            aria-busy={isRefreshing || undefined}
            className={cn(isRefreshing && 'motion-safe:[&_svg]:animate-spin')}
            onClick={onRefresh}
          />
          {menu}
        </>
      }
    />
  )
}
