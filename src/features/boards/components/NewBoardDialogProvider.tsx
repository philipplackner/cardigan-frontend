import { useState, type ReactNode } from 'react'
import { NewBoardDialogContext } from '../hooks/NewBoardDialogContext'
import type { BoardSummary } from '../types'
import { NewBoardDialog } from './NewBoardDialog'

type NewBoardDialogProviderProps = {
  /** Called after a create succeeded and the dialog closed, to open the new board. */
  onBoardCreated: (board: BoardSummary) => void
  children: ReactNode
}

/**
 * Renders the one New board dialog and lets every entry point open it: the header, the empty state,
 * the phone + and the sidebar, on every page that shows the sidebar.
 */
export function NewBoardDialogProvider({
  onBoardCreated,
  children,
}: NewBoardDialogProviderProps) {
  const [dialog, setDialog] = useState({ isOpen: false, session: 0 })
  const openNewBoardDialog = () =>
    setDialog((current) =>
      current.isOpen ? current : { isOpen: true, session: current.session + 1 },
    )
  const close = () => setDialog((current) => ({ ...current, isOpen: false }))

  return (
    <NewBoardDialogContext value={{ openNewBoardDialog }}>
      {children}
      <NewBoardDialog
        // A new session starts with an empty form and the key prefill on.
        key={dialog.session}
        open={dialog.isOpen}
        onClose={close}
        onBoardCreated={onBoardCreated}
      />
    </NewBoardDialogContext>
  )
}
