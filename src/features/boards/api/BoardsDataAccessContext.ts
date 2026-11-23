import { createContext, useContext } from 'react'
import type { BoardsDataAccess } from '../types'

export const BoardsDataAccessContext = createContext<BoardsDataAccess | null>(
  null,
)

export function useBoardsDataAccess() {
  const dataAccess = useContext(BoardsDataAccessContext)
  if (!dataAccess) {
    throw new Error(
      'useBoardsDataAccess must be used inside BoardsDataAccessProvider',
    )
  }
  return dataAccess
}
