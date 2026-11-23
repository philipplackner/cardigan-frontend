import type { BoardViewErrorKind, BoardViewFieldError } from '../types'

/** The changes the board view makes. */
export type BoardViewChange =
  'createColumn' | 'renameColumn' | 'moveColumn' | 'deleteColumn' | 'createCard'

/** What the view model does after a change failed. */
export type BoardViewErrorOutcome =
  /** Show the errors under the field. The form or dialog stays open. */
  | { type: 'fieldErrors'; fields: BoardViewFieldError[] }
  /**
   * Show the change's failure toast. The form or dialog stays open with its input. With `reload`,
   * the board also loads again in the background, because the change may have applied
   * (`api-conventions` › Retries after a lost response).
   */
  | { type: 'failed'; reload: boolean }
  /** A 404 on delete: the column is gone, which is what the user wanted. */
  | { type: 'deleted' }
  /** Load the board again, then show "“{name}” no longer exists. The board was reloaded." */
  | { type: 'columnGone' }
  /** Load the board again, then show the stale-move toast. */
  | { type: 'staleMove' }

const FIELD_OF_CHANGE: Record<BoardViewChange, BoardViewFieldError['field']> = {
  createColumn: 'name',
  renameColumn: 'name',
  moveColumn: 'name',
  deleteColumn: 'name',
  createCard: 'title',
}

const RELOADS_AFTER_UNKNOWN_OUTCOME: ReadonlySet<BoardViewChange> = new Set([
  'createColumn',
  'createCard',
  'moveColumn',
])

/** Maps a failed change to what the board view does next (design.md › Error handling). */
export function handleBoardViewError(
  change: BoardViewChange,
  error: BoardViewErrorKind,
): BoardViewErrorOutcome {
  const failed: BoardViewErrorOutcome = {
    type: 'failed',
    reload: RELOADS_AFTER_UNKNOWN_OUTCOME.has(change),
  }
  switch (error.kind) {
    case 'invalid': {
      const fields = error.fields.filter(
        (field) => field.field === FIELD_OF_CHANGE[change],
      )
      return fields.length > 0 ? { type: 'fieldErrors', fields } : failed
    }
    case 'notFound':
      return change === 'deleteColumn'
        ? { type: 'deleted' }
        : { type: 'columnGone' }
    case 'outOfRange':
      return change === 'moveColumn' ? { type: 'staleMove' } : failed
    case 'other':
      return failed
  }
}
