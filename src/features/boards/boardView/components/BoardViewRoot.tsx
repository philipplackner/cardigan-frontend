import { DeleteBoardDialog } from '../../components/DeleteBoardDialog'
import { RenameBoardDialog } from '../../components/RenameBoardDialog'
import type { BoardDialogResult } from '../../hooks/boardDialogResult'
import {
  useBoardViewModel,
  type BoardViewCallbacks,
} from '../hooks/useBoardViewModel'
import { BoardViewScreen } from './BoardViewScreen'

type BoardViewRootProps = BoardViewCallbacks & {
  boardId: string
}

/**
 * The board screen's content area for one board. Needs `BoardViewDataAccessProvider`,
 * `BoardsDataAccessProvider`, a `ToastProvider` and an `AppBarSlotProvider` around it. It does no
 * routing: the host maps the callbacks to navigation.
 */
export function BoardViewRoot({ boardId, ...callbacks }: BoardViewRootProps) {
  const { state, onAction, onRenameColumn, boardSummary } = useBoardViewModel(
    boardId,
    callbacks,
  )
  const dialog = state.ui.dialog?.kind
  const onClose = (result: BoardDialogResult) =>
    onAction({ type: 'boardDialogClose', result })
  return (
    <>
      <BoardViewScreen
        state={state}
        onAction={onAction}
        onRenameColumn={onRenameColumn}
      />
      <RenameBoardDialog
        board={dialog === 'renameBoard' ? boardSummary : null}
        onClose={onClose}
      />
      <DeleteBoardDialog
        board={dialog === 'deleteBoard' ? boardSummary : null}
        onClose={onClose}
      />
    </>
  )
}
