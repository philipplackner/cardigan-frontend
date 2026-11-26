import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { InlineForm } from './InlineForm'

function renderForm() {
  const onOutside = vi.fn()
  const onSubmit = vi.fn()
  const ui = (isSaving: boolean) => (
    <>
      <InlineForm
        data-inline-form="test"
        isSaving={isSaving}
        onOutside={onOutside}
        onSubmit={onSubmit}
      >
        <input aria-label="Title" data-inline-field />
        <button type="button">Inside</button>
      </InlineForm>
      <button type="button">Outside</button>
    </>
  )
  const result = render(ui(false))
  return {
    user: userEvent.setup(),
    onOutside,
    onSubmit,
    setSaving: (isSaving: boolean) => result.rerender(ui(isSaving)),
    unmount: result.unmount,
    field: () => screen.getByRole('textbox', { name: 'Title' }),
    inside: () => screen.getByRole('button', { name: 'Inside' }),
    outside: () => screen.getByRole('button', { name: 'Outside' }),
  }
}

describe('InlineForm', () => {
  it('moves focus back to the field when saving ends', () => {
    const { setSaving, field, outside } = renderForm()
    setSaving(true)
    outside().focus()

    setSaving(false)

    expect(field()).toHaveFocus()
  })

  it('does not take focus when it mounts', () => {
    const { field } = renderForm()

    expect(field()).not.toHaveFocus()
  })

  it('cancels the browser submit and reports it', () => {
    const { onSubmit, field } = renderForm()

    const notCancelled = fireEvent.submit(field().closest('form')!)

    expect(notCancelled).toBe(false)
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('reports focus leaving the form, not focus moving inside it', async () => {
    const { user, onOutside, field } = renderForm()
    await user.click(field())

    await user.tab()
    expect(onOutside).not.toHaveBeenCalled()
    await user.tab()

    expect(onOutside).toHaveBeenCalledOnce()
  })

  it('reports pointer presses outside the form until it unmounts', () => {
    const { onOutside, field, outside, unmount } = renderForm()

    fireEvent.pointerDown(field())
    fireEvent.pointerDown(outside())
    expect(onOutside).toHaveBeenCalledOnce()
    unmount()
    fireEvent.pointerDown(document.body)

    expect(onOutside).toHaveBeenCalledOnce()
  })
})
