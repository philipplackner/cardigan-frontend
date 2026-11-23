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
  const { state, onAction, onRenameColumn } = useBoardViewModel(
    boardId,
    callbacks,
  )
  return (
    <BoardViewScreen
      state={state}
      onAction={onAction}
      onRenameColumn={onRenameColumn}
    />
  )
}
