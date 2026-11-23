import type { ReactNode } from 'react'
import type { BoardsDataAccess } from '../types'
import { BoardsDataAccessContext } from './BoardsDataAccessContext'

type BoardsDataAccessProviderProps = {
  dataAccess: BoardsDataAccess
  children: ReactNode
}

/** Gives the board hooks their data access. The app layer provides the real one. */
export function BoardsDataAccessProvider({
  dataAccess,
  children,
}: BoardsDataAccessProviderProps) {
  return (
    <BoardsDataAccessContext value={dataAccess}>
      {children}
    </BoardsDataAccessContext>
  )
}
