import { useRef } from 'react'

function focusTarget(active: Element | null) {
  if (!(active instanceof HTMLElement)) return null
  // A menu item unmounts when its menu closes, so return to the button that opened the menu instead.
  const triggerId = active
    .closest('[role="menu"]')
    ?.getAttribute('aria-labelledby')
  const trigger = triggerId ? document.getElementById(triggerId) : null
  return trigger ?? active
}

/**
 * Radix only returns focus to a `Dialog.Trigger`. Our dialogs are opened from any control (often a menu item),
 * so remember what had focus when the dialog opened and restore it on close.
 */
export function useReturnFocus() {
  const returnTo = useRef<HTMLElement | null>(null)
  return {
    onOpenAutoFocus: () => {
      returnTo.current = focusTarget(document.activeElement)
    },
    onCloseAutoFocus: (event: Event) => {
      const target = returnTo.current
      returnTo.current = null
      if (target?.isConnected) {
        event.preventDefault()
        target.focus()
      }
    },
  }
}
