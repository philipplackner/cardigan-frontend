import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useReturnFocus } from './useReturnFocus'

afterEach(() => {
  document.body.replaceChildren()
})

function addButton(name: string, parent: HTMLElement = document.body) {
  const button = document.createElement('button')
  button.textContent = name
  parent.append(button)
  return button
}

function addDialog() {
  const dialog = document.createElement('div')
  dialog.setAttribute('role', 'dialog')
  document.body.append(dialog)
  return dialog
}

// Radix calls these handlers with an event dispatched on the dialog content.
function dispatchOn(target: Element, handler: (event: Event) => void) {
  const event = new Event('focusScope.autoFocus', { cancelable: true })
  target.addEventListener('focusScope.autoFocus', handler, { once: true })
  target.dispatchEvent(event)
  return event
}

function openDialog() {
  const { result } = renderHook(() => useReturnFocus())
  const dialog = addDialog()
  dispatchOn(dialog, result.current.onOpenAutoFocus)
  const inside = addButton('Inside', dialog)
  inside.focus()
  return {
    dialog,
    inside,
    close: () => dispatchOn(dialog, result.current.onCloseAutoFocus),
  }
}

describe('useReturnFocus', () => {
  it('returns focus to the control focused on open and replaces the default focus', () => {
    const trigger = addButton('Rename')
    trigger.focus()
    const { close } = openDialog()

    const event = close()

    expect(trigger).toHaveFocus()
    expect(event.defaultPrevented).toBe(true)
  })

  it('returns focus to a control inside a dialog that does not track focus itself', () => {
    const sheet = addDialog()
    const control = addButton('Sheet action', sheet)
    control.focus()
    const { close } = openDialog()

    close()

    expect(control).toHaveFocus()
  })

  it('does not hand the target of a closed dialog to a later dialog', () => {
    const trigger = addButton('Rename')
    trigger.focus()
    openDialog().close()
    const control = addButton('Sheet action', addDialog())
    control.focus()

    openDialog().close()

    expect(control).toHaveFocus()
  })

  it('leaves the default focus alone when the target is gone', () => {
    const trigger = addButton('Rename')
    trigger.focus()
    const { close } = openDialog()
    trigger.remove()

    expect(close().defaultPrevented).toBe(false)
  })
  it('hands the original target on when a dialog opens from inside one that is still closing', () => {
    const trigger = addButton('Start')
    trigger.focus()
    const first = openDialog()
    const second = openDialog()
    first.dialog.remove()
    first.close()
    second.inside.focus()

    second.close()

    expect(trigger).toHaveFocus()
  })

  it('returns to a plain control even while another dialog is still closing', () => {
    const trigger = addButton('Start')
    trigger.focus()
    const first = openDialog()
    const other = addButton('Other')
    other.focus()
    const second = openDialog()
    first.dialog.remove()
    first.close()
    second.inside.focus()

    second.close()

    expect(other).toHaveFocus()
  })

  it('hands the original target on when focus is on a non-HTML element', () => {
    const trigger = addButton('Start')
    trigger.focus()
    const first = openDialog()
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    icon.setAttribute('tabindex', '0')
    document.body.append(icon)
    icon.focus()
    const second = openDialog()
    first.dialog.remove()
    first.close()
    second.inside.focus()

    second.close()

    expect(trigger).toHaveFocus()
  })

  it('leaves the default focus alone when a non-HTML element had focus', () => {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    icon.setAttribute('tabindex', '0')
    document.body.append(icon)
    icon.focus()
    const { close } = openDialog()

    expect(close().defaultPrevented).toBe(false)
  })
})
