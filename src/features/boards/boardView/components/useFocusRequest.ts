import { useEffect, useRef } from 'react'
import type { FocusTarget } from '../hooks/boardViewReducer'

function selectorFor(target: FocusTarget) {
  switch (target.kind) {
    case 'quickAdd':
      return '[data-inline-form="quickAdd"] [data-inline-field]'
    case 'addColumn':
      return '[data-inline-form="addColumn"] [data-inline-field]'
    case 'addCard':
      return `[data-add-card="${target.columnId}"]`
    case 'columnMenu':
      return `[data-column-menu="${target.columnId}"]`
    case 'addColumnButton':
      return '[data-add-column]'
  }
}

/** Moves focus as the view model asks, scrolling inline forms and new columns into view. */
export function useFocusRequest(
  request: { target: FocusTarget; id: number } | null,
) {
  const handledId = useRef<number | null>(null)
  // Runs after every render: the target may still be disabled while its save finishes.
  useEffect(() => {
    if (!request || request.id === handledId.current) return
    const { target } = request
    const element = document.querySelector<HTMLElement>(selectorFor(target))
    if (!element || element.matches(':disabled')) return
    handledId.current = request.id
    if (target.kind === 'quickAdd' || target.kind === 'addColumn') {
      element.closest('form')?.scrollIntoView?.({
        block: 'nearest',
        inline: 'nearest',
      })
    } else if (target.kind === 'addCard' && target.scroll) {
      element
        .closest('[data-column-id]')
        ?.scrollIntoView?.({ inline: 'nearest' })
    }
    element.focus()
  })
}
