import type { LabelColor } from '@/core/ui'

/** A label on a card, as the board shows it. */
export type CardLabel = {
  id: string
  name: string
  color: LabelColor
}

/** A card as the board shows it. The display ID is the board key, a hyphen and `number`. */
export type BoardCard = {
  id: string
  number: number
  title: string
  position: number
  labels: CardLabel[]
}

/** A column with its cards. */
export type BoardColumn = {
  id: string
  name: string
  position: number
  cards: BoardCard[]
}

/** A column without cards, as column changes return it. */
export type BoardColumnInfo = {
  id: string
  name: string
  position: number
}

/** A board with all its columns and cards. */
export type BoardDetail = {
  id: string
  name: string
  key: string
  columns: BoardColumn[]
}

/** A field error from the server, as in shared `api-errors` › Field error codes. */
export type BoardViewFieldError = {
  field: 'name' | 'title'
  /** REQUIRED, TOO_LONG, INVALID_CHARACTER, or a code this client doesn't know. */
  code: string
  max?: number
}

export type BoardViewErrorKind =
  /** 404 with the code NOT_FOUND. Other 404s count as `other`. */
  | { kind: 'notFound' }
  /** 400 with `position` and the code OUT_OF_RANGE. */
  | { kind: 'outOfRange' }
  /** 400 or 409 with field errors. */
  | { kind: 'invalid'; fields: BoardViewFieldError[] }
  /** Network failure, 5xx and anything else. */
  | { kind: 'other' }

/** How a `BoardViewDataAccess` call fails. */
export class BoardViewError extends Error {
  readonly error: BoardViewErrorKind

  constructor(error: BoardViewErrorKind) {
    super(`Board view request failed: ${error.kind}`)
    this.name = 'BoardViewError'
    this.error = error
  }
}

/** The board, column and card calls the board view needs. Every method rejects with a `BoardViewError`. */
export type BoardViewDataAccess = {
  loadBoard(boardId: string): Promise<BoardDetail>
  createColumn(boardId: string, name: string): Promise<BoardColumnInfo>
  renameColumn(
    boardId: string,
    columnId: string,
    name: string,
  ): Promise<BoardColumnInfo>
  /** Moves the column to its final `position`. Resolves with the positions of all columns of the board. */
  moveColumn(
    boardId: string,
    columnId: string,
    position: number,
  ): Promise<{ id: string; position: number }[]>
  deleteColumn(boardId: string, columnId: string): Promise<void>
  /** Creates the card at the end of the column. */
  createCard(
    boardId: string,
    columnId: string,
    title: string,
  ): Promise<BoardCard>
}
