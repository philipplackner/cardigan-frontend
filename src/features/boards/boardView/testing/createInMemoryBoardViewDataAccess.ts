import { checkText } from '@/core/utils/text'
import type { InMemoryBoardsDataAccess } from '../../testing/createInMemoryBoardsDataAccess'
import {
  BoardViewError,
  type BoardColumn,
  type BoardDetail,
  type BoardViewDataAccess,
  type BoardViewErrorKind,
  type BoardViewFieldError,
} from '../types'
import { COLUMN_NAME_MAX, CARD_TITLE_MAX } from '../utils/limits'
import {
  CARDIGAN_BOARD_ID,
  DEFAULT_COLUMN_NAMES,
  cardiganColumns,
} from './sampleBoardContent'

export type BoardViewMethod = keyof BoardViewDataAccess

type InMemoryOptions = {
  /** Delay before every call resolves, for the preview page. */
  delayMs?: number
}

/**
 * A `BoardViewDataAccess` for tests and the preview page that keeps columns and cards in memory and
 * behaves like the backend: dense positions, `outOfRange` for moves past the ends, `notFound` for
 * unknown IDs and field errors for invalid names. It shares its boards with an in-memory
 * `BoardsDataAccess`, so a card added here raises the board list's card count, and a board renamed
 * or deleted there shows here.
 */
export type InMemoryBoardViewDataAccess = BoardViewDataAccess & {
  /** The next call of `method` rejects with `error` without changing anything. */
  failNext(method: BoardViewMethod, error: BoardViewErrorKind): void
  /** The next call of `method` is applied and then rejects with `other`, like a lost response. */
  applyThenFailNext(method: BoardViewMethod): void
  /** The next call of `method` waits until the returned function is called. */
  holdNext(method: BoardViewMethod): () => void
  /**
   * Changes the stored columns as another device would. The returned array order becomes the column
   * order, and each column's card order its card order.
   */
  changeBoard(
    boardId: string,
    update: (columns: BoardColumn[]) => BoardColumn[],
  ): void
}

type StoredContent = { columns: BoardColumn[]; nextCardNumber: number }

const notFound = () => new BoardViewError({ kind: 'notFound' })

const copyColumns = (columns: readonly BoardColumn[]): BoardColumn[] =>
  columns.map((column) => ({
    ...column,
    cards: column.cards.map((card) => ({
      ...card,
      labels: card.labels.map((label) => ({ ...label })),
    })),
  }))

/** Positions follow the array order, as dense positions require (`domain-ordering`). */
const renumber = (columns: readonly BoardColumn[]): BoardColumn[] =>
  columns.map((column, position) => ({
    ...column,
    position,
    cards: column.cards.map((card, cardPosition) => ({
      ...card,
      position: cardPosition,
    })),
  }))

const countCards = (columns: readonly BoardColumn[]) =>
  columns.reduce((sum, column) => sum + column.cards.length, 0)

function fieldError(
  field: BoardViewFieldError['field'],
  value: string,
  max: number,
): { value: string; error: BoardViewFieldError | null } {
  const check = checkText(value, { kind: 'singleLine', max })
  const error: BoardViewFieldError | null =
    check.error === null
      ? null
      : check.error === 'EMPTY'
        ? { field, code: 'REQUIRED' }
        : check.error === 'TOO_LONG'
          ? { field, code: 'TOO_LONG', max }
          : { field, code: check.error }
  return { value: check.value, error }
}

