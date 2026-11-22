import type { BoardSummary } from '../types'

/** What the Rename board or Delete board dialog did, reported to the screen that opened it. */
export type BoardDialogResult =
  | { kind: 'renamed'; board: BoardSummary }
  | { kind: 'deleted' }
  | { kind: 'unchanged' }
