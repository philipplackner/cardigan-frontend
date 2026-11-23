import type { ReactNode } from 'react'
import type { BoardColumn } from '../types'

type BoardColumnsProps = {
  /** The columns to show. Search & filter can pass a filtered list. */
  columns: readonly BoardColumn[]
  renderColumn: (column: BoardColumn) => ReactNode
  /** After the last column: the Add column button or form. */
  trailing: ReactNode
}

/** The column row. It scrolls sideways when wider than the content area, without snapping (D24). */
export function BoardColumns({
  columns,
  renderColumn,
  trailing,
}: BoardColumnsProps) {
  return (
    <div className="flex items-start gap-12 phone:gap-10">
      {columns.map(renderColumn)}
      <div className="w-[220px] shrink-0">{trailing}</div>
    </div>
  )
}
