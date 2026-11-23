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
import { AddColumnForm } from './AddColumnForm'
import { ColumnMenu } from './ColumnMenu'
import { DeleteColumnDialog } from './DeleteColumnDialog'
import { DiscardInlineDialog } from './DiscardInlineDialog'
import { RenameColumnDialog } from './RenameColumnDialog'
import { BoardAppBarContent } from './BoardAppBarContent'
import { BoardColumn } from './BoardColumn'
import { BoardColumns } from './BoardColumns'
import { BoardHeader } from './BoardHeader'
import { BoardSkeleton } from './BoardSkeleton'
import { QuickAddForm } from './QuickAddForm'
import { useFocusRequest } from './useFocusRequest'

type BoardViewScreenProps = {
  state: BoardViewState
  onAction: (action: BoardViewAction) => void
  /** Saves a column's new name. Resolves with the error to show under the field, if any. */
  onRenameColumn: (name: string) => Promise<string | undefined>
}

const countCards = (board: BoardDetail) =>
  board.columns.reduce((sum, column) => sum + column.cards.length, 0)

export function BoardViewScreen({
  state,
  onAction,
  onRenameColumn,
}: BoardViewScreenProps) {
  const { t } = useTranslation('boardView')
  const { status, header } = state
  const board = status.type === 'ready' ? status.board : null
  const cardCount = board ? countCards(board) : null
  useFocusRequest(state.ui.focusRequest)
  const dialogColumn = (kind: 'renameColumn' | 'deleteColumn') => {
    const dialog = state.ui.dialog
    if (dialog?.kind !== kind) return null
    return (
      board?.columns.find((column) => column.id === dialog.columnId) ?? null
    )
  }

  const boardMenu = (size: 'medium' | 'large') =>
    board && (
      <IconButton
        variant={size === 'medium' ? 'boxed' : undefined}
        size={size}
        icon={MoreIcon}
        label={t('boardActions')}
      />
    )

  const openAddColumn = () =>
    onAction({ type: 'inlineOpen', target: { kind: 'addColumn' } })
  const addColumnForm = state.ui.addColumn && (
    <AddColumnForm
      text={state.ui.addColumn.text}
      error={state.addColumnError}
      isSaving={state.isInlineSaving}
      onChange={(text) => onAction({ type: 'addColumnChange', text })}
      onSubmit={() => onAction({ type: 'addColumnSubmit' })}
      onCancel={() => onAction({ type: 'inlineClose' })}
      onOutside={() => onAction({ type: 'inlineOutside' })}
    />
  )
  const addColumnButton = (
    <AddColumnButton
      label={t('addColumn')}
      data-add-column
      disabled={state.isInlineSaving}
      onClick={openAddColumn}
    />
  )

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
      addColumnForm || (
        <div className="flex flex-1 flex-col justify-center">
          <EmptyState
            icon={ColumnsIcon}
            title={t('noColumns.title')}
            description={t('noColumns.description')}
            actions={
              <Button icon={PlusIcon} data-add-column onClick={openAddColumn}>
                {t('addColumn')}
              </Button>
            }
          />
        </div>
      )
    ) : (
      <BoardColumns
        columns={status.board.columns}
        trailing={addColumnForm || addColumnButton}
        renderColumn={(column, index) => (
          <BoardColumn
            key={column.id}
            boardKey={status.board.key}
            column={column}
            menu={
              <ColumnMenu
                columnId={column.id}
                columnName={column.name}
                isFirst={index === 0}
                isLast={index === status.board.columns.length - 1}
                isMoving={state.ui.movingColumnId !== null}
                onMoveLeft={() =>
                  onAction({
                    type: 'moveColumn',
                    columnId: column.id,
                    direction: 'left',
                  })
                }
                onMoveRight={() =>
                  onAction({
                    type: 'moveColumn',
                    columnId: column.id,
                    direction: 'right',
                  })
                }
                onRename={() =>
                  onAction({
                    type: 'dialogOpen',
                    dialog: { kind: 'renameColumn', columnId: column.id },
                  })
                }
                onDelete={() =>
                  onAction({
                    type: 'dialogOpen',
                    dialog: { kind: 'deleteColumn', columnId: column.id },
                  })
                }
              />
            }
            isAddCardDisabled={state.isInlineSaving}
            footer={
              state.ui.quickAdd?.columnId === column.id ? (
                <QuickAddForm
                  text={state.ui.quickAdd.text}
                  error={state.quickAddError}
                  isSaving={state.isInlineSaving}
                  onChange={(text) =>
                    onAction({ type: 'quickAddChange', text })
                  }
                  onSubmit={() => onAction({ type: 'quickAddSubmit' })}
                  onCancel={() => onAction({ type: 'inlineClose' })}
                  onOutside={() => onAction({ type: 'inlineOutside' })}
                />
              ) : undefined
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
      <RenameColumnDialog
        column={dialogColumn('renameColumn')}
        isSaving={state.isRenamingColumn}
        onSubmit={onRenameColumn}
        onCancel={() => onAction({ type: 'dialogClose' })}
      />
      <DeleteColumnDialog
        column={(() => {
          const column = dialogColumn('deleteColumn')
          return column && { ...column, cardCount: column.cards.length }
        })()}
        isDeleting={state.isDeletingColumn}
        onConfirm={() => onAction({ type: 'deleteColumnConfirm' })}
        onCancel={() => onAction({ type: 'dialogClose' })}
      />
      <DiscardInlineDialog
        open={state.ui.dialog?.kind === 'discardInline'}
        quickAddColumnName={
          state.ui.quickAdd
            ? (board?.columns.find(
                (column) => column.id === state.ui.quickAdd?.columnId,
              )?.name ?? '')
            : null
        }
        onKeepEditing={() => onAction({ type: 'discardKeep' })}
        onDiscard={() => onAction({ type: 'discardConfirm' })}
      />
    </>
  )
}