export function createInMemoryBoardViewDataAccess(
  boards: InMemoryBoardsDataAccess,
  { delayMs = 0 }: InMemoryOptions = {},
): InMemoryBoardViewDataAccess {
  const contents = new Map<string, StoredContent>()
  const failures = new Map<BoardViewMethod, BoardViewErrorKind>()
  const lostResponses = new Set<BoardViewMethod>()
  const holds = new Map<BoardViewMethod, Promise<void>>()
  let nextId = 1

  const newId = (prefix: string) =>
    `${prefix}-0000-4000-8000-${String(nextId++).padStart(12, '0')}`

  /** Builds content for a board the first time it is used, matching the board list's card count. */
  function seedFor(boardId: string, cardCount: number): StoredContent {
    if (boardId === CARDIGAN_BOARD_ID) {
      const columns = copyColumns(cardiganColumns)
      const numbers = columns.flatMap((column) =>
        column.cards.map((card) => card.number),
      )
      return { columns, nextCardNumber: Math.max(...numbers) + 1 }
    }
    const columns = DEFAULT_COLUMN_NAMES.map((name): BoardColumn => ({
      id: newId('50000000'),
      name,
      position: 0,
      cards: [],
    }))
    for (let number = 1; number <= cardCount; number++) {
      columns[(number - 1) % columns.length]?.cards.push({
        id: newId('60000000'),
        number,
        title: `Card ${number}`,
        position: 0,
        labels: [],
      })
    }
    return { columns: renumber(columns), nextCardNumber: cardCount + 1 }
  }

  function contentOf(boardId: string) {
    const board = boards.stored(boardId)
    if (!board) throw notFound()
    let content = contents.get(boardId)
    if (!content) {
      content = seedFor(boardId, board.cardCount)
      contents.set(boardId, content)
    }
    return { board, content }
  }

  function save(boardId: string, content: StoredContent) {
    contents.set(boardId, content)
    boards.touch(boardId, countCards(content.columns))
  }

  function columnOf(content: StoredContent, columnId: string) {
    const column = content.columns.find(
      (candidate) => candidate.id === columnId,
    )
    if (!column) throw notFound()
    return column
  }

  async function start(method: BoardViewMethod) {
    const hold = holds.get(method)
    holds.delete(method)
    if (hold) await hold
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
    const failure = failures.get(method)
    failures.delete(method)
    if (failure) throw new BoardViewError(failure)
  }

  function finish<T>(method: BoardViewMethod, result: T): T {
    if (lostResponses.delete(method)) {
      throw new BoardViewError({ kind: 'other' })
    }
    return result
  }

  return {
    failNext(method, error) {
      failures.set(method, error)
    },
    applyThenFailNext(method) {
      lostResponses.add(method)
    },
    holdNext(method) {
      let release!: () => void
      holds.set(method, new Promise<void>((resolve) => (release = resolve)))
      return () => release()
    },
    changeBoard(boardId, update) {
      const { content } = contentOf(boardId)
      save(boardId, {
        ...content,
        columns: renumber(update(copyColumns(content.columns))),
      })
    },

    async loadBoard(boardId): Promise<BoardDetail> {
      await start('loadBoard')
      const { board, content } = contentOf(boardId)
      return finish('loadBoard', {
        id: board.id,
        name: board.name,
        key: board.key,
        columns: copyColumns(content.columns),
      })
    },

    async createColumn(boardId, name) {
      await start('createColumn')
      const { content } = contentOf(boardId)
      const checked = fieldError('name', name, COLUMN_NAME_MAX)
      if (checked.error) {
        throw new BoardViewError({ kind: 'invalid', fields: [checked.error] })
      }
      const column: BoardColumn = {
        id: newId('50000000'),
        name: checked.value,
        position: content.columns.length,
        cards: [],
      }
      save(boardId, { ...content, columns: [...content.columns, column] })
      return finish('createColumn', {
        id: column.id,
        name: column.name,
        position: column.position,
      })
    },

    async renameColumn(boardId, columnId, name) {
      await start('renameColumn')
      const { content } = contentOf(boardId)
      const column = columnOf(content, columnId)
      const checked = fieldError('name', name, COLUMN_NAME_MAX)
      if (checked.error) {
        throw new BoardViewError({ kind: 'invalid', fields: [checked.error] })
      }
      save(boardId, {
        ...content,
        columns: content.columns.map((candidate) =>
          candidate.id === columnId
            ? { ...candidate, name: checked.value }
            : candidate,
        ),
      })
      return finish('renameColumn', {
        id: column.id,
        name: checked.value,
        position: column.position,
      })
    },

    async moveColumn(boardId, columnId, position) {
      await start('moveColumn')
      const { content } = contentOf(boardId)
      const column = columnOf(content, columnId)
      if (
        !Number.isInteger(position) ||
        position < 0 ||
        position >= content.columns.length
      ) {
        throw new BoardViewError({ kind: 'outOfRange' })
      }
      const others = content.columns.filter(
        (candidate) => candidate.id !== columnId,
      )
      const columns = renumber([
        ...others.slice(0, position),
        column,
        ...others.slice(position),
      ])
      save(boardId, { ...content, columns })
      return finish(
        'moveColumn',
        columns.map(({ id, position: newPosition }) => ({
          id,
          position: newPosition,
        })),
      )
    },

    async deleteColumn(boardId, columnId) {
      await start('deleteColumn')
      const { content } = contentOf(boardId)
      columnOf(content, columnId)
      save(boardId, {
        ...content,
        columns: renumber(
          content.columns.filter((candidate) => candidate.id !== columnId),
        ),
      })
      finish('deleteColumn', undefined)
    },

    async createCard(boardId, columnId, title) {
      await start('createCard')
      const { content } = contentOf(boardId)
      const column = columnOf(content, columnId)
      const checked = fieldError('title', title, CARD_TITLE_MAX)
      if (checked.error) {
        throw new BoardViewError({ kind: 'invalid', fields: [checked.error] })
      }
      const card = {
        id: newId('60000000'),
        number: content.nextCardNumber,
        title: checked.value,
        position: column.cards.length,
        labels: [],
      }
      save(boardId, {
        nextCardNumber: content.nextCardNumber + 1,
        columns: content.columns.map((candidate) =>
          candidate.id === columnId
            ? { ...candidate, cards: [...candidate.cards, card] }
            : candidate,
        ),
      })
      return finish('createCard', { ...card, labels: [] })
    },
  }
}
