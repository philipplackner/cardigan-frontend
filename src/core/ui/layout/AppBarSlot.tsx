import { createContext, useContext, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type AppBarSlotContextValue = {
  target: HTMLElement | null
  setTarget: (element: HTMLElement | null) => void
}

const AppBarSlotContext = createContext<AppBarSlotContextValue | null>(null)

function useAppBarSlotContext() {
  const value = useContext(AppBarSlotContext)
  if (!value) {
    throw new Error('AppBarSlot parts must be used inside AppBarSlotProvider')
  }
  return value
}

/** Connects the page's `AppBarSlot` to the shell's `AppBarSlotTarget`. Wrap the layout with it. */
export function AppBarSlotProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  return (
    <AppBarSlotContext value={{ target, setTarget }}>
      {children}
    </AppBarSlotContext>
  )
}

/** Where the current page's bar appears. Takes no space while no page provides a bar. */
export function AppBarSlotTarget() {
  const { setTarget } = useAppBarSlotContext()
  return <div ref={setTarget} />
}

/** Renders its children, usually an `AppBar`, in the shell's top bar instead of in place. */
export function AppBarSlot({ children }: { children: ReactNode }) {
  const { target } = useAppBarSlotContext()
  return target ? createPortal(children, target) : null
}
