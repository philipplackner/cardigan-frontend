import { useTranslation } from 'react-i18next'
import { Card } from '@/core/ui'
import type { BoardCard } from '../types'
import { sortLabels } from '../utils/sortLabels'

type CardTileProps = {
  boardKey: string
  card: BoardCard
  onOpen: (cardId: string) => void
}

/** A card on the board. Takes its data as props and has no drag code, so drag & drop can wrap it. */
export function CardTile({ boardKey, card, onOpen }: CardTileProps) {
  const { t } = useTranslation('boardView')
  const displayId = `${boardKey}-${card.number}`
  const labels = sortLabels(card.labels)
  const name =
    labels.length > 0
      ? t('cardNameWithLabels', {
          displayId,
          title: card.title,
          labels: labels.map((label) => label.name).join(', '),
        })
      : t('cardName', { displayId, title: card.title })
  return (
    <Card
      displayId={displayId}
      title={card.title}
      labels={labels}
      aria-label={name}
      onClick={() => onOpen(card.id)}
    />
  )
}
