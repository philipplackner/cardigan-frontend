import type { BoardCard, BoardColumnInfo, BoardDetail } from '../types'

/** Pure updaters that write a change's response into the cached board. None of them mutates its input. */

const byPosition = (a: { position: number }, b: { position: number }) =>
  a.position - b.position

/** Appends a new column. Column responses carry no cards. */
export function addColumn(
  board: BoardDetail,
  column: BoardColumnInfo,
): BoardDetail {
  return {
    ...board,
    columns: [...board.columns, { ...column, cards: [] }],
  }
}

/** Replaces only the column's name. */
export function renameColumn(
  board: BoardDetail,
  column: BoardColumnInfo,
): BoardDetail {
  return {
    ...board,
    columns: board.columns.map((candidate) =>
      candidate.id === column.id
        ? { ...candidate, name: column.name }
        : candidate,
    ),
  }
}

/**
 * Applies the positions of all columns from a move response and sorts by them. When the response
 * names other columns than the cache, the board changed elsewhere: the board comes back unchanged
 * and `isStale` asks the caller to reload it.
 */
export function applyColumnPositions(
  board: BoardDetail,
  positions: readonly { id: string; position: number }[],
): { board: BoardDetail; isStale: boolean } {
  const byId = new Map(positions.map((entry) => [entry.id, entry.position]))
  const isSameSet =
    byId.size === positions.length &&
    byId.size === board.columns.length &&
    board.columns.every((column) => byId.has(column.id))
  if (!isSameSet) return { board, isStale: true }
  return {
    board: {
      ...board,
      columns: board.columns
        .map((column) => ({ ...column, position: byId.get(column.id)! }))
        .sort(byPosition),
    },
    isStale: false,
  }
}

/** Drops the column and moves every later column up by one, so positions stay 0..n-1. */
export function removeColumn(
  board: BoardDetail,
  columnId: string,
): BoardDetail {
  return {
    ...board,
    columns: board.columns
      .filter((column) => column.id !== columnId)
      .map((column, position) =>
        column.position === position ? column : { ...column, position },
      ),
  }
}

/** Appends the card to its column. */
export function addCard(
  board: BoardDetail,
  columnId: string,
  card: BoardCard,
): BoardDetail {
  return {
    ...board,
    columns: board.columns.map((column) =>
      column.id === columnId
        ? { ...column, cards: [...column.cards, card] }
        : column,
    ),
  }
}

/** Columns and cards in ascending position order (`domain-ordering`), whatever order they came in. */
export function sortBoard(board: BoardDetail): BoardDetail {
  return {
    ...board,
    columns: [...board.columns].sort(byPosition).map((column) => ({
      ...column,
      cards: [...column.cards].sort(byPosition),
    })),
  }
}
