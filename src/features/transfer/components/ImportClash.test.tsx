import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/core/ui'
import type { ImportBoard, ImportResult } from '../types'
import { ImportTrigger } from './ImportTrigger'

function exportFile(key = 'CRD', name = 'board-backup.json') {
  return new File(
    [
      JSON.stringify({
        format: 'cardigan.board',
        formatVersion: 1,
        board: { key },
      }),
    ],
    name,
  )
}

const KEY_USED: ImportResult = { ok: false, error: { kind: 'keyUsed' } }
const created = (name: string, key: string): ImportResult => ({
  ok: true,
  board: { name, key },
})

const LOADED_BOARDS: Record<string, string> = { CRD: 'Cardigan v1' }

/** Answers each upload with the next result. */
function importAnswering(...results: ImportResult[]) {
  return vi.fn<ImportBoard>(
    async () => results.shift() ?? { ok: false, error: { kind: 'other' } },
  )
}

function setup(importBoard: ImportBoard) {
  const onBoardsChanged = vi.fn()
  const user = userEvent.setup()
  render(
    <ToastProvider closeLabel="Close">
      <ImportTrigger
        importBoard={importBoard}
        findBoardNameByKey={(key) => LOADED_BOARDS[key]}
        onBoardsChanged={onBoardsChanged}
      />
    </ToastProvider>,
  )
  const importFile = async (file = exportFile()) => {
    await user.click(screen.getByRole('button', { name: 'Import' }))
    await screen.findByRole('dialog', { name: 'Import board' })
    await user.upload(
      document.querySelector<HTMLInputElement>('input[type="file"]')!,
      file,
    )
  }
  const keyField = () => screen.getByRole('textbox', { name: 'Key' })
  const submit = () =>
    user.click(screen.getByRole('button', { name: 'Import' }))
  const retypeKey = async (key: string) => {
    await user.clear(keyField())
    await user.type(keyField(), key)
  }
  return { user, onBoardsChanged, importFile, keyField, submit, retypeKey }
}

