import type { ReactNode } from 'react'
import type { BoardViewDataAccess } from '../types'
import { BoardViewDataAccessContext } from './BoardViewDataAccessContext'

type BoardViewDataAccessProviderProps = {
  dataAccess: BoardViewDataAccess
  children: ReactNode
}

/** Gives the board view its data access. The app layer provides the real one. */
export function BoardViewDataAccessProvider({
  dataAccess,
  children,
}: BoardViewDataAccessProviderProps) {
  return (
    <BoardViewDataAccessContext value={dataAccess}>
      {children}
    </BoardViewDataAccessContext>
  )
}
