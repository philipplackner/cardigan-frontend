import { describe, expect, it } from 'vitest'
import { BoardsError } from '../types'
import { createInMemoryBoardsDataAccess } from './createInMemoryBoardsDataAccess'
import { sampleBoards, type StoredBoard } from './sampleBoards'

const NOW = new Date('2026-10-14T15:00:00+02:00')

function board(
  id: string,
  updatedAt: string,
  createdAt = '2026-01-01T00:00:00Z',
  key = id.toUpperCase().slice(0, 5),
): StoredBoard {
  return {
    id,
    name: `Board ${id}`,
    key,
    cardCount: 1,
    createdAt: new Date(createdAt),
    updatedAt: new Date(updatedAt),
  }
}

async function rejection(promise: Promise<unknown>) {
  const error = await promise.then(
    () => null,
    (reason: unknown) => reason,
  )
  expect(error).toBeInstanceOf(BoardsError)
  return (error as BoardsError).error
}

describe('createInMemoryBoardsDataAccess', () => {
  it('lists the sample boards by default, most recently updated first', async () => {
    const boards = await createInMemoryBoardsDataAccess().listBoards()

    expect(boards.map((b) => b.key)).toEqual(sampleBoards.map((b) => b.key))
    expect(boards).toHaveLength(14)
  })

  it('orders by updatedAt descending', async () => {
    const dataAccess = createInMemoryBoardsDataAccess([
      board('aa', '2026-01-01T00:00:00Z'),
      board('bb', '2026-03-01T00:00:00Z'),
    ])

    const boards = await dataAccess.listBoards()

    expect(boards.map((b) => b.id)).toEqual(['bb', 'aa'])
  })

  it('breaks an updatedAt tie by createdAt descending', async () => {
    const dataAccess = createInMemoryBoardsDataAccess([
      board('aa', '2026-03-01T00:00:00Z', '2026-01-01T00:00:00Z'),
      board('bb', '2026-03-01T00:00:00Z', '2026-02-01T00:00:00Z'),
    ])

    const boards = await dataAccess.listBoards()

    expect(boards.map((b) => b.id)).toEqual(['bb', 'aa'])
  })

  it('breaks a full tie by id ascending', async () => {
    const dataAccess = createInMemoryBoardsDataAccess([
      board('bb', '2026-03-01T00:00:00Z'),
      board('aa', '2026-03-01T00:00:00Z'),
    ])

    const boards = await dataAccess.listBoards()

    expect(boards.map((b) => b.id)).toEqual(['aa', 'bb'])
  })

  it('rejects a used key with ALREADY_USED and stores nothing', async () => {
    const dataAccess = createInMemoryBoardsDataAccess()

    const error = await rejection(
      dataAccess.createBoard({ name: 'Another', key: 'CRD' }),
    )

    expect(error).toEqual({
      kind: 'invalid',
      fields: [{ field: 'key', code: 'ALREADY_USED' }],
    })
    expect(dataAccess.boards()).toHaveLength(14)
  })

  it('rejects an invalid key and name with field errors', async () => {
    const dataAccess = createInMemoryBoardsDataAccess([])

    const error = await rejection(
      dataAccess.createBoard({ name: ' ', key: 'C1' }),
    )

    expect(error).toEqual({
      kind: 'invalid',
      fields: [
        { field: 'name', code: 'REQUIRED' },
        { field: 'key', code: 'INVALID_FORMAT' },
      ],
    })
  })

  it('creates a board first in the list with the normalized name', async () => {
    const dataAccess = createInMemoryBoardsDataAccess(sampleBoards, {
      now: () => NOW,
    })

    const created = await dataAccess.createBoard({
      name: '  Garden plan ',
      key: 'GP',
    })

    expect(created).toMatchObject({ name: 'Garden plan', key: 'GP' })
    expect((await dataAccess.listBoards())[0]?.id).toBe(created.id)
  })

  it('keeps the key and updates updatedAt on rename', async () => {
    const dataAccess = createInMemoryBoardsDataAccess(sampleBoards, {
      now: () => NOW,
    })
    const target = sampleBoards[3]!

    const renamed = await dataAccess.renameBoard(target.id, 'Homelab')

    expect(renamed).toMatchObject({
      id: target.id,
      key: target.key,
      name: 'Homelab',
      updatedAt: NOW,
    })
    expect((await dataAccess.listBoards())[0]?.name).toBe('Homelab')
  })

  it('rejects renaming a missing board with notFound', async () => {
    const dataAccess = createInMemoryBoardsDataAccess([])

    expect(await rejection(dataAccess.renameBoard('missing', 'A'))).toEqual({
      kind: 'notFound',
    })
  })

  it('rejects deleting a missing board with notFound', async () => {
    const dataAccess = createInMemoryBoardsDataAccess([])

    expect(await rejection(dataAccess.deleteBoard('missing'))).toEqual({
      kind: 'notFound',
    })
  })

  it('deletes a board', async () => {
    const dataAccess = createInMemoryBoardsDataAccess()

    await dataAccess.deleteBoard(sampleBoards[0]!.id)

    expect(dataAccess.boards().map((b) => b.key)).not.toContain('CRD')
  })

  it('fails only the next call of the chosen method', async () => {
    const dataAccess = createInMemoryBoardsDataAccess()
    dataAccess.failNext('listBoards', { kind: 'other' })

    expect(await rejection(dataAccess.listBoards())).toEqual({ kind: 'other' })
    await expect(dataAccess.listBoards()).resolves.toHaveLength(14)
  })

  it('stores the board and rejects with other when told to lose the create response', async () => {
    const dataAccess = createInMemoryBoardsDataAccess()
    dataAccess.applyThenFailNextCreate()

    const error = await rejection(
      dataAccess.createBoard({ name: 'Garden plan', key: 'GP' }),
    )

    expect(error).toEqual({ kind: 'other' })
    expect(dataAccess.boards().map((b) => b.key)).toContain('GP')
  })

  it('holds a call until it is released', async () => {
    const dataAccess = createInMemoryBoardsDataAccess()
    const release = dataAccess.holdNext('deleteBoard')
    let settled = false

    const deleting = dataAccess
      .deleteBoard(sampleBoards[0]!.id)
      .then(() => (settled = true))
    await Promise.resolve()

    expect(settled).toBe(false)
    release()
    await deleting
    expect(settled).toBe(true)
  })

  it('returns copies, so callers cannot change stored boards', async () => {
    const dataAccess = createInMemoryBoardsDataAccess()
    const [first] = await dataAccess.listBoards()

    first!.name = 'Changed'

    expect((await dataAccess.listBoards())[0]?.name).toBe('Cardigan v1')
  })
})
