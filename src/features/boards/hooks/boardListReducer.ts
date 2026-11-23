import type { BoardSummary } from '../types'
import type { BoardDialogResult } from './boardDialogResult'

export type BoardListDialog =
  | { type: 'none' }
  | {
      type: 'rename' | 'delete'
      board: BoardSummary
      /** Board ids in list order when the dialog opened, to find where focus goes if the board disappears. */
      listIds: string[]
    }

/** Where focus moves once a board's tile or row is gone. */
export type FocusTarget =
  { type: 'boardMenu'; boardId: string } | { type: 'newBoard' }

export type BoardListReducerState = {
  dialog: BoardListDialog
  /** A new request has a new `id`, so the same target can be focused twice. */
  focusRequest: { id: number; target: FocusTarget } | null
}

export type BoardListAction =
  | { type: 'refreshClick' }
  | { type: 'tryAgainClick' }
  | { type: 'renameClick'; board: BoardSummary }
  | { type: 'deleteClick'; board: BoardSummary }
  | { type: 'dialogClose'; result: BoardDialogResult }

/** What the view model dispatches once it has the board list at hand. */
export type BoardListEvent =
  | {
      type: 'dialogOpen'
      dialog: 'rename' | 'delete'
      board: BoardSummary
      listIds: string[]
    }
  | {
      type: 'dialogFinish'
      result: BoardDialogResult
      /** Ids of the boards still listed, in list order. */
      remainingIds: string[]
    }

export const initialBoardListState: BoardListReducerState = {
  dialog: { type: 'none' },
  focusRequest: null,
}

/**
 * Focus for a board that disappeared: the next board's menu button, the previous one if it was the
 * last, or New board when none are left.
 */
export function focusTargetAfterRemoval(
  listIds: string[],
  removedId: string,
  remainingIds: string[],
): FocusTarget {
  const remaining = new Set(remainingIds)
  const index = listIds.indexOf(removedId)
  const next = listIds.slice(index + 1).find((id) => remaining.has(id))
  const previous = listIds
    .slice(0, Math.max(index, 0))
    .findLast((id) => remaining.has(id))
  const target = next ?? previous ?? remainingIds[0]
  return target ? { type: 'boardMenu', boardId: target } : { type: 'newBoard' }
}

export function boardListReducer(
  state: BoardListReducerState,
  action: BoardListAction | BoardListEvent,
): BoardListReducerState {
  switch (action.type) {
    case 'refreshClick':
    case 'tryAgainClick':
    case 'renameClick':
    case 'deleteClick':
    case 'dialogClose':
      return state
    case 'dialogOpen':
      return {
        ...state,
        dialog: {
          type: action.dialog,
          board: action.board,
          listIds: action.listIds,
        },
      }
    case 'dialogFinish': {
      const { dialog } = state
      if (dialog.type === 'none') return state
      if (action.result.kind !== 'deleted') {
        return { ...state, dialog: { type: 'none' } }
      }
      return {
        dialog: { type: 'none' },
        focusRequest: {
          id: (state.focusRequest?.id ?? 0) + 1,
          target: focusTargetAfterRemoval(
            dialog.listIds,
            dialog.board.id,
            action.remainingIds,
          ),
        },
      }
    }
  }
}
