import { describe, expect, it } from 'vitest'
import { nameErrorMessageKey } from '../../utils/boardName'
import {
  handleBoardViewError,
  type BoardViewChange,
} from './handleBoardViewError'

const ALL: BoardViewChange[] = [
  'createColumn',
  'renameColumn',
  'moveColumn',
  'deleteColumn',
  'createCard',
]

describe('handleBoardViewError', () => {
  it('shows field errors for the change’s own field', () => {
    expect(
      handleBoardViewError('renameColumn', {
        kind: 'invalid',
        fields: [{ field: 'name', code: 'TOO_LONG', max: 30 }],
      }),
    ).toEqual({
      type: 'fieldErrors',
      fields: [{ field: 'name', code: 'TOO_LONG', max: 30 }],
    })
    expect(
      handleBoardViewError('createCard', {
        kind: 'invalid',
        fields: [{ field: 'title', code: 'REQUIRED' }],
      }),
    ).toEqual({
      type: 'fieldErrors',
      fields: [{ field: 'title', code: 'REQUIRED' }],
    })
  })

  it('treats field errors for another field as a failure', () => {
    expect(
      handleBoardViewError('createCard', {
        kind: 'invalid',
        fields: [{ field: 'name', code: 'REQUIRED' }],
      }),
    ).toEqual({ type: 'failed', reload: true })
  })

  it.each([
    ['createColumn', true],
    ['createCard', true],
    ['moveColumn', true],
    ['renameColumn', false],
    ['deleteColumn', false],
  ] as const)(
    'shows the failure toast for %s and reloads only after a create or move',
    (change, reload) => {
      expect(handleBoardViewError(change, { kind: 'other' })).toEqual({
        type: 'failed',
        reload,
      })
    },
  )

  it('counts a 404 on delete as deleted', () => {
    expect(handleBoardViewError('deleteColumn', { kind: 'notFound' })).toEqual({
      type: 'deleted',
    })
  })

  it('reloads with the “no longer exists” toast for a 404 on any other change', () => {
    for (const change of ALL.filter((entry) => entry !== 'deleteColumn')) {
      expect(handleBoardViewError(change, { kind: 'notFound' })).toEqual({
        type: 'columnGone',
      })
    }
  })

  it('reloads with the stale-move toast for outOfRange on a move', () => {
    expect(handleBoardViewError('moveColumn', { kind: 'outOfRange' })).toEqual({
      type: 'staleMove',
    })
  })

  it('maps field codes to the name messages, unknown codes to the control-character one', () => {
    expect(nameErrorMessageKey('REQUIRED')).toBe('nameErrors.required')
    expect(nameErrorMessageKey('TOO_LONG')).toBe('nameErrors.tooLong')
    expect(nameErrorMessageKey('INVALID_CHARACTER')).toBe(
      'nameErrors.invalidCharacter',
    )
    expect(nameErrorMessageKey('SOMETHING_NEW')).toBe(
      'nameErrors.invalidCharacter',
    )
  })
})
