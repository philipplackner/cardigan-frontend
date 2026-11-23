import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { boardViewKeys } from '../api/boardViewQueries'
import { renderBoardView } from '../testing/renderBoardView'
import { CARDIGAN_BOARD_ID } from '../testing/sampleBoardContent'
import type { BoardDetail } from '../types'

async function setup(options?: Parameters<typeof renderBoardView>[0]) {
  const view = await renderBoardView(options)
  await view.loaded()
  const field = () => screen.getByRole('textbox', { name: 'Card title' })
  const openQuickAdd = (column: string) =>
    view.user.click(
      view.content().getByRole('button', { name: `Add card to “${column}”` }),
    )
  const titles = (column: string) =>
    view
      .column(column)
      .queryAllByRole('button', { name: /^CRD-/ })
      .map((tile) => tile.querySelector('.type-card-title')?.textContent)
  return { ...view, field, openQuickAdd, titles }
}

describe('quick add', () => {
  it('opens at the bottom of the column with focus in the title field', async () => {
    const { openQuickAdd, field, column } = await setup()

    await openQuickAdd('To do')

    expect(field()).toHaveFocus()
    expect(column('To do').getByRole('textbox')).toBe(field())
    expect(
      column('To do').queryByRole('button', { name: 'Add card to “To do”' }),
    ).toBeNull()
    expect(column('To do').getByText('Enter to add')).toHaveClass(
      'phone:hidden',
    )
  })

  it('adds two cards in a row and keeps the field open, empty and focused', async () => {
    const { user, openQuickAdd, field, titles } = await setup()
    await openQuickAdd('Review')

    await user.type(field(), 'Write docs{Enter}')
    await waitFor(() => expect(titles('Review')).toContain('Write docs'))
    await waitFor(() => expect(field()).toHaveFocus())
    await user.type(field(), 'Fix login{Enter}')

    await waitFor(() =>
      expect(titles('Review')).toEqual([
        'Import fails on a board with an empty column',
        'Reverse proxy and TLS on the VPS',
        'Write docs',
        'Fix login',
      ]),
    )
    expect(field()).toHaveValue('')
    await waitFor(() => expect(field()).toHaveFocus())
  })

  it('adds a card with the form’s Add card button', async () => {
    const { user, openQuickAdd, field, column, titles } = await setup()
    await openQuickAdd('Review')

    await user.type(field(), 'Write docs')
    await user.click(column('Review').getByRole('button', { name: 'Add card' }))

    await waitFor(() => expect(titles('Review')).toContain('Write docs'))
  })

  it.each([
    ['Enter', '   {Enter}'],
    ['the Add card button', '   '],
  ])('does nothing for a whitespace-only title with %s', async (how, typed) => {
    const { user, openQuickAdd, field, column, boardView } = await setup()
    const createCard = vi.spyOn(boardView, 'createCard')
    await openQuickAdd('Review')

    await user.type(field(), typed)
    if (how !== 'Enter') {
      await user.click(
        column('Review').getByRole('button', { name: 'Add card' }),
      )
    }

    expect(createCard).not.toHaveBeenCalled()
    expect(field()).not.toHaveAttribute('aria-invalid')
    expect(column('Review').queryByText('Enter a name.')).toBeNull()
  })

  it('does nothing for an empty title with the Add card button', async () => {
    const { user, openQuickAdd, column, boardView } = await setup()
    const createCard = vi.spyOn(boardView, 'createCard')
    await openQuickAdd('Review')

    await user.click(column('Review').getByRole('button', { name: 'Add card' }))

    expect(createCard).not.toHaveBeenCalled()
    expect(column('Review').queryByText('Enter a name.')).toBeNull()
  })

  it('creates nothing for Enter during an IME composition', async () => {
    const { user, openQuickAdd, field, boardView } = await setup()
    const createCard = vi.spyOn(boardView, 'createCard')
    await openQuickAdd('Review')
    await user.type(field(), 'かな')

    fireEvent.keyDown(field(), { key: 'Enter', isComposing: true })
    fireEvent.keyDown(field(), { key: 'Enter', keyCode: 229 })

    expect(createCard).not.toHaveBeenCalled()
  })

  it('closes and drops the text on Escape and on Cancel', async () => {
    const { user, openQuickAdd, field, column } = await setup()
    await openQuickAdd('Review')
    await user.type(field(), 'Write docs{Escape}')
    expect(screen.queryByRole('textbox')).toBeNull()

    await openQuickAdd('Review')
    expect(field()).toHaveValue('')
    await user.type(field(), 'Write docs')
    await user.click(column('Review').getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('stays open with its text on a click outside', async () => {
    const { user, openQuickAdd, field, content } = await setup()
    await openQuickAdd('Review')
    await user.type(field(), 'Write docs')

    await user.click(content().getByRole('heading', { name: 'Done' }))

    expect(field()).toHaveValue('Write docs')
  })

  it.each([
    ['empty', ''],
    ['holding only spaces', '   '],
  ])('closes on a click outside when %s', async (_, text) => {
    const { user, openQuickAdd, field, content } = await setup()
    await openQuickAdd('Review')
    if (text) await user.type(field(), text)

    await user.click(content().getByRole('heading', { name: 'Done' }))

    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('stays open with its text when tabbing out', async () => {
    const { user, openQuickAdd, field } = await setup()
    await openQuickAdd('Review')
    await user.type(field(), 'Write docs')

    await user.tab()
    await user.tab()
    await user.tab()

    expect(field()).not.toHaveFocus()
    expect(field()).toHaveValue('Write docs')
  })

  it('replaces an empty form when opening a second one', async () => {
    const { openQuickAdd, column, field } = await setup()
    await openQuickAdd('To do')

    await openQuickAdd('Done')

    expect(column('To do').queryByRole('textbox')).toBeNull()
    expect(column('Done').getByRole('textbox')).toBe(field())
    expect(field()).toHaveFocus()
  })

  it('shows the length error for a 201-character title, live after the first submit', async () => {
    const { user, openQuickAdd, field, column, boardView } = await setup()
    const createCard = vi.spyOn(boardView, 'createCard')
    await openQuickAdd('Review')
    await user.click(field())
    await user.paste('a'.repeat(201))

    await user.keyboard('{Enter}')

    expect(
      column('Review').getByText('Use at most 200 characters.'),
    ).toBeInTheDocument()
    expect(
      column('Review').getByRole('button', { name: 'Add card' }),
    ).toBeDisabled()
    expect(createCard).not.toHaveBeenCalled()
    await user.keyboard('{Backspace}')
    expect(
      column('Review').queryByText('Use at most 200 characters.'),
    ).toBeNull()
  })

  it('shows the control-character error for a pasted line break', async () => {
    const { user, openQuickAdd, field, column, boardView } = await setup()
    const createCard = vi.spyOn(boardView, 'createCard')
    await openQuickAdd('Review')
    await user.click(field())
    await user.paste('Fix\nlogin')

    await user.keyboard('{Enter}')

    expect(
      column('Review').getByText(
        'Use a single line without control characters.',
      ),
    ).toBeInTheDocument()
    expect(createCard).not.toHaveBeenCalled()
  })

  it('disables the form while saving and ignores Escape and a second Enter', async () => {
    const { user, openQuickAdd, field, column, content, boardView, titles } =
      await setup()
    const createCard = vi.spyOn(boardView, 'createCard')
    await openQuickAdd('Review')
    await user.type(field(), 'Write docs')
    const release = boardView.holdNext('createCard')

    await user.keyboard('{Enter}')

    expect(field()).toBeDisabled()
    expect(
      column('Review').getByRole('button', { name: 'Cancel' }),
    ).toBeDisabled()
    expect(
      column('Review').getByRole('button', { name: 'Add card' }),
    ).toHaveAttribute('aria-busy', 'true')
    expect(
      content().getByRole('button', { name: 'Add card to “To do”' }),
    ).toBeDisabled()
    expect(content().getByRole('button', { name: 'Add column' })).toBeDisabled()
    fireEvent.keyDown(field(), { key: 'Enter' })
    fireEvent.keyDown(field(), { key: 'Escape' })
    expect(createCard).toHaveBeenCalledTimes(1)
    await act(async () => release())

    await waitFor(() =>
      expect(
        titles('Review').filter((title) => title === 'Write docs'),
      ).toHaveLength(1),
    )
    expect(field()).toBeEnabled()
  })

  it('keeps the text and shows a toast when adding fails, then reloads the board', async () => {
    const { user, openQuickAdd, field, boardView, titles } = await setup()
    await openQuickAdd('Review')
    await user.type(field(), 'Write docs')
    boardView.applyThenFailNext('createCard')

    await user.keyboard('{Enter}')

    expect(
      await screen.findByText(
        "Couldn't add the card. Check your connection and try again.",
      ),
    ).toBeInTheDocument()
    await waitFor(() => expect(titles('Review')).toContain('Write docs'))
    expect(field()).toHaveValue('Write docs')
  })

  it('reloads the board with a toast when the column no longer exists', async () => {
    const { user, openQuickAdd, field, boardView, content } = await setup()
    await openQuickAdd('Review')
    await user.type(field(), 'Write docs')
    act(() =>
      boardView.changeBoard(CARDIGAN_BOARD_ID, (columns) =>
        columns.filter((column) => column.name !== 'Review'),
      ),
    )

    await user.keyboard('{Enter}')

    expect(
      await screen.findByText(
        '“Review” no longer exists. The board was reloaded.',
      ),
    ).toBeInTheDocument()
    expect(content().queryByRole('region', { name: 'Review' })).toBeNull()
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('shows a server field error under the field', async () => {
    const { user, openQuickAdd, field, boardView, column } = await setup()
    await openQuickAdd('Review')
    await user.type(field(), 'Write docs')
    boardView.failNext('createCard', {
      kind: 'invalid',
      fields: [{ field: 'title', code: 'SOMETHING_NEW' }],
    })

    await user.keyboard('{Enter}')

    expect(
      await column('Review').findByText(
        'Use a single line without control characters.',
      ),
    ).toBeInTheDocument()
    expect(field()).toHaveValue('Write docs')
  })

  it('writes a held create to its own board after switching boards', async () => {
    const otherId = '00000000-0000-4000-8000-000000000002'
    const {
      user,
      openQuickAdd,
      field,
      boardView,
      queryClient,
      rerenderWith,
      content,
    } = await setup()
    await openQuickAdd('Review')
    await user.type(field(), 'Write docs')
    const release = boardView.holdNext('createCard')
    await user.keyboard('{Enter}')

    rerenderWith(otherId)
    await content().findByText('Card 1')
    const otherBefore = queryClient.getQueryData<BoardDetail>(
      boardViewKeys.detail(otherId),
    )
    await act(async () => release())

    await waitFor(() =>
      expect(
        queryClient
          .getQueryData<BoardDetail>(boardViewKeys.detail(CARDIGAN_BOARD_ID))
          ?.columns.find((column) => column.name === 'Review')
          ?.cards.map((card) => card.title),
      ).toContain('Write docs'),
    )
    expect(
      queryClient.getQueryData<BoardDetail>(boardViewKeys.detail(otherId)),
    ).toEqual(otherBefore)
    expect(content().queryByText('Write docs')).toBeNull()
  })
})
