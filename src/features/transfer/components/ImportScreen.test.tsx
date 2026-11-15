import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ImportReducerState } from '../hooks/importReducer'
import { ImportScreen } from './ImportScreen'

function sizedFile(name: string, size: number) {
  const file = new File(['{}'], name)
  Object.defineProperty(file, 'size', { value: size })
  return file
}

function renderScreen(state: ImportReducerState, onAction = vi.fn()) {
  render(<ImportScreen state={state} onAction={onAction} />)
  return onAction
}

describe('ImportScreen', () => {
  it('shows nothing when idle', () => {
    renderScreen({ step: 'idle' })

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows the empty import dialog', () => {
    renderScreen({ step: 'choosing' })

    const dialog = screen.getByRole('dialog', { name: 'Import board' })
    expect(dialog).toHaveAccessibleDescription(
      'Choose a .json file exported from Cardigan. It’s added as a new board; your other boards don’t change.',
    )
    expect(screen.getByText('Drop a board export here')).toBeVisible()
    expect(screen.getByRole('button', { name: 'browse files' })).toBeVisible()
    expect(screen.getByText('JSON exports up to 5 MB')).toBeVisible()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('suggests JSON files in the file picker', () => {
    renderScreen({ step: 'choosing' })

    expect(document.querySelector('input[type="file"]')).toHaveAttribute(
      'accept',
      '.json,application/json',
    )
  })

  it('shows the file and the size error for a file over 5 MB', () => {
    renderScreen({
      step: 'choosing',
      file: sizedFile('board-backup.json', 7_549_747),
      error: 'tooLarge',
    })

    expect(screen.getByText('board-backup.json')).toBeVisible()
    expect(screen.getAllByText('7.2 MB')[0]).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This file is 7.2 MB. Board exports can be up to 5 MB.',
    )
  })

  it('shows the file and the invalid-file error for a file that is not an export', () => {
    renderScreen({
      step: 'choosing',
      file: sizedFile('notes.json', 14_336),
      error: 'invalidFile',
    })

    expect(screen.getByText('notes.json')).toBeVisible()
    expect(screen.getByText('14 KB')).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This file isn’t a Cardigan board export. Choose a .json file that was exported from Cardigan.',
    )
  })

  it('shows the generic error after a failed upload', () => {
    renderScreen({
      step: 'choosing',
      file: sizedFile('a.json', 100),
      error: 'other',
    })

    expect(screen.getByRole('alert')).toHaveTextContent(
      "Couldn't import the board. Check your connection and try again.",
    )
  })

  it('hides the old file and error while a new file is checked', () => {
    renderScreen({
      step: 'checking',
      file: sizedFile('b.json', 100),
      checkId: 2,
    })

    expect(
      screen.getByRole('dialog', { name: 'Import board' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('b.json')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows the progress dialog while uploading', () => {
    renderScreen({
      step: 'uploading',
      file: sizedFile('board-backup.json', 100),
    })

    const dialog = screen.getByRole('dialog', {
      name: 'Importing board-backup.json',
    })
    expect(dialog).toHaveTextContent(
      'This creates the board with all its columns, cards and labels.',
    )
    expect(screen.queryByRole('dialog', { name: 'Import board' })).toBeNull()
  })

  it('reports Cancel and Escape as cancel', async () => {
    const user = userEvent.setup()
    const onAction = renderScreen({ step: 'choosing' })

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.keyboard('{Escape}')

    expect(onAction.mock.calls).toEqual([
      [{ type: 'cancel' }],
      [{ type: 'cancel' }],
    ])
  })

  it('hands a picked file over', async () => {
    const user = userEvent.setup()
    const onAction = renderScreen({ step: 'choosing' })
    const file = new File(['{}'], 'board.json', { type: 'application/json' })

    await user.upload(
      document.querySelector<HTMLInputElement>('input[type="file"]')!,
      file,
    )

    expect(onAction).toHaveBeenCalledWith({
      type: 'filesChoose',
      files: [file],
    })
  })
})
