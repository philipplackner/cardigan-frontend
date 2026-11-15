import { describe, expect, it } from 'vitest'
import {
  importReducer,
  initialImportState,
  type ImportAction,
  type ImportReducerState,
} from './importReducer'

const fileA = new File(['{}'], 'a.json')
const fileB = new File(['{}'], 'b.json')
const BOARD = { name: 'Cardigan v1', key: 'CRDB' }

function run(...actions: ImportAction[]) {
  return actions.reduce(importReducer, initialImportState)
}

const choosing = (): ImportAction[] => [{ type: 'open' }]
const checkingA = (): ImportAction[] => [
  ...choosing(),
  { type: 'fileChoose', file: fileA, checkId: 1 },
]
const uploadingA = (): ImportAction[] => [
  ...checkingA(),
  { type: 'checkPass', checkId: 1, boardKey: 'CRD' },
]
const clashOnCrd = (): ImportAction[] => [
  ...uploadingA(),
  {
    type: 'uploadFail',
    error: { kind: 'keyUsed' },
    existingName: 'Cardigan v1',
  },
]
const retryWithCrdb = (): ImportAction[] => [
  ...clashOnCrd(),
  { type: 'keyChange', value: 'CRDB' },
  { type: 'clashSubmit', key: 'CRDB' },
]

