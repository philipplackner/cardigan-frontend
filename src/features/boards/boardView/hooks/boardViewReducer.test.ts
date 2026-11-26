import { describe, expect, it } from 'vitest'
import {
  boardViewReducer,
  initialBoardViewUiState,
  type BoardViewUiAction,
  type BoardViewUiState,
} from './boardViewReducer'

const run = (...actions: BoardViewUiAction[]) =>
  actions.reduce(boardViewReducer, initialBoardViewUiState)

const openQuickAdd = (columnId: string): BoardViewUiAction => ({
  type: 'inlineOpen',
  target: { kind: 'quickAdd', columnId },
})
const openAddColumn: BoardViewUiAction = {
  type: 'inlineOpen',
  target: { kind: 'addColumn' },
}

const neverBoth = (state: BoardViewUiState) =>
  expect(state.quickAdd !== null && state.addColumn !== null).toBe(false)

describe('boardViewReducer', () => {
  it('never has quick add and add column open together', () => {
    const sequences: BoardViewUiAction[][] = [
      [openQuickAdd('a'), openAddColumn],
      [openAddColumn, openQuickAdd('a')],
      [
        openQuickAdd('a'),
        { type: 'quickAddChange', text: 'Write docs' },
        openAddColumn,
        { type: 'discardConfirm' },
      ],
      [
        openAddColumn,
        { type: 'addColumnChange', text: 'Review' },
        openQuickAdd('a'),
        { type: 'discardKeep' },
      ],
    ]
    for (const actions of sequences) {
      let state = initialBoardViewUiState
      for (const action of actions) {
        state = boardViewReducer(state, action)
        neverBoth(state)
      }
    }
  })

  it('replaces an empty form without asking', () => {
    const state = run(openQuickAdd('a'), openQuickAdd('b'))

    expect(state.quickAdd).toEqual({
      columnId: 'b',
      text: '',
      submitted: false,
    })
    expect(state.dialog).toBeNull()
  })

  it('replaces a form that holds only white space without asking', () => {
    const state = run(
      openQuickAdd('a'),
      { type: 'quickAddChange', text: '   ' },
      openAddColumn,
    )

    expect(state.addColumn).not.toBeNull()
    expect(state.dialog).toBeNull()
  })

  it('asks before replacing a form with text', () => {
    const state = run(
      openQuickAdd('a'),
      { type: 'quickAddChange', text: 'Write docs' },
      openQuickAdd('b'),
    )

    expect(state.dialog).toEqual({
      kind: 'discardInline',
      target: { kind: 'quickAdd', columnId: 'b' },
    })
    expect(state.quickAdd).toMatchObject({ columnId: 'a', text: 'Write docs' })
  })

  it('opens the target form empty on Discard', () => {
    const state = run(
      openAddColumn,
      { type: 'addColumnChange', text: 'Review' },
      openQuickAdd('a'),
      { type: 'discardConfirm' },
    )

    expect(state.dialog).toBeNull()
    expect(state.addColumn).toBeNull()
    expect(state.quickAdd).toEqual({
      columnId: 'a',
      text: '',
      submitted: false,
    })
    expect(state.focusRequest?.target).toEqual({ kind: 'quickAdd' })
  })

  it('keeps the first form and its text on Keep editing and focuses it', () => {
    const state = run(
      openQuickAdd('a'),
      { type: 'quickAddChange', text: 'Write docs' },
      openAddColumn,
      { type: 'discardKeep' },
    )

    expect(state.dialog).toBeNull()
    expect(state.addColumn).toBeNull()
    expect(state.quickAdd).toMatchObject({ columnId: 'a', text: 'Write docs' })
    expect(state.focusRequest?.target).toEqual({ kind: 'quickAdd' })
  })

  it('sets submitted on submit and clears it with the text after an add', () => {
    const submitted = run(
      openQuickAdd('a'),
      { type: 'quickAddChange', text: 'Write docs' },
      { type: 'quickAddSubmit' },
    )
    expect(submitted.quickAdd?.submitted).toBe(true)

    const added = boardViewReducer(submitted, { type: 'quickAddAdded' })
    expect(added.quickAdd).toEqual({
      columnId: 'a',
      text: '',
      submitted: false,
    })
  })

  it('keeps submitted while typing, so errors update live', () => {
    const state = run(
      openAddColumn,
      { type: 'addColumnSubmit' },
      { type: 'addColumnChange', text: 'Review' },
    )

    expect(state.addColumn).toEqual({ text: 'Review', submitted: true })
  })

  it('closes the add column form after an add and focuses the new column', () => {
    const state = run(
      openAddColumn,
      { type: 'addColumnChange', text: 'Review' },
      { type: 'addColumnAdded', columnId: 'r' },
    )

    expect(state.addColumn).toBeNull()
    expect(state.focusRequest?.target).toEqual({
      kind: 'addCard',
      columnId: 'r',
      scroll: true,
    })
  })

  it('gives every focus request a new id', () => {
    const first = run(openQuickAdd('a'))
    const second = boardViewReducer(first, openQuickAdd('a'))

    expect(second.focusRequest?.id).not.toBe(first.focusRequest?.id)
  })

  it('drops the quick add and dialogs of a column a refetch removed', () => {
    const quickAdd = run(openQuickAdd('a'), {
      type: 'columnsChanged',
      columnIds: ['b'],
    })
    expect(quickAdd.quickAdd).toBeNull()

    const rename = run(
      { type: 'dialogOpen', dialog: { kind: 'renameColumn', columnId: 'a' } },
      { type: 'columnsChanged', columnIds: ['b'] },
    )
    expect(rename.dialog).toBeNull()

    const discard = run(
      openQuickAdd('b'),
      { type: 'quickAddChange', text: 'Write docs' },
      openQuickAdd('a'),
      { type: 'columnsChanged', columnIds: ['b'] },
    )
    expect(discard.dialog).toBeNull()
    expect(discard.quickAdd).toMatchObject({ columnId: 'b' })
  })

  it('keeps state that still points to existing columns', () => {
    const before = run(openQuickAdd('a'), {
      type: 'dialogOpen',
      dialog: { kind: 'deleteColumn', columnId: 'b' },
    })

    expect(
      boardViewReducer(before, {
        type: 'columnsChanged',
        columnIds: ['a', 'b'],
      }),
    ).toBe(before)
  })

  it('tracks the moving column', () => {
    const moving = run({ type: 'moveStart', columnId: 'a' })
    expect(moving.movingColumnId).toBe('a')
    expect(
      boardViewReducer(moving, { type: 'moveEnd' }).movingColumnId,
    ).toBeNull()
  })
  it('opens add column empty and not submitted', () => {
    expect(run(openAddColumn).addColumn).toEqual({
      text: '',
      submitted: false,
    })
  })

  it.each([
    ['quick add', openQuickAdd('a'), 'quickAddChange', 'quickAdd'],
    ['add column', openAddColumn, 'addColumnChange', 'addColumn'],
  ] as const)(
    'refocuses the open %s form with its text instead of asking',
    (_, openForm, change, kind) => {
      const typed = run(openForm, { type: change, text: 'Write docs' })

      const next = boardViewReducer(typed, openForm)

      expect(next.dialog).toBeNull()
      expect(next.quickAdd).toBe(typed.quickAdd)
      expect(next.addColumn).toBe(typed.addColumn)
      expect(next.focusRequest).toEqual({
        target: { kind },
        id: typed.focusRequest!.id + 1,
      })
    },
  )

  it('counts focus request ids up from 1', () => {
    expect(run(openQuickAdd('a')).focusRequest?.id).toBe(1)
  })

  it('focuses the empty quick add after an add', () => {
    const state = run(
      openQuickAdd('a'),
      { type: 'quickAddChange', text: 'Write docs' },
      { type: 'quickAddAdded' },
    )

    expect(state.focusRequest?.target).toEqual({ kind: 'quickAdd' })
  })

  it('keeps the add column form on Keep editing and focuses it', () => {
    const state = run(
      openAddColumn,
      { type: 'addColumnChange', text: 'Review' },
      openQuickAdd('a'),
      { type: 'discardKeep' },
    )

    expect(state.dialog).toBeNull()
    expect(state.addColumn).toEqual({ text: 'Review', submitted: false })
    expect(state.focusRequest?.target).toEqual({ kind: 'addColumn' })
  })

  it.each(['discardConfirm', 'discardKeep'] as const)(
    'ignores %s without a discard dialog',
    (type) => {
      const none = run(openQuickAdd('a'))
      const rename = run(openQuickAdd('a'), {
        type: 'dialogOpen',
        dialog: { kind: 'renameColumn', columnId: 'a' },
      })

      expect(boardViewReducer(none, { type })).toBe(none)
      expect(boardViewReducer(rename, { type })).toBe(rename)
    },
  )

  it('closes the delete dialog of a column a refetch removed', () => {
    const state = run(
      { type: 'dialogOpen', dialog: { kind: 'deleteColumn', columnId: 'a' } },
      { type: 'columnsChanged', columnIds: ['b'] },
    )

    expect(state.dialog).toBeNull()
  })

  it.each([
    { kind: 'renameColumn', columnId: 'b' },
    { kind: 'deleteColumn', columnId: 'b' },
    { kind: 'renameBoard' },
    { kind: 'deleteBoard' },
  ] as const)(
    'keeps a %o dialog when the columns change around it',
    (dialog) => {
      const before = run({ type: 'dialogOpen', dialog })

      expect(
        boardViewReducer(before, { type: 'columnsChanged', columnIds: ['b'] }),
      ).toBe(before)
    },
  )

  it('drops the discard dialog when the quick add it would replace loses its column', () => {
    const state = run(
      openQuickAdd('a'),
      { type: 'quickAddChange', text: 'Write docs' },
      openAddColumn,
      { type: 'columnsChanged', columnIds: ['b'] },
    )

    expect(state.quickAdd).toBeNull()
    expect(state.dialog).toBeNull()
  })

  it('keeps the discard dialog for add column while the quick add column exists', () => {
    const before = run(
      openQuickAdd('a'),
      { type: 'quickAddChange', text: 'Write docs' },
      openAddColumn,
    )

    expect(
      boardViewReducer(before, { type: 'columnsChanged', columnIds: ['a'] }),
    ).toBe(before)
  })

  it('keeps the discard dialog for a quick add in an existing column while add column is open', () => {
    const before = run(
      openAddColumn,
      { type: 'addColumnChange', text: 'Review' },
      openQuickAdd('a'),
    )

    expect(
      boardViewReducer(before, { type: 'columnsChanged', columnIds: ['a'] }),
    ).toBe(before)
  })

  it('drops the discard dialog for a quick add whose target column is gone', () => {
    const state = run(
      openAddColumn,
      { type: 'addColumnChange', text: 'Review' },
      openQuickAdd('a'),
      { type: 'columnsChanged', columnIds: ['b'] },
    )

    expect(state.dialog).toBeNull()
    expect(state.addColumn).toEqual({ text: 'Review', submitted: false })
  })
})