describe('import key clash', () => {
  it('opens the clash dialog with the file key and the loaded board name', async () => {
    const { importFile, keyField, onBoardsChanged } = setup(
      importAnswering(KEY_USED),
    )

    await importFile()

    const dialog = await screen.findByRole('dialog', {
      name: 'Choose a different key',
    })
    expect(dialog).toHaveTextContent(
      'Your board “Cardigan v1” already uses the key CRD.',
    )
    expect(keyField()).toHaveValue('CRD')
    expect(
      screen.getByText('You already have a board with the key CRD.'),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled()
    expect(screen.queryByRole('dialog', { name: 'Import board' })).toBeNull()
    expect(onBoardsChanged).not.toHaveBeenCalled()
  })

  it('uses the fallback text when the clashing board is not loaded', async () => {
    const { importFile } = setup(importAnswering(KEY_USED))

    await importFile(exportFile('GARD'))

    expect(
      await screen.findByRole('dialog', { name: 'Choose a different key' }),
    ).toHaveTextContent('One of your boards already uses the key GARD.')
  })

  it('uppercases typed letters and enables Import for a new key', async () => {
    const { importFile, keyField, retypeKey } = setup(importAnswering(KEY_USED))

    await importFile()
    await screen.findByRole('dialog', { name: 'Choose a different key' })
    await retypeKey('crdb')

    expect(keyField()).toHaveValue('CRDB')
    expect(screen.queryByText(/already have a board/)).toBeNull()
    expect(screen.getByRole('button', { name: 'Import' })).toBeEnabled()
  })

  it('disables Import again when the clashing key is typed back', async () => {
    const { importFile, keyField, retypeKey } = setup(importAnswering(KEY_USED))

    await importFile()
    await screen.findByRole('dialog', { name: 'Choose a different key' })
    await retypeKey('CRDB')
    await retypeKey('crd')

    expect(keyField()).toHaveValue('CRD')
    expect(
      screen.getByText('You already have a board with the key CRD.'),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled()
  })

  it('keeps non-ASCII letters as typed so the key check rejects them', async () => {
    const importBoard = importAnswering(KEY_USED)
    const { importFile, keyField, retypeKey, submit } = setup(importBoard)

    await importFile()
    await screen.findByRole('dialog', { name: 'Choose a different key' })
    await retypeKey('äb')
    await submit()

    expect(keyField()).toHaveValue('äB')
    expect(screen.getByText('Use only the letters A–Z.')).toBeVisible()
    expect(importBoard).toHaveBeenCalledOnce()
  })

  it.each([
    ['', 'Enter a key.'],
    ['C', 'Use at least 2 letters.'],
    ['CRDBXY', 'Use at most 5 letters.'],
    ['CR1', 'Use only the letters A–Z.'],
  ])('rejects %j on the client without uploading', async (key, message) => {
    const importBoard = importAnswering(KEY_USED)
    const { importFile, keyField, user, submit } = setup(importBoard)

    await importFile()
    await screen.findByRole('dialog', { name: 'Choose a different key' })
    await user.clear(keyField())
    if (key) await user.type(keyField(), key)
    await submit()

    expect(screen.getByText(message)).toBeVisible()
    expect(
      screen.getByRole('dialog', { name: 'Choose a different key' }),
    ).toBeInTheDocument()
    expect(importBoard).toHaveBeenCalledOnce()
  })

  it('re-uploads the same file with the new key and finishes', async () => {
    const importBoard = importAnswering(
      KEY_USED,
      created('Cardigan v1', 'CRDB'),
    )
    const { importFile, retypeKey, submit, onBoardsChanged } =
      setup(importBoard)
    const file = exportFile()

    await importFile(file)
    await screen.findByRole('dialog', { name: 'Choose a different key' })
    await retypeKey('CRDB')
    await submit()

    expect(
      await screen.findByText('Imported “Cardigan v1” with the key CRDB.'),
    ).toBeVisible()
    expect(importBoard.mock.calls).toEqual([
      [file, undefined],
      [file, 'CRDB'],
    ])
    expect(onBoardsChanged).toHaveBeenCalledOnce()
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('stays open with the error and Import disabled when the new key clashes too', async () => {
    const importBoard = importAnswering(KEY_USED, KEY_USED)
    const { importFile, keyField, retypeKey, submit } = setup(importBoard)

    await importFile()
    await screen.findByRole('dialog', { name: 'Choose a different key' })
    await retypeKey('CRDB')
    await submit()

    await screen.findByText('You already have a board with the key CRDB.')
    expect(keyField()).toHaveValue('CRDB')
    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled()
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'One of your boards already uses the key CRDB.',
    )
  })

  it('keeps the first clashing key disabled after a second clash', async () => {
    const importBoard = importAnswering(KEY_USED, KEY_USED)
    const { importFile, retypeKey, submit } = setup(importBoard)

    await importFile()
    await screen.findByRole('dialog', { name: 'Choose a different key' })
    await retypeKey('CRDB')
    await submit()
    await screen.findByText('You already have a board with the key CRDB.')
    await retypeKey('CRD')

    expect(
      screen.getByText('You already have a board with the key CRD.'),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled()
  })

  it('shows a server key error under the field', async () => {
    const importBoard = importAnswering(KEY_USED, {
      ok: false,
      error: { kind: 'keyInvalid', code: 'INVALID_FORMAT' },
    })
    const { importFile, retypeKey, submit, onBoardsChanged } =
      setup(importBoard)

    await importFile()
    await screen.findByRole('dialog', { name: 'Choose a different key' })
    await retypeKey('CRDB')
    await submit()

    expect(await screen.findByText('Use only the letters A–Z.')).toBeVisible()
    expect(
      screen.getByRole('dialog', { name: 'Choose a different key' }),
    ).toBeInTheDocument()
    expect(onBoardsChanged).not.toHaveBeenCalled()
  })

  it('shows the INVALID_FORMAT message for an unknown server key code', async () => {
    const importBoard = importAnswering(KEY_USED, {
      ok: false,
      error: { kind: 'keyInvalid', code: 'NEW_RULE' },
    })
    const { importFile, retypeKey, submit } = setup(importBoard)

    await importFile()
    await screen.findByRole('dialog', { name: 'Choose a different key' })
    await retypeKey('CRDB')
    await submit()

    expect(await screen.findByText('Use only the letters A–Z.')).toBeVisible()
  })

  it('returns to the import dialog with the generic error when a retry fails without a response', async () => {
    const importBoard = vi.fn<ImportBoard>()
    importBoard.mockResolvedValueOnce(KEY_USED)
    importBoard.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { importFile, retypeKey, submit, onBoardsChanged } =
      setup(importBoard)

    await importFile()
    await screen.findByRole('dialog', { name: 'Choose a different key' })
    await retypeKey('CRDB')
    await submit()

    const dialog = await screen.findByRole('dialog', { name: 'Import board' })
    expect(dialog).toHaveTextContent('board-backup.json')
    expect(screen.getByRole('alert')).toHaveTextContent(
      "Couldn't import the board. Check your connection and try again.",
    )
    expect(
      screen.queryByRole('dialog', { name: 'Choose a different key' }),
    ).toBeNull()
    expect(onBoardsChanged).toHaveBeenCalledOnce()
  })

  it('closes everything on Cancel import and uploads nothing more', async () => {
    const importBoard = importAnswering(KEY_USED)
    const { user, importFile } = setup(importBoard)

    await importFile()
    await screen.findByRole('dialog', { name: 'Choose a different key' })
    await user.click(screen.getByRole('button', { name: 'Cancel import' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(importBoard).toHaveBeenCalledOnce()
  })
})

describe('import focus', () => {
  it('returns focus to the Import button after a clash, a retry and success', async () => {
    const importBoard = importAnswering(
      KEY_USED,
      created('Cardigan v1', 'CRDB'),
    )
    const { importFile, retypeKey, submit } = setup(importBoard)

    await importFile()
    await screen.findByRole('dialog', { name: 'Choose a different key' })
    await retypeKey('CRDB')
    await submit()
    await screen.findByText('Imported “Cardigan v1” with the key CRDB.')

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Import' })).toHaveFocus(),
    )
  })

  it('returns focus to the Import button after Cancel import', async () => {
    const { user, importFile } = setup(importAnswering(KEY_USED))

    await importFile()
    await screen.findByRole('dialog', { name: 'Choose a different key' })
    await user.click(screen.getByRole('button', { name: 'Cancel import' }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Import' })).toHaveFocus(),
    )
  })
})

describe('import success', () => {
  it('closes the dialogs, reloads the boards and confirms with the file key', async () => {
    const { importFile, onBoardsChanged } = setup(
      importAnswering(created('Garden irrigation', 'GARD')),
    )

    await importFile(exportFile('GARD'))

    expect(
      await screen.findByText(
        'Imported “Garden irrigation” with the key GARD.',
      ),
    ).toBeVisible()
    expect(onBoardsChanged).toHaveBeenCalledOnce()
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('shows names with markup characters as plain text', async () => {
    const { importFile } = setup(importAnswering(created('R&D <x>', 'RND')))

    await importFile()

    const toast = await screen.findByText(/^Imported/)
    expect(toast.textContent).toBe('Imported “R&D <x>” with the key RND.')
  })
})
