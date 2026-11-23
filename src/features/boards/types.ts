/** A board as the board list shows it. */
export type BoardSummary = {
  id: string
  name: string
  key: string
  cardCount: number
  updatedAt: Date
}

/** A field error from the server, as in shared `api-errors` › Field error codes. */
export type BoardFieldError = {
  field: 'name' | 'key'
  /** REQUIRED, TOO_SHORT, TOO_LONG, INVALID_CHARACTER, INVALID_FORMAT, ALREADY_USED, or a code this client doesn't know. */
  code: string
  min?: number
  max?: number
}

export type BoardsErrorKind =
  /** 404 */
  | { kind: 'notFound' }
  /** 400 or 409 with field errors */
  | { kind: 'invalid'; fields: BoardFieldError[] }
  /** The session ended during the request. `core/auth` handles the redirect. */
  | { kind: 'sessionEnded' }
  /** Network failure, 5xx and anything else */
  | { kind: 'other' }

/** How a `BoardsDataAccess` call fails. */
export class BoardsError extends Error {
  readonly error: BoardsErrorKind

  constructor(error: BoardsErrorKind) {
    super(`Boards request failed: ${error.kind}`)
    this.name = 'BoardsError'
    this.error = error
  }
}

/**
 * The board calls the board list needs. Every method rejects with a `BoardsError`. Results of
 * `createBoard` and `renameBoard` are trusted for `id`, `name`, `key` and `updatedAt` only.
 */
export type BoardsDataAccess = {
  /** Boards in server order: shared `api-conventions` › Board list order. */
  listBoards(): Promise<BoardSummary[]>
  createBoard(input: { name: string; key: string }): Promise<BoardSummary>
  renameBoard(id: string, name: string): Promise<BoardSummary>
  deleteBoard(id: string): Promise<void>
}
