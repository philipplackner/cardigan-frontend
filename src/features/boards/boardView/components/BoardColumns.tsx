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
    // The row carries the end padding itself, because a scroll container ignores its own padding at the inline end.
    <div className="flex w-max items-start gap-12 pr-20 phone:gap-10 phone:pr-12">
      {columns.map(renderColumn)}
      <div className="shrink-0 [&>button]:w-[220px]">{trailing}</div>
    </div>
  )
}
