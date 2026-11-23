import { useEffect, useRef, type ReactElement, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AppBar,
  AppBarSlot,
  BoardIcon,
  BoardRow,
  BoardTile,
  Button,
  CloudOffIcon,
  EmptyState,
  IconButton,
  PageHeader,
  PlusIcon,
  RefreshIcon,
  UploadIcon,
  cn,
} from '@/core/ui'
import type { BoardListAction } from '../hooks/boardListReducer'
import { useLargeTitleCollapsed } from '../hooks/useLargeTitleCollapsed'
import {
  useBoardListViewModel,
  type BoardListState,
} from '../hooks/useBoardListViewModel'
import { useNewBoardDialog } from '../hooks/NewBoardDialogContext'
import type { BoardSummary } from '../types'
import { BoardMenu } from './BoardMenu'
import { PhoneMenu } from './PhoneMenu'
import { BoardRowSkeletons, BoardTileSkeletons } from './BoardListSkeletons'
import { DeleteBoardDialog } from './DeleteBoardDialog'
import { RenameBoardDialog } from './RenameBoardDialog'
import { useRelativeTimeText } from './useRelativeTimeText'

/** The import flow from `transfer`'s `useImportFlow`, passed in by the app layer. */
export type ImportAction = {
  open: () => void
  /** Rendered outside any menu, because a menu's content unmounts when it closes. */
  dialogs: ReactNode
}

/** The signed-in account. `email` is `null` while the session is still loading it. */
export type BoardListAccount = {
  email: string | null
  onLogOut: () => void
}

type BoardListRootProps = {
  /** The element that opens a board, without children, for example a router `Link`. */
  renderBoardLink: (boardId: string) => ReactElement
  onOpenLabels: () => void
  importAction: ImportAction
  account: BoardListAccount
}

export function BoardListRoot(props: BoardListRootProps) {
  const { state, onAction } = useBoardListViewModel()
  const { openNewBoardDialog } = useNewBoardDialog()
  return (
    <BoardListScreen
      state={state}
      onAction={onAction}
      onNewBoard={openNewBoardDialog}
      {...props}
    />
  )
}

type BoardListScreenProps = BoardListRootProps & {
  state: BoardListState
  onAction: (action: BoardListAction) => void
  onNewBoard: () => void
}

const GRID =
  'grid grid-cols-[repeat(auto-fill,minmax(var(--spacing-board-tile-min),1fr))] items-start gap-14'

const isRendered = (element: HTMLElement) => element.getClientRects().length > 0

/** Both layouts are mounted, so focus the copy the phone condition shows. */
function useFocusRequest(request: BoardListState['focusRequest']) {
  useEffect(() => {
    if (!request) return
    const { target } = request
    const selector =
      target.type === 'boardMenu'
        ? `[data-board-menu="${target.boardId}"]`
        : '[data-new-board]'
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>(selector),
    )
    ;(candidates.find(isRendered) ?? candidates[0])?.focus()
  }, [request])
}