describe('importReducer', () => {
  it('opens the import dialog empty', () => {
    expect(run(...choosing())).toEqual({ step: 'choosing' })
  })

  it('reopens empty after a finished import', () => {
    const done = run(...uploadingA(), { type: 'uploadSucceed', board: BOARD })

    expect(importReducer(done, { type: 'open' })).toEqual({ step: 'choosing' })
  })

  it('ignores open while the flow is running', () => {
    const checking = run(...checkingA())

    expect(importReducer(checking, { type: 'open' })).toBe(checking)
  })

  it('checks a chosen file', () => {
    expect(run(...checkingA())).toEqual({
      step: 'checking',
      file: fileA,
      checkId: 1,
    })
  })

  it('uploads right after a passed check, keeping the file key', () => {
    expect(run(...uploadingA())).toEqual({
      step: 'uploading',
      file: fileA,
      boardKey: 'CRD',
    })
  })

  it.each(['tooLarge', 'invalidFile'] as const)(
    'shows the file and the %s error after a failed check',
    (reason) => {
      expect(
        run(...checkingA(), { type: 'checkFail', checkId: 1, reason }),
      ).toEqual({
        step: 'choosing',
        file: fileA,
        error: reason,
      })
    },
  )

  it('replaces an earlier error and file with a newly chosen file', () => {
    const state = run(
      ...checkingA(),
      { type: 'checkFail', checkId: 1, reason: 'invalidFile' },
      { type: 'fileChoose', file: fileB, checkId: 2 },
    )

    expect(state).toEqual({ step: 'checking', file: fileB, checkId: 2 })
  })

  it('ignores the result of a check for an older file', () => {
    const newer = run(...checkingA(), {
      type: 'fileChoose',
      file: fileB,
      checkId: 2,
    })

    expect(importReducer(newer, { type: 'checkPass', checkId: 1 })).toBe(newer)
    expect(
      importReducer(newer, {
        type: 'checkFail',
        checkId: 1,
        reason: 'invalidFile',
      }),
    ).toBe(newer)
  })

  it('ignores a check that resolves after cancel', () => {
    const cancelled = run(...checkingA(), { type: 'cancel' })

    expect(importReducer(cancelled, { type: 'checkPass', checkId: 1 })).toEqual(
      {
        step: 'idle',
      },
    )
  })

  it.each([
    ['choosing', choosing()],
    ['checking', checkingA()],
    ['clash', clashOnCrd()],
  ])('closes everything on cancel from %s', (_, actions) => {
    expect(run(...actions, { type: 'cancel' })).toEqual({ step: 'idle' })
  })

  it('keeps uploading on cancel, since the progress dialog cannot be closed', () => {
    const uploading = run(...uploadingA())

    expect(importReducer(uploading, { type: 'cancel' })).toBe(uploading)
  })

  it('finishes with the created board', () => {
    expect(
      run(...uploadingA(), { type: 'uploadSucceed', board: BOARD }),
    ).toEqual({
      step: 'done',
      board: BOARD,
    })
  })

  it.each(['tooLarge', 'invalidFile', 'other'] as const)(
    'returns to the import dialog with the file and the %s error after a failed upload',
    (kind) => {
      expect(
        run(...uploadingA(), { type: 'uploadFail', error: { kind } }),
      ).toEqual({
        step: 'choosing',
        file: fileA,
        error: kind,
      })
    },
  )

  it('opens the clash with the clashing key prefilled and marked as used', () => {
    expect(run(...clashOnCrd())).toEqual({
      step: 'clash',
      file: fileA,
      boardKey: 'CRD',
      keyValue: 'CRD',
      usedKeys: ['CRD'],
      existingName: 'Cardigan v1',
    })
  })

  it('opens the clash with an empty key when the file had no readable key', () => {
    const state = run(
      ...checkingA(),
      { type: 'checkPass', checkId: 1 },
      { type: 'uploadFail', error: { kind: 'keyUsed' } },
    )

    expect(state).toMatchObject({ step: 'clash', keyValue: '', usedKeys: [''] })
  })

  it('stores the typed key and clears a field error', () => {
    const state = run(
      ...clashOnCrd(),
      { type: 'clashKeyReject', error: { code: 'TOO_SHORT', min: 2 } },
      { type: 'keyChange', value: 'CRDB' },
    )

    expect(state).toMatchObject({
      step: 'clash',
      keyValue: 'CRDB',
      fieldError: undefined,
    })
  })

  it('re-uploads the same file with the new key', () => {
    expect(run(...retryWithCrdb())).toEqual({
      step: 'uploading',
      file: fileA,
      boardKey: 'CRD',
      key: 'CRDB',
      clash: { usedKeys: ['CRD'], existingName: 'Cardigan v1' },
    })
  })

  it('collects every clashing key when the retry clashes again', () => {
    const state = run(...retryWithCrdb(), {
      type: 'uploadFail',
      error: { kind: 'keyUsed' },
      existingName: undefined,
    })

    expect(state).toEqual({
      step: 'clash',
      file: fileA,
      boardKey: 'CRD',
      keyValue: 'CRDB',
      usedKeys: ['CRD', 'CRDB'],
      existingName: undefined,
    })
  })

  it('shows a server key error under the field and keeps the used keys', () => {
    const state = run(...retryWithCrdb(), {
      type: 'uploadFail',
      error: { kind: 'keyInvalid', code: 'INVALID_FORMAT' },
    })

    expect(state).toEqual({
      step: 'clash',
      file: fileA,
      boardKey: 'CRD',
      keyValue: 'CRDB',
      usedKeys: ['CRD'],
      existingName: 'Cardigan v1',
      fieldError: { code: 'INVALID_FORMAT', min: undefined, max: undefined },
    })
  })

  it('returns to the import dialog with the error when a retry fails for another reason', () => {
    expect(
      run(...retryWithCrdb(), { type: 'uploadFail', error: { kind: 'other' } }),
    ).toEqual({
      step: 'choosing',
      file: fileA,
      error: 'other',
    })
  })

  it.each<[string, ImportReducerState, ImportAction]>([
    [
      'a file outside the dialog',
      { step: 'idle' },
      { type: 'fileChoose', file: fileA, checkId: 1 },
    ],
    [
      'a check outside checking',
      { step: 'choosing' },
      { type: 'checkPass', checkId: 1 },
    ],
    [
      'an upload result outside uploading',
      { step: 'idle' },
      { type: 'uploadSucceed', board: BOARD },
    ],
    [
      'an upload failure outside uploading',
      { step: 'idle' },
      { type: 'uploadFail', error: { kind: 'other' } },
    ],
    [
      'a key change outside the clash',
      { step: 'choosing' },
      { type: 'keyChange', value: 'X' },
    ],
    [
      'a clash submit outside the clash',
      { step: 'choosing' },
      { type: 'clashSubmit', key: 'X' },
    ],
    [
      'a key rejection outside the clash',
      { step: 'choosing' },
      { type: 'clashKeyReject', error: { code: 'TOO_SHORT' } },
    ],
  ])('ignores %s', (_, state, action) => {
    expect(importReducer(state, action)).toBe(state)
  })
})
