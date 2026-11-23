import { useReducer, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/core/ui'
import { checkBoardKey, normalizeKeyInput } from '@/core/utils/boardKey'
import type { ImportScreenAction } from '../components/ImportScreen'
import type { ImportBoard, ImportResult } from '../types'
import { checkExportFile } from '../utils/checkExportFile'
import { importReducer, initialImportState } from './importReducer'

export type ImportFlowParams = {
  importBoard: ImportBoard
  /** Name of a board in the already loaded board list, used in the key clash text. */
  findBoardNameByKey: (key: string) => string | undefined
  /** Called after an upload that may have changed the board list: a success or a failed upload. */
  onBoardsChanged: () => void
}

export function useImportViewModel({
  importBoard,
  findBoardNameByKey,
  onBoardsChanged,
}: ImportFlowParams) {
  const { t } = useTranslation('transfer')
  const toast = useToast()
  const [state, dispatch] = useReducer(importReducer, initialImportState)
  const nextCheckId = useRef(0)
  // Only the latest check may start an upload; 0 means the dialog was closed.
  const currentCheckId = useRef(0)

  const upload = async (
    file: File,
    key: string | undefined,
    boardKey: string | undefined,
  ) => {
    let result: ImportResult
    try {
      result = await importBoard(file, key)
    } catch {
      result = { ok: false, error: { kind: 'other' } }
    }

    if (result.ok) {
      dispatch({ type: 'uploadSucceed', board: result.board })
      onBoardsChanged()
      toast.show({
        type: 'success',
        message: t('import.done', {
          name: result.board.name,
          key: result.board.key,
        }),
      })
      return
    }

    const { error } = result
    if (error.kind === 'keyUsed') {
      const clashingKey = key ?? boardKey
      dispatch({
        type: 'uploadFail',
        error,
        existingName: clashingKey ? findBoardNameByKey(clashingKey) : undefined,
      })
      return
    }
    dispatch({ type: 'uploadFail', error })
    if (error.kind !== 'keyInvalid') onBoardsChanged()
  }

  const chooseFile = async (file: File) => {
    const checkId = ++nextCheckId.current
    currentCheckId.current = checkId
    dispatch({ type: 'fileChoose', file, checkId })

    const check = await checkExportFile(file)
    if (currentCheckId.current !== checkId) return
    currentCheckId.current = 0
    if (!check.ok) {
      dispatch({ type: 'checkFail', checkId, reason: check.reason })
      return
    }
    dispatch({ type: 'checkPass', checkId, boardKey: check.boardKey })
    await upload(file, undefined, check.boardKey)
  }

  const onAction = (action: ImportScreenAction) => {
    switch (action.type) {
      case 'filesChoose': {
        const file = action.files[0]
        if (file && (state.step === 'choosing' || state.step === 'checking')) {
          void chooseFile(file)
        }
        break
      }
      case 'cancel':
        currentCheckId.current = 0
        dispatch({ type: 'cancel' })
        break
      case 'keyChange':
        dispatch({
          type: 'keyChange',
          value: normalizeKeyInput(action.value),
        })
        break
      case 'clashSubmit': {
        if (state.step !== 'clash') break
        const key = state.keyValue
        if (state.usedKeys.includes(key)) break
        const code = checkBoardKey(key)
        if (code) {
          dispatch({ type: 'clashKeyReject', error: { code } })
          break
        }
        dispatch({ type: 'clashSubmit', key })
        void upload(state.file, key, state.boardKey)
        break
      }
    }
  }

  const open = () => dispatch({ type: 'open' })

  return { state, onAction, open }
}
