import { describe, expect, it } from 'vitest'
import type { BoardCard, BoardColumn, BoardDetail } from '../types'
import {
  addCard,
  addColumn,
  applyColumnPositions,
  removeColumn,
  renameColumn,
  sortBoard,
} from './applyChanges'

const card = (id: string, position: number): BoardCard => ({
  id,
  number: position + 1,
  title: `Card ${id}`,
  position,
  labels: [],
})

const column = (
  id: string,
  position: number,
  cards: BoardCard[] = [],
): BoardColumn => ({ id, name: `Column ${id}`, position, cards })

function board(): BoardDetail {
  return Object.freeze({
    id: 'b',
    name: 'Board',
    key: 'BRD',
    columns: Object.freeze([
      column('a', 0, [card('a1', 0)]),
      column('b', 1),
      column('c', 2),
    ]) as BoardColumn[],
  })
}

const ids = (detail: BoardDetail) => detail.columns.map((entry) => entry.id)
const positions = (detail: BoardDetail) =>
  detail.columns.map((entry) => entry.position)

describe('applyChanges', () => {
  it('appends a new column without cards and leaves the input as it was', () => {
    const before = board()
    const after = addColumn(before, { id: 'd', name: 'New', position: 3 })

    expect(ids(after)).toEqual(['a', 'b', 'c', 'd'])
    expect(after.columns[3]?.cards).toEqual([])
    expect(ids(before)).toEqual(['a', 'b', 'c'])
  })

  it('renames only the column name and keeps its cards', () => {
    const after = renameColumn(board(), {
      id: 'a',
      name: 'Renamed',
      position: 0,
    })

    expect(after.columns[0]).toMatchObject({ name: 'Renamed', position: 0 })
    expect(after.columns[0]?.cards).toHaveLength(1)
  })

  it('orders columns by the returned positions, not by a local swap', () => {
    const { board: after, isStale } = applyColumnPositions(board(), [
      { id: 'c', position: 0 },
      { id: 'b', position: 1 },
      { id: 'a', position: 2 },
    ])

    expect(isStale).toBe(false)
    expect(ids(after)).toEqual(['c', 'b', 'a'])
    expect(positions(after)).toEqual([0, 1, 2])
  })

  it('returns the board unchanged and stale when the response has another column', () => {
    const before = board()
    const result = applyColumnPositions(before, [
      { id: 'a', position: 1 },
      { id: 'b', position: 0 },
      { id: 'c', position: 2 },
      { id: 'x', position: 3 },
    ])

    expect(result).toEqual({ board: before, isStale: true })
  })

  it('returns stale when the response lacks a cached column', () => {
    const result = applyColumnPositions(board(), [
      { id: 'a', position: 1 },
      { id: 'b', position: 0 },
    ])

    expect(result.isStale).toBe(true)
  })

  it('returns stale when the response swaps a cached column for another of the same count', () => {
    const result = applyColumnPositions(board(), [
      { id: 'a', position: 0 },
      { id: 'b', position: 1 },
      { id: 'x', position: 2 },
    ])

    expect(result.isStale).toBe(true)
  })

  it('renumbers the remaining columns 0..n-1 after a removal', () => {
    const after = removeColumn(board(), 'a')

    expect(ids(after)).toEqual(['b', 'c'])
    expect(positions(after)).toEqual([0, 1])
  })

  it('leaves the board unchanged when removing an unknown column', () => {
    expect(removeColumn(board(), 'x')).toEqual(board())
  })

  it('appends a card at the end of its column only', () => {
    const after = addCard(board(), 'a', card('a2', 1))

    expect(after.columns[0]?.cards.map((entry) => entry.id)).toEqual([
      'a1',
      'a2',
    ])
    expect(after.columns[1]?.cards).toEqual([])
  })

  it('sorts columns and cards by position', () => {
    const shuffled: BoardDetail = {
      ...board(),
      columns: [
        column('c', 2),
        column('a', 0, [card('a2', 1), card('a1', 0)]),
        column('b', 1),
      ],
    }

    const sorted = sortBoard(shuffled)

    expect(ids(sorted)).toEqual(['a', 'b', 'c'])
    expect(sorted.columns[0]?.cards.map((entry) => entry.id)).toEqual([
      'a1',
      'a2',
    ])
  })
})
