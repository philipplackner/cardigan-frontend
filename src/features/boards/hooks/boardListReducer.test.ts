import { describe, expect, it } from 'vitest'
import { sampleBoards } from '../testing/sampleBoards'
import {
  boardListReducer,
  focusTargetAfterRemoval,
  initialBoardListState,
} from './boardListReducer'

const board = sampleBoards[0]!

describe('focusTargetAfterRemoval', () => {
  it('picks the next board', () => {
    expect(focusTargetAfterRemoval(['a', 'b', 'c'], 'a', ['b', 'c'])).toEqual({
      type: 'boardMenu',
      boardId: 'b',
    })
  })

  it('picks the previous board when the last one is gone', () => {
    expect(focusTargetAfterRemoval(['a', 'b', 'c'], 'c', ['a', 'b'])).toEqual({
      type: 'boardMenu',
      boardId: 'b',
    })
  })

  it('skips neighbours that disappeared too', () => {
    expect(focusTargetAfterRemoval(['a', 'b', 'c'], 'a', ['c'])).toEqual({
      type: 'boardMenu',
      boardId: 'c',
    })
  })

  it('picks New board when no boards are left', () => {
    expect(focusTargetAfterRemoval(['a'], 'a', [])).toEqual({
      type: 'newBoard',
    })
  })
})

describe('boardListReducer', () => {
  const open = boardListReducer(initialBoardListState, {
    type: 'dialogOpen',
    dialog: 'delete',
    board,
    listIds: [board.id, 'b'],
  })

  it('opens the dialog for the board', () => {
    expect(open.dialog).toEqual({
      type: 'delete',
      board,
      listIds: [board.id, 'b'],
    })
  })

  it('closes without a focus request when the board is still there', () => {
    const closed = boardListReducer(open, {
      type: 'dialogFinish',
      result: { kind: 'unchanged' },
      remainingIds: [board.id, 'b'],
    })

    expect(closed).toEqual(initialBoardListState)
  })

  it('requests focus on a neighbour after a delete, with a new id each time', () => {
    const first = boardListReducer(open, {
      type: 'dialogFinish',
      result: { kind: 'deleted' },
      remainingIds: ['b'],
    })
    const second = boardListReducer(
      { ...open, focusRequest: first.focusRequest },
      {
        type: 'dialogFinish',
        result: { kind: 'deleted' },
        remainingIds: ['b'],
      },
    )

    expect(first.dialog).toEqual({ type: 'none' })
    expect(first.focusRequest?.target).toEqual({
      type: 'boardMenu',
      boardId: 'b',
    })
    expect(second.focusRequest?.id).not.toBe(first.focusRequest?.id)
  })
})
