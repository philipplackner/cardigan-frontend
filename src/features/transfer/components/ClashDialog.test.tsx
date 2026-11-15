import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ImportReducerState } from '../hooks/importReducer'
import { ImportScreen } from './ImportScreen'

type ClashState = Extract<ImportReducerState, { step: 'clash' }>

const file = new File(['{}'], 'board-backup.json')

function clash(overrides: Partial<ClashState> = {}): ClashState {
  return {
    step: 'clash',
    file,
    boardKey: 'CRD',
    keyValue: 'CRD',
    usedKeys: ['CRD'],
    existingName: 'Cardigan v1',
    ...overrides,
  }
}

function renderClash(state: ClashState, onAction = vi.fn()) {
  render(<ImportScreen state={state} onAction={onAction} />)
  return onAction
}

const keyField = () => screen.getByRole('textbox', { name: 'Key' })
const importButton = () => screen.getByRole('button', { name: 'Import' })

describe('ClashDialog', () => {
  it('names the board that uses the key', () => {
    renderClash(clash())

    expect(
      screen.getByRole('dialog', { name: 'Choose a different key' }),
    ).toHaveAccessibleDescription(
      'Your board “Cardigan v1” already uses the key CRD. Enter another key for the imported board.',
    )
  })

  it('uses the fallback text when the board is not loaded', () => {
    renderClash(clash({ existingName: undefined }))

    expect(screen.getByRole('dialog')).toHaveAccessibleDescription(
      'One of your boards already uses the key CRD. Enter another key for the imported board.',
    )
  })

  it('names the latest clashing key in the text', () => {
    renderClash(
      clash({
        keyValue: 'CRDB',
        usedKeys: ['CRD', 'CRDB'],
        existingName: undefined,
      }),
    )

    expect(screen.getByRole('dialog')).toHaveAccessibleDescription(
      'One of your boards already uses the key CRDB. Enter another key for the imported board.',
    )
  })

  it('opens with the clashing key, the used-key error and Import disabled', () => {
    renderClash(clash())

    expect(keyField()).toHaveValue('CRD')
    expect(keyField()).toHaveAccessibleDescription(
      'You already have a board with the key CRD. 2–5 uppercase letters. Can’t be changed later.',
    )
    expect(keyField()).toBeInvalid()
    expect(importButton()).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel import' })).toBeEnabled()
  })

  it('enables Import without an error once the key differs', () => {
    renderClash(clash({ keyValue: 'CRDB' }))

    expect(keyField()).toBeValid()
    expect(screen.queryByText(/already have a board/)).toBeNull()
    expect(importButton()).toBeEnabled()
  })

  it('treats every earlier clashing key as used', () => {
    renderClash(clash({ keyValue: 'CRD', usedKeys: ['CRD', 'CRDB'] }))

    expect(
      screen.getByText('You already have a board with the key CRD.'),
    ).toBeVisible()
    expect(importButton()).toBeDisabled()
  })

  it.each([
    ['REQUIRED', 'Enter a key.'],
    ['TOO_SHORT', 'Use at least 2 letters.'],
    ['TOO_LONG', 'Use at most 5 letters.'],
    ['INVALID_FORMAT', 'Use only the letters A–Z.'],
    ['SOMETHING_NEW', 'Use only the letters A–Z.'],
  ])('shows the %s key error under the field', (code, message) => {
    renderClash(clash({ keyValue: 'C', fieldError: { code } }))

    expect(screen.getByText(message)).toBeVisible()
    expect(keyField()).toBeInvalid()
    expect(importButton()).toBeEnabled()
  })

  it('reports typing, submitting and cancelling', async () => {
    const user = userEvent.setup()
    const onAction = renderClash(clash({ keyValue: 'CRDB' }))

    fireEvent.change(keyField(), { target: { value: 'crdbx' } })
    await user.click(importButton())
    await user.click(screen.getByRole('button', { name: 'Cancel import' }))

    expect(onAction.mock.calls).toEqual([
      [{ type: 'keyChange', value: 'crdbx' }],
      [{ type: 'clashSubmit' }],
      [{ type: 'cancel' }],
    ])
  })

  it('submits with Enter in the key field', async () => {
    const user = userEvent.setup()
    const onAction = renderClash(clash({ keyValue: 'CRDB' }))

    await user.type(keyField(), '{Enter}')

    expect(onAction).toHaveBeenCalledWith({ type: 'clashSubmit' })
  })

  it('reports Escape as cancel', async () => {
    const user = userEvent.setup()
    const onAction = renderClash(clash())

    await user.keyboard('{Escape}')

    expect(onAction).toHaveBeenCalledWith({ type: 'cancel' })
  })
})
