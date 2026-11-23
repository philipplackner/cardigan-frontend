import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderBoardView } from '../testing/renderBoardView'
import { CARDIGAN_BOARD_ID } from '../testing/sampleBoardContent'

async function setup(options?: Parameters<typeof renderBoardView>[0]) {
  const view = await renderBoardView(options)
  await view.loaded()
  const nameField = () => screen.getByRole('textbox', { name: 'Name' })
  const form = () =>
    within(
      document.querySelector<HTMLElement>('[data-inline-form="addColumn"]')!,
    )
  const openAddColumn = () =>
    view.user.click(view.content().getByRole('button', { name: 'Add column' }))
  const columnNames = () =>
    view
      .content()
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent)
  return { ...view, nameField, form, openAddColumn, columnNames }
}

describe('add column', () => {
  it('adds a column at the end, scrolls it into view and focuses its Add card', async () => {
    const {
      user,
      openAddColumn,
      nameField,
      columnNames,
      content,
      scrollCalls,
    } = await setup()

    await openAddColumn()
    expect(nameField()).toHaveFocus()
    await user.type(nameField(), 'Blocked{Enter}')

    await waitFor(() =>
      expect(columnNames()).toEqual([
        'To do',
        'In progress',
        'Review',
        'Done',
        'Blocked',
      ]),
    )
    const addCard = content().getByRole('button', {
      name: 'Add card to “Blocked”',
    })
    await waitFor(() => expect(addCard).toHaveFocus())
    expect(screen.queryByRole('textbox', { name: 'Name' })).toBeNull()
    const blocked = content().getByRole('region', { name: 'Blocked' })
    expect(scrollCalls).toContainEqual({
      element: blocked,
      options: { inline: 'nearest' },
    })
  })

  it('does not reload the board after a successful add', async () => {
    const { user, boardView, openAddColumn, nameField, columnNames } =
      await setup()
    const loadBoard = vi.spyOn(boardView, 'loadBoard')

    await openAddColumn()
    await user.type(nameField(), 'Blocked{Enter}')

    await waitFor(() => expect(columnNames()).toContain('Blocked'))
    expect(loadBoard).not.toHaveBeenCalled()
  })

  it('opens from the empty state and adds the first column', async () => {
    const view = await renderBoardView({
      prepare: ({ boardView }) =>
        boardView.changeBoard(CARDIGAN_BOARD_ID, () => []),
    })
    await view.content().findByRole('heading', {
      name: 'This board has no columns',
    })

    await view.user.click(
      view.content().getByRole('button', { name: 'Add column' }),
    )
    const field = screen.getByRole('textbox', { name: 'Name' })
    expect(field).toHaveFocus()
    expect(
      view.content().queryByRole('heading', {
        name: 'This board has no columns',
      }),
    ).toBeNull()
    await view.user.type(field, 'To do{Enter}')

    expect(
      await view.content().findByRole('region', { name: 'To do' }),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(
        view.content().getByRole('button', { name: 'Add card to “To do”' }),
      ).toHaveFocus(),
    )
  })

  it('allows duplicate names', async () => {
    const { user, openAddColumn, nameField, columnNames } = await setup()

    await openAddColumn()
    await user.type(nameField(), 'Review{Enter}')

    await waitFor(() =>
      expect(columnNames().filter((name) => name === 'Review')).toHaveLength(2),
    )
  })

  it('shows name errors on the first submit and updates them live', async () => {
    const { user, openAddColumn, nameField, form, boardView } = await setup()
    const createColumn = vi.spyOn(boardView, 'createColumn')
    await openAddColumn()

    await user.keyboard('{Enter}')
    expect(form().getByText('Enter a name.')).toBeInTheDocument()

    await user.click(nameField())
    await user.paste('a'.repeat(31))
    expect(form().getByText('Use at most 30 characters.')).toBeInTheDocument()
    expect(form().getByRole('button', { name: 'Add column' })).toBeDisabled()

    await user.keyboard('{Backspace}')
    expect(form().queryByText('Use at most 30 characters.')).toBeNull()

    await user.clear(nameField())
    await user.paste('To\u0007do')
    expect(
      form().getByText('Use a single line without control characters.'),
    ).toBeInTheDocument()
    expect(createColumn).not.toHaveBeenCalled()
  })

  it('creates nothing for Enter during an IME composition', async () => {
    const { user, openAddColumn, nameField, boardView } = await setup()
    const createColumn = vi.spyOn(boardView, 'createColumn')
    await openAddColumn()
    await user.type(nameField(), 'かな')

    fireEvent.keyDown(nameField(), { key: 'Enter', isComposing: true })
    fireEvent.keyDown(nameField(), { key: 'Enter', keyCode: 229 })

    expect(createColumn).not.toHaveBeenCalled()
    expect(nameField()).toHaveValue('かな')
  })

  it('shows a server field error under the field', async () => {
    const { user, openAddColumn, nameField, form, boardView } = await setup()
    boardView.failNext('createColumn', {
      kind: 'invalid',
      fields: [{ field: 'name', code: 'TOO_LONG', max: 30 }],
    })

    await openAddColumn()
    await user.type(nameField(), 'Blocked{Enter}')

    expect(
      await form().findByText('Use at most 30 characters.'),
    ).toBeInTheDocument()
    expect(nameField()).toHaveValue('Blocked')
  })

  it('keeps the form open with a toast when adding fails, then reloads the board', async () => {
    const { user, openAddColumn, nameField, boardView, columnNames } =
      await setup()
    boardView.applyThenFailNext('createColumn')

    await openAddColumn()
    await user.type(nameField(), 'Blocked{Enter}')

    expect(
      await screen.findByText(
        "Couldn't add the column. Check your connection and try again.",
      ),
    ).toBeInTheDocument()
    await waitFor(() => expect(columnNames()).toContain('Blocked'))
    expect(nameField()).toHaveValue('Blocked')
  })

  it('closes on Escape and on Cancel', async () => {
    const { user, openAddColumn, nameField, form } = await setup()
    await openAddColumn()
    await user.type(nameField(), 'Blocked{Escape}')
    expect(screen.queryByRole('textbox', { name: 'Name' })).toBeNull()

    await openAddColumn()
    await user.type(nameField(), 'Blocked')
    await user.click(form().getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('textbox', { name: 'Name' })).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('disables the controls while saving', async () => {
    const { user, openAddColumn, nameField, form, content, boardView } =
      await setup()
    await openAddColumn()
    await user.type(nameField(), 'Blocked')
    const release = boardView.holdNext('createColumn')

    await user.keyboard('{Enter}')

    expect(nameField()).toBeDisabled()
    expect(form().getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(
      content().getByRole('button', { name: 'Add card to “To do”' }),
    ).toBeDisabled()
    await act(async () => release())
  })
})
