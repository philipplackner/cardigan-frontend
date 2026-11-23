import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AddCardButton, Column } from '@/core/ui'
import type { BoardColumn as BoardColumnData } from '../types'
import { CardTile } from './CardTile'

type BoardColumnProps = {
  boardKey: string
  column: BoardColumnData
  /** The column menu. */
  menu: ReactNode
  /** Replaces the Add card button, for example with the quick add form. */
  footer?: ReactNode
  isAddCardDisabled?: boolean
  onAddCard: () => void
  onOpenCard: (cardId: string) => void
}

/** A column with its cards. Takes its data as props and has no drag code, so drag & drop can wrap it. */
export function BoardColumn({
  boardKey,
  column,
  menu,
  footer,
  isAddCardDisabled = false,
  onAddCard,
  onOpenCard,
}: BoardColumnProps) {
  const { t } = useTranslation('boardView')
  return (
    <Column
      name={column.name}
      count={column.cards.length}
      menu={menu}
      data-column-id={column.id}
      footer={
        footer ?? (
          <AddCardButton
            label={t('addCard')}
            aria-label={t('addCardTo', { name: column.name })}
            data-add-card={column.id}
            disabled={isAddCardDisabled}
            onClick={onAddCard}
          />
        )
      }
    >
      {column.cards.length === 0 ? (
        <p className="flex items-center justify-center rounded-8 border border-dashed border-border-strong px-7 py-15 text-center type-sans-12.5-regular-145 text-text-faint">
          {t('noCards')}
        </p>
      ) : (
        column.cards.map((card) => (
          <CardTile
            key={card.id}
            boardKey={boardKey}
            card={card}
            onOpen={onOpenCard}
          />
        ))
      )}
    </Column>
  )
}
