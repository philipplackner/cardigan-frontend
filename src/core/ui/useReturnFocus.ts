import { useRef } from 'react'

/**
 * Radix only returns focus to a `Dialog.Trigger`. Our dialogs are opened from any control (often a menu item),
 * so remember what had focus when the dialog opened and restore it on close.
 */
export function useReturnFocus() {
  const returnTo = useRef<HTMLElement | null>(null)
  return {
    onOpenAutoFocus: () => {
      returnTo.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
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
