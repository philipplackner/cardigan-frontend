import type { ReactElement } from 'react'
import { BoardIcon, NavItem } from '@/core/ui'
import { useBoards } from '../api/boardsQueries'

type BoardsNavListProps = {
  /** The open board, marked current. */
  currentBoardId?: string
  renderBoardLink: (boardId: string) => ReactElement
}

/** The sidebar's board rows in list order. None while loading or after a load error. */
export function BoardsNavList({
  currentBoardId,
  renderBoardLink,
}: BoardsNavListProps) {
  const { data: boards } = useBoards()
  if (!boards || boards.length === 0) return null
  return boards.map((board) => (
    <NavItem
      key={board.id}
      label={board.name}
      keyValue={board.key}
      icon={BoardIcon}
      isSelected={board.id === currentBoardId}
      asChild
    >
      {renderBoardLink(board.id)}
    </NavItem>
  ))
}
