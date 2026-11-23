import { act, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderBoardView } from '../testing/renderBoardView'

async function setup() {
  const view = await renderBoardView()
  await view.loaded()
  const addCardTo = (column: string) =>
    view.content().getByRole('button', { name: `Add card to “${column}”` })
  const addColumnButton = () =>
    view.content().getByRole('button', { name: 'Add column' })
  const titleField = () => screen.getByRole('textbox', { name: 'Card title' })
  const nameField = () => screen.getByRole('textbox', { name: 'Name' })
  const dialog = () => within(screen.getByRole('dialog'))
  const formOf = (field: HTMLElement) => field.closest('form')!
  return {
    ...view,
    addCardTo,
    addColumnButton,
    titleField,
    nameField,
    dialog,
    formOf,
  }
}

describe('discarding started text', () => {
  it('asks when switching from a quick add with text to another quick add', async () => {
    const { user, addCardTo, titleField, dialog } = await setup()
    await user.click(addCardTo('To do'))
    await user.type(titleField(), 'Write docs')

    await user.click(addCardTo('Done'))

    expect(
      dialog().getByRole('heading', { name: 'Discard changes?' }),
    ).toBeInTheDocument()
    expect(
      dialog().getByText('The card you started in “To do” hasn’t been added.'),
    ).toBeInTheDocument()
  })

  it('asks when switching from a quick add with text to add column', async () => {
    const { user, addCardTo, addColumnButton, titleField, dialog } =
      await setup()
    await user.click(addCardTo('To do'))
    await user.type(titleField(), 'Write docs')

    await user.click(addColumnButton())

    expect(
      dialog().getByText('The card you started in “To do” hasn’t been added.'),
    ).toBeInTheDocument()
  })

  it('asks when switching from add column with text to a quick add', async () => {
    const { user, addCardTo, addColumnButton, nameField, dialog } =
      await setup()
    await user.click(addColumnButton())
    await user.type(nameField(), 'Review')

    await user.click(addCardTo('To do'))

    expect(
      dialog().getByText('The column you started hasn’t been added.'),
    ).toBeInTheDocument()
  })

  it('opens the target form empty with focus on Discard', async () => {
    const { user, addCardTo, titleField, dialog, column } = await setup()
    await user.click(addCardTo('To do'))
    await user.type(titleField(), 'Write docs')
    await user.click(addCardTo('Done'))

    await user.click(dialog().getByRole('button', { name: 'Discard' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(column('To do').queryByRole('textbox')).toBeNull()
    expect(column('Done').getByRole('textbox')).toHaveValue('')
    await waitFor(() => expect(titleField()).toHaveFocus())
  })

  it.each([
    ['Keep editing', 'button'],
    ['Escape', 'escape'],
    ['a backdrop click', 'backdrop'],
  ])(
    'keeps the first form with its text, scrolled into view and focused, on %s',
    async (_, how) => {
      const { user, addCardTo, titleField, dialog, column, scrollCalls } =
        await setup()
      await user.click(addCardTo('To do'))
      await user.type(titleField(), 'Write docs')
      await user.click(addCardTo('Done'))
      scrollCalls.length = 0

      if (how === 'button') {
        await user.click(dialog().getByRole('button', { name: 'Keep editing' }))
      } else if (how === 'escape') {
        await user.keyboard('{Escape}')
      } else {
        const overlay = document.querySelector<HTMLElement>(
          '[data-state="open"].fixed.inset-\\[0\\]',
        )!
        await user.click(overlay)
      }

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      expect(column('Done').queryByRole('textbox')).toBeNull()
      const field = column('To do').getByRole('textbox')
      expect(field).toHaveValue('Write docs')
      await waitFor(() => expect(field).toHaveFocus())
      expect(scrollCalls.map((call) => call.element)).toContain(
        field.closest('form'),
      )
    },
  )

  it('closes an empty form without asking', async () => {
    const { user, addCardTo, addColumnButton, nameField } = await setup()
    await user.click(addCardTo('To do'))

    await user.click(addColumnButton())

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(nameField()).toHaveFocus()
  })

  it('disables Add card in other columns and Add column while a save runs', async () => {
    const { user, addCardTo, addColumnButton, titleField, boardView } =
      await setup()
    await user.click(addCardTo('To do'))
    await user.type(titleField(), 'Write docs')
    const release = boardView.holdNext('createCard')

    await user.keyboard('{Enter}')

    expect(addCardTo('Done')).toBeDisabled()
    expect(addColumnButton()).toBeDisabled()
    await act(async () => release())
    await waitFor(() => expect(addCardTo('Done')).toBeEnabled())
  })

  it('still discards without asking on Cancel and Escape in a form', async () => {
    const { user, addCardTo, titleField, column } = await setup()
    await user.click(addCardTo('To do'))
    await user.type(titleField(), 'Write docs')
    await user.click(column('To do').getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).toBeNull()

    await user.click(addCardTo('To do'))
    await user.type(titleField(), 'Write docs{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByRole('textbox')).toBeNull()
  })
})
