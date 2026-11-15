import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/core/ui'
import type { ImportBoard, ImportResult } from '../types'
import { ImportTrigger } from './ImportTrigger'

const HEADER = { format: 'cardigan.board', formatVersion: 1 }

function exportFile(name = 'board-backup.json', key = 'CRD') {
  return new File(
    [JSON.stringify({ ...HEADER, board: { key, name: 'Cardigan v1' } })],
    name,
    {
      type: 'application/json',
    },
  )
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

function setup(
  importBoard: ImportBoard = vi.fn(
    async () => new Promise<ImportResult>(() => {}),
  ),
) {
  const onBoardsChanged = vi.fn()
  const user = userEvent.setup()
  render(
    <ToastProvider closeLabel="Close">
      <ImportTrigger
        importBoard={importBoard}
        findBoardNameByKey={() => undefined}
        onBoardsChanged={onBoardsChanged}
      />
    </ToastProvider>,
  )
  const openDialog = async () => {
    await user.click(screen.getByRole('button', { name: 'Import' }))
    return screen.findByRole('dialog', { name: 'Import board' })
  }
  const pick = (file: File) =>
    user.upload(
      document.querySelector<HTMLInputElement>('input[type="file"]')!,
      file,
    )
  return { user, onBoardsChanged, openDialog, pick, importBoard }
}

function dropZone() {
  return screen.getByText('Drop a board export here').parentElement!
}

const fileDrag = (files: File[]) => ({
  dataTransfer: { types: ['Files'], files },
})

describe('ImportTrigger', () => {
  it('uploads a valid file right away behind the progress dialog', async () => {
    const pending = deferred<ImportResult>()
    const importBoard = vi.fn(() => pending.promise)
    const { openDialog, pick } = setup(importBoard)
    const file = exportFile()

    await openDialog()
    await pick(file)

    expect(
      await screen.findByRole('dialog', {
        name: 'Importing board-backup.json',
      }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Import board' })).toBeNull()
    expect(importBoard).toHaveBeenCalledExactlyOnceWith(file, undefined)
  })

  it('keeps the progress dialog open on Escape', async () => {
    const { user, openDialog, pick } = setup()

    await openDialog()
    await pick(exportFile())
    await screen.findByRole('dialog', { name: 'Importing board-backup.json' })
    await user.keyboard('{Escape}')

    expect(
      screen.getByRole('dialog', { name: 'Importing board-backup.json' }),
    ).toBeInTheDocument()
  })

  it('never uploads a file over 5 MB', async () => {
    const { importBoard, openDialog, pick } = setup()
    const file = new File([new Uint8Array(5_242_881)], 'huge.json')

    await openDialog()
    await pick(file)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This file is 5.1 MB. Board exports can be up to 5 MB.',
    )
    expect(screen.getByText('huge.json')).toBeVisible()
    expect(importBoard).not.toHaveBeenCalled()
  })

  it('never uploads a file that is not JSON', async () => {
    const { importBoard, openDialog, pick } = setup()

    await openDialog()
    await pick(new File(['\x89PNG'], 'image.json'))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This file isn’t a Cardigan board export.',
    )
    expect(importBoard).not.toHaveBeenCalled()
  })

  it.each<[string, ImportResult, string]>([
    [
      '413',
      { ok: false, error: { kind: 'tooLarge' } },
      'This file is 1 KB. Board exports can be up to 5 MB.',
    ],
    [
      '422',
      { ok: false, error: { kind: 'invalidFile' } },
      'This file isn’t a Cardigan board export. Choose a .json file that was exported from Cardigan.',
    ],
    [
      'an unknown failure',
      { ok: false, error: { kind: 'other' } },
      "Couldn't import the board. Check your connection and try again.",
    ],
  ])(
    'shows the file and the message for %s and reloads the boards',
    async (_, result, message) => {
      const { onBoardsChanged, openDialog, pick } = setup(async () => result)
      const file = new File(
        [JSON.stringify({ ...HEADER, pad: 'x'.repeat(1000) })],
        'board.json',
      )

      await openDialog()
      await pick(file)

      expect(await screen.findByRole('alert')).toHaveTextContent(message)
      expect(
        screen.getByRole('dialog', { name: 'Import board' }),
      ).toHaveTextContent('board.json')
      expect(onBoardsChanged).toHaveBeenCalledOnce()
    },
  )

  it('treats a rejected upload as an unknown failure', async () => {
    const { onBoardsChanged, openDialog, pick } = setup(() =>
      Promise.reject(new TypeError('Failed to fetch')),
    )

    await openDialog()
    await pick(exportFile())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't import the board.",
    )
    expect(onBoardsChanged).toHaveBeenCalledOnce()
  })

  it('lets the user choose another file after an error', async () => {
    const importBoard = vi.fn(
      async (): Promise<ImportResult> => new Promise(() => {}),
    )
    const { openDialog, pick } = setup(importBoard)
    const good = exportFile('board-backup.json')

    await openDialog()
    await pick(new File(['nope'], 'notes.json'))
    await screen.findByRole('alert')
    await pick(good)

    await screen.findByRole('dialog', { name: 'Importing board-backup.json' })
    expect(importBoard).toHaveBeenCalledExactlyOnceWith(good, undefined)
  })

  it('uploads only the first of several dropped files', async () => {
    const { importBoard, openDialog } = setup()
    const a = exportFile('a.json')
    const b = exportFile('b.json')

    await openDialog()
    fireEvent.drop(dropZone(), fileDrag([a, b]))

    await screen.findByRole('dialog', { name: 'Importing a.json' })
    expect(importBoard).toHaveBeenCalledExactlyOnceWith(a, undefined)
  })

  it('blocks a file dropped on the scrim and uploads nothing', async () => {
    const { importBoard, openDialog } = setup()

    const dialog = await openDialog()
    const scrim = dialog.previousElementSibling!
    const dragOverAllowed = fireEvent.dragOver(scrim, fileDrag([exportFile()]))
    const dropAllowed = fireEvent.drop(scrim, fileDrag([exportFile()]))

    expect(dragOverAllowed).toBe(false)
    expect(dropAllowed).toBe(false)
    expect(
      screen.getByRole('dialog', { name: 'Import board' }),
    ).toBeInTheDocument()
    expect(importBoard).not.toHaveBeenCalled()
  })

  it('stops blocking drops once the dialog is closed', async () => {
    const { user, openDialog } = setup()

    await openDialog()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    expect(fireEvent.drop(document.body, fileDrag([exportFile()]))).toBe(true)
  })

  it('never uploads a file whose check finishes after Cancel', async () => {
    const { user, importBoard, openDialog } = setup()
    const text = deferred<string>()
    const file = exportFile()
    file.text = () => text.promise

    await openDialog()
    fireEvent.drop(dropZone(), fileDrag([file]))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await act(async () => text.resolve(JSON.stringify(HEADER)))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(importBoard).not.toHaveBeenCalled()
  })

  it('uploads only the newer file when one is dropped during a check', async () => {
    const { importBoard, openDialog } = setup()
    const text = deferred<string>()
    const a = exportFile('a.json')
    a.text = () => text.promise
    const b = exportFile('b.json')

    await openDialog()
    fireEvent.drop(dropZone(), fileDrag([a]))
    fireEvent.drop(dropZone(), fileDrag([b]))
    await screen.findByRole('dialog', { name: 'Importing b.json' })
    await act(async () => text.resolve(JSON.stringify(HEADER)))

    expect(importBoard).toHaveBeenCalledExactlyOnceWith(b, undefined)
  })
})
