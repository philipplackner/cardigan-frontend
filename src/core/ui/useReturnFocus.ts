import { useRef } from 'react'

/**
 * Return targets of dialogs that haven't finished closing, oldest first. When one dialog replaces another
 * in the same step, the new one opens before the old one restores focus, so it inherits the old target.
 */
const pendingTargets = new Map<EventTarget, HTMLElement | null>()

function inheritedTarget(dialog: EventTarget | null) {
  let target: HTMLElement | null | undefined
  for (const [other, otherTarget] of pendingTargets) {
    if (other !== dialog) target = otherTarget
  }
  return target
}

function focusTarget(dialog: EventTarget | null) {
  const active = document.activeElement
  const isInOtherDialog =
    active instanceof HTMLElement && active.closest('[role="dialog"]') !== null
  if (
    !(active instanceof HTMLElement) ||
    active === document.body ||
    isInOtherDialog
  ) {
    const inherited = inheritedTarget(dialog)
    if (inherited !== undefined) return inherited
  }
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
    onOpenAutoFocus: (event: Event) => {
      returnTo.current = focusTarget(event.target)
      if (event.target) pendingTargets.set(event.target, returnTo.current)
    },
    onCloseAutoFocus: (event: Event) => {
      const target = returnTo.current
      returnTo.current = null
      if (event.target) pendingTargets.delete(event.target)
      if (target?.isConnected) {
        event.preventDefault()
        target.focus()
      }
    },
  }
}
