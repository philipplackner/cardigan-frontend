import { createContext, useContext } from 'react'
import type { BoardViewDataAccess } from '../types'

export const BoardViewDataAccessContext =
  createContext<BoardViewDataAccess | null>(null)

export function useBoardViewDataAccess() {
  const dataAccess = useContext(BoardViewDataAccessContext)
  if (!dataAccess) {
    throw new Error(
      'useBoardViewDataAccess must be used inside BoardViewDataAccessProvider',
    )
  }
  return dataAccess
}
