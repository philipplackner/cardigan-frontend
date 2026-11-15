import type { ImportError } from '../types'

/** Errors shown in the import dialog's error box. */
export type ImportBoxError = 'tooLarge' | 'invalidFile' | 'other'

/** A key problem shown under the clash dialog's Key field, other than an already used key. */
export type KeyFieldError = { code: string; min?: number; max?: number }

type ClashInfo = {
  /** Every key that came back as already used in this import, oldest first. */
  usedKeys: string[]
  /** Name of the board that uses the last clashing key, if the loaded board list has it. */
  existingName?: string
}

export type ImportReducerState =
  | { step: 'idle' }
  | { step: 'choosing'; file?: File; error?: ImportBoxError }
  | { step: 'checking'; file: File; checkId: number }
  | {
      step: 'uploading'
      file: File
      boardKey?: string
      /** The key sent with a retry after a clash. */
      key?: string
      clash?: ClashInfo
    }
  | ({
      step: 'clash'
      file: File
      boardKey?: string
      keyValue: string
      fieldError?: KeyFieldError
    } & ClashInfo)
  | { step: 'done'; board: { name: string; key: string } }

export type ImportAction =
  | { type: 'open' }
  | { type: 'cancel' }
  | { type: 'fileChoose'; file: File; checkId: number }
  | { type: 'checkPass'; checkId: number; boardKey?: string }
  | { type: 'checkFail'; checkId: number; reason: 'tooLarge' | 'invalidFile' }
  | { type: 'uploadSucceed'; board: { name: string; key: string } }
  | { type: 'uploadFail'; error: ImportError; existingName?: string }
  | { type: 'keyChange'; value: string }
  | { type: 'clashSubmit'; key: string }
  | { type: 'clashKeyReject'; error: KeyFieldError }

export const initialImportState: ImportReducerState = { step: 'idle' }

function failUpload(
  state: Extract<ImportReducerState, { step: 'uploading' }>,
  action: Extract<ImportAction, { type: 'uploadFail' }>,
): ImportReducerState {
  const { file, boardKey } = state
  const previous = state.clash ?? { usedKeys: [] }
  switch (action.error.kind) {
    case 'keyUsed': {
      const clashingKey = state.key ?? boardKey ?? ''
      const usedKeys = previous.usedKeys.includes(clashingKey)
        ? previous.usedKeys
        : [...previous.usedKeys, clashingKey]
      return {
        step: 'clash',
        file,
        boardKey,
        keyValue: clashingKey,
        usedKeys,
        existingName: action.existingName,
      }
    }
    case 'keyInvalid': {
      const { code, min, max } = action.error
      return {
        step: 'clash',
        file,
        boardKey,
        keyValue: state.key ?? '',
        ...previous,
        fieldError: { code, min, max },
      }
    }
    case 'tooLarge':
    case 'invalidFile':
    case 'other':
      return { step: 'choosing', file, error: action.error.kind }
  }
}

export function importReducer(
  state: ImportReducerState,
  action: ImportAction,
): ImportReducerState {
  switch (action.type) {
    case 'open':
      return state.step === 'idle' || state.step === 'done'
        ? { step: 'choosing' }
        : state
    case 'cancel':
      return state.step === 'uploading' ? state : { step: 'idle' }
    case 'fileChoose':
      return state.step === 'choosing' || state.step === 'checking'
        ? { step: 'checking', file: action.file, checkId: action.checkId }
        : state
    case 'checkPass':
      return state.step === 'checking' && state.checkId === action.checkId
        ? { step: 'uploading', file: state.file, boardKey: action.boardKey }
        : state
    case 'checkFail':
      return state.step === 'checking' && state.checkId === action.checkId
        ? { step: 'choosing', file: state.file, error: action.reason }
        : state
    case 'uploadSucceed':
      return state.step === 'uploading'
        ? { step: 'done', board: action.board }
        : state
    case 'uploadFail':
      return state.step === 'uploading' ? failUpload(state, action) : state
    case 'keyChange':
      return state.step === 'clash'
        ? { ...state, keyValue: action.value, fieldError: undefined }
        : state
    case 'clashSubmit':
      return state.step === 'clash'
        ? {
            step: 'uploading',
            file: state.file,
            boardKey: state.boardKey,
            key: action.key,
            clash: {
              usedKeys: state.usedKeys,
              existingName: state.existingName,
            },
          }
        : state
    case 'clashKeyReject':
      return state.step === 'clash'
        ? { ...state, fieldError: action.error }
        : state
  }
}
