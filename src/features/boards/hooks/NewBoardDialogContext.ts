import { createContext, useContext } from 'react'

type NewBoardDialogApi = {
  /** Opens the one New board dialog the app renders. */
  openNewBoardDialog: () => void
}

export const NewBoardDialogContext = createContext<NewBoardDialogApi | null>(
  null,
)

export function useNewBoardDialog() {
  const api = useContext(NewBoardDialogContext)
  if (!api) {
    throw new Error(
      'useNewBoardDialog must be used inside NewBoardDialogProvider',
    )
  }
  return api
}