export function BoardListScreen({
  state,
  onAction,
  onNewBoard,
  renderBoardLink,
  importAction,
  account,
  onOpenLabels,
}: BoardListScreenProps) {
  const { t } = useTranslation('boards')
  const { t: tCommon } = useTranslation()
  const largeTitleRef = useRef<HTMLDivElement>(null)
  const isTitleCollapsed = useLargeTitleCollapsed(largeTitleRef)
  const relativeTimeText = useRelativeTimeText()
  useFocusRequest(state.focusRequest)

  const { status, dialog, now } = state
  const boards = status.type === 'ready' ? status.boards : []
  const countText =
    boards.length > 0 ? t('boardCount', { count: boards.length }) : undefined
  const isEmpty = status.type === 'ready' && boards.length === 0

  const cardsText = (board: BoardSummary) =>
    t('cardCount', { count: board.cardCount })
  const menuFor = (board: BoardSummary) => (
    <BoardMenu
      boardId={board.id}
      boardName={board.name}
      onRename={() => onAction({ type: 'renameClick', board })}
      onDelete={() => onAction({ type: 'deleteClick', board })}
    />
  )

  const emptyOrError = isEmpty ? (
    <EmptyState
      icon={BoardIcon}
      title={t('empty.title')}
      description={t('empty.description')}
      actions={
        <>
          <Button icon={PlusIcon} onClick={onNewBoard}>
            {t('newBoard')}
          </Button>
          <Button
            variant="secondary"
            icon={UploadIcon}
            onClick={importAction.open}
          >
            {t('importButton')}
          </Button>
        </>
      }
    />
  ) : status.type === 'error' ? (
    <EmptyState
      type="error"
      icon={CloudOffIcon}
      title={t('loadError.title')}
      description={t('loadError.description')}
      actions={
        <Button
          variant="secondary"
          icon={RefreshIcon}
          onClick={() => onAction({ type: 'tryAgainClick' })}
        >
          {t('loadError.tryAgain')}
        </Button>
      }
    />
  ) : null

  const phoneActions = (
    <>
      <IconButton
        size="large"
        icon={PlusIcon}
        label={t('newBoard')}
        data-new-board
        onClick={onNewBoard}
      />
      <PhoneMenu
        email={account.email}
        onImport={importAction.open}
        onOpenLabels={onOpenLabels}
        onLogOut={account.onLogOut}
      />
    </>
  )

  return (
    <>
      <AppBarSlot>
        {isTitleCollapsed ? (
          <AppBar
            type="title"
            title={t('title')}
            isRaised
            actions={phoneActions}
          />
        ) : (
          <AppBar
            type="brand"
            brandName={tCommon('appName')}
            actions={phoneActions}
          />
        )}
      </AppBarSlot>

      <div
        data-testid="board-list-phone"
        className="hidden min-h-full flex-col gap-18 px-16 pt-4 pb-24 phone:flex"
      >
        <div
          ref={largeTitleRef}
          className="flex items-baseline gap-10 pt-2 pb-4"
        >
          <h1 className="type-sans-26-semibold-110-ls-2.5 text-text-primary">
            {t('title')}
          </h1>
          {countText && (
            <span className="type-mono-12-regular-100 text-text-muted">
              {countText}
            </span>
          )}
        </div>
        {emptyOrError ? (
          <div className="flex flex-1 flex-col justify-center">
            {emptyOrError}
          </div>
        ) : (
          <>
            <ul
              aria-busy={status.type === 'loading' || undefined}
              className="flex flex-col rounded-10 border border-border bg-background-surface p-1"
            >
              {status.type === 'loading' ? (
                <BoardRowSkeletons />
              ) : (
                boards.map((board, index) => (
                  <li key={board.id}>
                    <BoardRow
                      name={board.name}
                      keyValue={board.key}
                      cardsText={cardsText(board)}
                      updatedText={relativeTimeText(board.updatedAt, now)}
                      link={renderBoardLink(board.id)}
                      menu={menuFor(board)}
                      hasDivider={index < boards.length - 1}
                    />
                  </li>
                ))
              )}
            </ul>
            {countText && (
              <p className="pt-14 text-center type-mono-12-regular-100 text-text-faint">
                {countText}
              </p>
            )}
          </>
        )}
      </div>

      <div
        data-testid="board-list-wide"
        className="flex min-h-full flex-col phone:hidden"
      >
        <PageHeader
          title={t('title')}
          meta={countText}
          actions={
            <>
              <IconButton
                variant="boxed"
                icon={RefreshIcon}
                label={t('refresh')}
                aria-busy={state.isRefreshing || undefined}
                className={cn(
                  state.isRefreshing && 'motion-safe:[&_svg]:animate-spin',
                )}
                onClick={() => onAction({ type: 'refreshClick' })}
              />
              <Button
                variant="secondary"
                icon={UploadIcon}
                onClick={importAction.open}
              >
                {t('importButton')}
              </Button>
              <Button icon={PlusIcon} data-new-board onClick={onNewBoard}>
                {t('newBoard')}
              </Button>
            </>
          }
        />
        <div className="flex flex-1 flex-col p-24">
          {emptyOrError ? (
            <div className="flex flex-1 flex-col justify-center">
              {emptyOrError}
            </div>
          ) : status.type === 'loading' ? (
            <div aria-busy className={GRID}>
              <BoardTileSkeletons />
            </div>
          ) : (
            <ul className={GRID}>
              {boards.map((board) => (
                <li key={board.id}>
                  <BoardTile
                    name={board.name}
                    keyValue={board.key}
                    cardsText={cardsText(board)}
                    updatedText={t('updated', {
                      time: relativeTimeText(board.updatedAt, now),
                    })}
                    link={renderBoardLink(board.id)}
                    menu={menuFor(board)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <RenameBoardDialog
        board={dialog.type === 'rename' ? dialog.board : null}
        onClose={(result) => onAction({ type: 'dialogClose', result })}
      />
      <DeleteBoardDialog
        board={dialog.type === 'delete' ? dialog.board : null}
        onClose={(result) => onAction({ type: 'dialogClose', result })}
      />
      {importAction.dialogs}
    </>
  )
}
