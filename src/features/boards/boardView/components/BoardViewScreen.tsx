import { useTranslation } from 'react-i18next'
import {
  AddColumnButton,
  AppBarSlot,
  Button,
  CloudOffIcon,
  ColumnsIcon,
  EmptyState,
  IconButton,
  MoreIcon,
  PlusIcon,
  RefreshIcon,
} from '@/core/ui'
import type {
  BoardViewAction,
  BoardViewState,
} from '../hooks/useBoardViewModel'
import type { BoardDetail } from '../types'
import { BoardAppBarContent } from './BoardAppBarContent'
import { BoardColumn } from './BoardColumn'
import { BoardColumns } from './BoardColumns'
import { BoardHeader } from './BoardHeader'
import { BoardSkeleton } from './BoardSkeleton'

type BoardViewScreenProps = {
  state: BoardViewState
  onAction: (action: BoardViewAction) => void
}

const countCards = (board: BoardDetail) =>
  board.columns.reduce((sum, column) => sum + column.cards.length, 0)

export function BoardViewScreen({ state, onAction }: BoardViewScreenProps) {
  const { t } = useTranslation('boardView')
  const { status, header } = state
  const board = status.type === 'ready' ? status.board : null
  const cardCount = board ? countCards(board) : null

  const boardMenu = (size: 'medium' | 'large') =>
    board && (
      <IconButton
        variant={size === 'medium' ? 'boxed' : undefined}
        size={size}
        icon={MoreIcon}
        label={t('boardActions')}
      />
    )

  const addColumnButton = <AddColumnButton label={t('addColumn')} />

  const content =
    status.type === 'loading' ? (
      <div aria-busy className="flex items-start gap-12 phone:gap-10">
        <BoardSkeleton />
      </div>
    ) : status.type === 'error' ? (
      <div className="flex flex-1 flex-col justify-center">
        <EmptyState
          type="error"
          icon={CloudOffIcon}
          title={t('loadError.title')}
          description={t('loadError.description')}
          actions={
            <Button
              variant="secondary"
              icon={RefreshIcon}
              onClick={() => onAction({ type: 'tryAgain' })}
            >
              {t('loadError.tryAgain')}
            </Button>
          }
        />
      </div>
    ) : status.board.columns.length === 0 ? (
      <div className="flex flex-1 flex-col justify-center">
        <EmptyState
          icon={ColumnsIcon}
          title={t('noColumns.title')}
          description={t('noColumns.description')}
          actions={<Button icon={PlusIcon}>{t('addColumn')}</Button>}
        />
      </div>
    ) : (
      <BoardColumns
        columns={status.board.columns}
        trailing={addColumnButton}
        renderColumn={(column) => (
          <BoardColumn
            key={column.id}
            boardKey={status.board.key}
            column={column}
            menu={
              <IconButton
                size="small"
                icon={MoreIcon}
                label={t('columnActions', { name: column.name })}
              />
            }
            onAddCard={() =>
              onAction({
                type: 'inlineOpen',
                target: { kind: 'quickAdd', columnId: column.id },
              })
            }
            onOpenCard={(cardId) => onAction({ type: 'openCard', cardId })}
          />
        )}
      />
    )

  return (
    <>
      <AppBarSlot>
        <BoardAppBarContent
          header={header}
          cardCount={cardCount}
          onBack={() => onAction({ type: 'back' })}
          menu={boardMenu('large')}
        />
      </AppBarSlot>
      <div className="flex h-full min-h-[0] flex-col">
        <BoardHeader
          header={header}
          cardCount={cardCount}
          isRefreshing={state.isRefreshing}
          onRefresh={() => onAction({ type: 'refresh' })}
          menu={boardMenu('medium')}
        />
        <div
          data-testid="board-content"
          className="flex min-h-[0] flex-1 flex-col overflow-auto px-20 py-16 phone:px-12 phone:pt-8 phone:pb-12"
        >
          {content}
        </div>
      </div>
    </>
  )
}
