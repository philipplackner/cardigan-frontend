import { checkBoardKey } from '@/core/utils/boardKey'
import {
  BoardsError,
  type BoardFieldError,
  type BoardsDataAccess,
  type BoardsErrorKind,
  type BoardSummary,
} from '../types'
import { BOARD_NAME_MAX, checkBoardName } from '../utils/boardName'
import { sampleBoards, type StoredBoard } from './sampleBoards'

export type BoardsMethod = keyof BoardsDataAccess

type InMemoryOptions = {
  /** The current time for new and renamed boards. */
  now?: () => Date
  /** Delay before every call resolves, for the preview page. */
  delayMs?: number
}

/**
 * A `BoardsDataAccess` for tests and the preview page that keeps boards in memory and behaves like the
 * backend: list order, key rules, key clashes and not found. Controls make the next call fail, apply
 * a create and lose its response, or wait until released.
 */
export type InMemoryBoardsDataAccess = BoardsDataAccess & {
  /** Replaces the stored boards. */
  reset(boards: readonly StoredBoard[]): void
  /** The stored boards in list order. */
  boards(): BoardSummary[]
  /** The next call of `method` rejects with `error` without changing anything. */
  failNext(method: BoardsMethod, error: BoardsErrorKind): void
  /** The next create is stored and then rejects with `other`, like a lost response. */
  applyThenFailNextCreate(): void
  /** The next call of `method` waits until the returned function is called. */
  holdNext(method: BoardsMethod): () => void
  /** The stored board with this ID. Lets another in-memory fake share this store. */
  stored(id: string): StoredBoard | undefined
  /** Sets a board's card count and updated time, as a column or card change does on the server. */
  touch(id: string, cardCount: number): void
}

const listOrder = (a: StoredBoard, b: StoredBoard) =>
  b.updatedAt.getTime() - a.updatedAt.getTime() ||
  b.createdAt.getTime() - a.createdAt.getTime() ||
  (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)

const toSummary = ({
  id,
  name,
  key,
  cardCount,
  updatedAt,
}: StoredBoard): BoardSummary => ({
  id,
  name,
  key,
  cardCount,
  updatedAt: new Date(updatedAt),
})

const invalid = (...fields: BoardFieldError[]) =>
  new BoardsError({ kind: 'invalid', fields })

function nameFieldError(name: string): BoardFieldError | null {
  const { error } = checkBoardName(name)
  if (!error) return null
  return error === 'EMPTY'
    ? { field: 'name', code: 'REQUIRED' }
    : error === 'TOO_LONG'
      ? { field: 'name', code: 'TOO_LONG', max: BOARD_NAME_MAX }
      : { field: 'name', code: error }
}

export function createInMemoryBoardsDataAccess(
  seed: readonly StoredBoard[] = sampleBoards,
  { now = () => new Date(), delayMs = 0 }: InMemoryOptions = {},
): InMemoryBoardsDataAccess {
  let stored = seed.map((board) => ({ ...board }))
  const failures = new Map<BoardsMethod, BoardsErrorKind>()
  const holds = new Map<BoardsMethod, Promise<void>>()
  let loseNextCreateResponse = false
  let nextId = 1

  async function start(method: BoardsMethod) {
    const hold = holds.get(method)
    holds.delete(method)
    if (hold) await hold
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
    const failure = failures.get(method)
    failures.delete(method)
    if (failure) throw new BoardsError(failure)
  }

  const ordered = () => [...stored].sort(listOrder)

  return {
    reset(boards) {
      stored = boards.map((board) => ({ ...board }))
    },
    boards: () => ordered().map(toSummary),
    failNext(method, error) {
      failures.set(method, error)
    },
    applyThenFailNextCreate() {
      loseNextCreateResponse = true
    },
    holdNext(method) {
      let release!: () => void
      holds.set(method, new Promise<void>((resolve) => (release = resolve)))
      return () => release()
    },
    stored(id) {
      const board = stored.find((candidate) => candidate.id === id)
      return board && { ...board }
    },
    touch(id, cardCount) {
      stored = stored.map((board) =>
        board.id === id ? { ...board, cardCount, updatedAt: now() } : board,
      )
    },

    async listBoards() {
      await start('listBoards')
      return ordered().map(toSummary)
    },

    async createBoard({ name, key }) {
      await start('createBoard')
      const fieldErrors: BoardFieldError[] = []
      const nameError = nameFieldError(name)
      if (nameError) fieldErrors.push(nameError)
      const keyError = checkBoardKey(key)
      if (keyError) fieldErrors.push({ field: 'key', code: keyError })
      if (fieldErrors.length > 0) throw invalid(...fieldErrors)
      if (stored.some((board) => board.key === key)) {
        throw invalid({ field: 'key', code: 'ALREADY_USED' })
      }
      const time = now()
      const board: StoredBoard = {
        id: `10000000-0000-4000-8000-${String(nextId++).padStart(12, '0')}`,
        name: checkBoardName(name).value,
        key,
        cardCount: 0,
        createdAt: time,
        updatedAt: time,
      }
      stored = [...stored, board]
      if (loseNextCreateResponse) {
        loseNextCreateResponse = false
        throw new BoardsError({ kind: 'other' })
      }
      return toSummary(board)
    },

    async renameBoard(id, name) {
      await start('renameBoard')
      const board = stored.find((candidate) => candidate.id === id)
      if (!board) throw new BoardsError({ kind: 'notFound' })
      const fieldError = nameFieldError(name)
      if (fieldError) throw invalid(fieldError)
      const renamed = {
        ...board,
        name: checkBoardName(name).value,
        updatedAt: now(),
      }
      stored = stored.map((candidate) =>
        candidate.id === id ? renamed : candidate,
      )
      return toSummary(renamed)
    },

    async deleteBoard(id) {
      await start('deleteBoard')
      if (!stored.some((board) => board.id === id)) {
        throw new BoardsError({ kind: 'notFound' })
      }
      stored = stored.filter((board) => board.id !== id)
    },
  }
}
