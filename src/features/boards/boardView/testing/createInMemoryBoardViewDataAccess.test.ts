import { describe, expect, it } from 'vitest'
import { createInMemoryBoardsDataAccess } from '../../testing/createInMemoryBoardsDataAccess'
import { sampleBoards } from '../../testing/sampleBoards'
import { BoardViewError, type BoardDetail } from '../types'
import { createInMemoryBoardViewDataAccess } from './createInMemoryBoardViewDataAccess'
import { CARDIGAN_BOARD_ID } from './sampleBoardContent'

function setup() {
  const boards = createInMemoryBoardsDataAccess()
  const boardView = createInMemoryBoardViewDataAccess(boards)
  return { boards, boardView }
}

async function rejection(promise: Promise<unknown>) {
  const error = await promise.then(
    () => null,
    (reason: unknown) => reason,
  )
  expect(error).toBeInstanceOf(BoardViewError)
  return (error as BoardViewError).error
}

const positions = (board: BoardDetail) =>
  board.columns.map((column) => column.position)
const names = (board: BoardDetail) => board.columns.map((column) => column.name)

describe('createInMemoryBoardViewDataAccess', () => {
  it('seeds every sample board with its name, key and card count', async () => {
    const { boardView } = setup()
    for (const sample of sampleBoards) {
      const board = await boardView.loadBoard(sample.id)
      expect(board).toMatchObject({ name: sample.name, key: sample.key })
      const cards = board.columns.flatMap((column) => column.cards)
      expect(cards).toHaveLength(sample.cardCount)
    }
  })

  it('seeds Cardigan v1 with the Figma columns', async () => {
    const board = await setup().boardView.loadBoard(CARDIGAN_BOARD_ID)

    expect(names(board)).toEqual(['To do', 'In progress', 'Review', 'Done'])
    expect(board.columns[0]?.cards.map((card) => card.number)).toEqual([
      118, 121, 124, 127,
    ])
  })

  it('keeps column positions 0..n-1 after create, move and delete', async () => {
    const { boardView } = setup()
    const id = CARDIGAN_BOARD_ID
    const created = await boardView.createColumn(id, 'Blocked')
    expect(created.position).toBe(4)
    expect(positions(await boardView.loadBoard(id))).toEqual([0, 1, 2, 3, 4])

    const moved = await boardView.moveColumn(id, created.id, 0)
    expect(moved.map((entry) => entry.position).sort()).toEqual([0, 1, 2, 3, 4])
    const afterMove = await boardView.loadBoard(id)
    expect(names(afterMove)).toEqual([
      'Blocked',
      'To do',
      'In progress',
      'Review',
      'Done',
    ])
    expect(positions(afterMove)).toEqual([0, 1, 2, 3, 4])

    await boardView.deleteColumn(id, afterMove.columns[2]!.id)
    const afterDelete = await boardView.loadBoard(id)
    expect(names(afterDelete)).toEqual(['Blocked', 'To do', 'Review', 'Done'])
    expect(positions(afterDelete)).toEqual([0, 1, 2, 3])
  })

  it('rejects a move to n or below 0 with outOfRange', async () => {
    const { boardView } = setup()
    const board = await boardView.loadBoard(CARDIGAN_BOARD_ID)
    const columnId = board.columns[0]!.id

    expect(
      await rejection(boardView.moveColumn(board.id, columnId, 4)),
    ).toEqual({ kind: 'outOfRange' })
    expect(
      await rejection(boardView.moveColumn(board.id, columnId, -1)),
    ).toEqual({ kind: 'outOfRange' })
  })

  it('rejects unknown boards and columns with notFound', async () => {
    const { boardView } = setup()

    expect(await rejection(boardView.loadBoard('missing'))).toEqual({
      kind: 'notFound',
    })
    expect(
      await rejection(
        boardView.createCard(CARDIGAN_BOARD_ID, 'missing', 'Write docs'),
      ),
    ).toEqual({ kind: 'notFound' })
  })

  it('appends new cards with the next number and a dense position', async () => {
    const { boardView } = setup()
    const board = await boardView.loadBoard(CARDIGAN_BOARD_ID)
    const review = board.columns[2]!

    const card = await boardView.createCard(board.id, review.id, ' Write docs ')

    expect(card).toMatchObject({
      number: 128,
      title: 'Write docs',
      position: 2,
    })
  })

  it('rejects invalid names with field errors', async () => {
    const { boardView } = setup()

    expect(
      await rejection(
        boardView.createColumn(CARDIGAN_BOARD_ID, 'a'.repeat(31)),
      ),
    ).toEqual({
      kind: 'invalid',
      fields: [{ field: 'name', code: 'TOO_LONG', max: 30 }],
    })
  })

  it('rejects a forced failure once with the given error, without changing anything', async () => {
    const { boardView } = setup()
    boardView.failNext('createColumn', { kind: 'other' })

    expect(
      await rejection(boardView.createColumn(CARDIGAN_BOARD_ID, 'Blocked')),
    ).toEqual({ kind: 'other' })
    expect(names(await boardView.loadBoard(CARDIGAN_BOARD_ID))).not.toContain(
      'Blocked',
    )
    await expect(
      boardView.createColumn(CARDIGAN_BOARD_ID, 'Blocked'),
    ).resolves.toMatchObject({ name: 'Blocked' })
  })

  it('applies a call and then loses its response', async () => {
    const { boardView } = setup()
    boardView.applyThenFailNext('createColumn')

    expect(
      await rejection(boardView.createColumn(CARDIGAN_BOARD_ID, 'Blocked')),
    ).toEqual({ kind: 'other' })
    expect(names(await boardView.loadBoard(CARDIGAN_BOARD_ID))).toContain(
      'Blocked',
    )
  })

  it('holds a call until released', async () => {
    const { boardView } = setup()
    const release = boardView.holdNext('loadBoard')
    let done = false
    const load = boardView.loadBoard(CARDIGAN_BOARD_ID).then(() => {
      done = true
    })

    await Promise.resolve()
    expect(done).toBe(false)
    release()
    await load
    expect(done).toBe(true)
  })

  it('shares its boards with the boards fake', async () => {
    const { boards, boardView } = setup()
    const board = await boardView.loadBoard(CARDIGAN_BOARD_ID)

    await boardView.createCard(board.id, board.columns[0]!.id, 'Write docs')
    const listed = await boards.listBoards()
    expect(listed.find((entry) => entry.id === board.id)?.cardCount).toBe(13)

    await boards.renameBoard(board.id, 'Cardigan v2')
    expect((await boardView.loadBoard(board.id)).name).toBe('Cardigan v2')

    await boards.deleteBoard(board.id)
    expect(await rejection(boardView.loadBoard(board.id))).toEqual({
      kind: 'notFound',
    })
  })

  it('gives a board created through the boards fake the default columns', async () => {
    const { boards, boardView } = setup()
    const created = await boards.createBoard({ name: 'New', key: 'NEW' })

    const board = await boardView.loadBoard(created.id)

    expect(names(board)).toEqual(['To do', 'In progress', 'Done'])
    expect(board.columns.every((column) => column.cards.length === 0)).toBe(
      true,
    )
  })

  it('changes the stored board as another device would', async () => {
    const { boardView } = setup()
    boardView.changeBoard(CARDIGAN_BOARD_ID, (columns) => [
      columns[3]!,
      ...columns.slice(0, 3),
    ])

    const board = await boardView.loadBoard(CARDIGAN_BOARD_ID)
    expect(names(board)).toEqual(['Done', 'To do', 'In progress', 'Review'])
    expect(positions(board)).toEqual([0, 1, 2, 3])
  })
})
