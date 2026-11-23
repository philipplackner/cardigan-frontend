import { Skeleton } from '@/core/ui'

/** Card placeholders per column, as in the Figma loading frames. */
const CARDS_PER_COLUMN = [4, 3, 2, 3]

export function BoardSkeleton() {
  return CARDS_PER_COLUMN.map((cards, column) => (
    <div
      key={column}
      aria-hidden
      className="flex w-[276px] shrink-0 flex-col gap-8 rounded-10 border border-border bg-background-column p-9 phone:w-[300px]"
    >
      <div className="flex min-h-[30px] items-center py-2 pr-2 pl-6">
        <Skeleton className="h-12 w-[80px]" />
      </div>
      {Array.from({ length: cards }, (_, card) => (
        <div
          key={card}
          className="flex flex-col gap-7 rounded-8 border border-border bg-background-surface px-13 pt-11 pb-12 shadow-small"
        >
          <Skeleton className="h-9 w-[48px]" />
          <Skeleton className="h-12 w-[82%]" />
          <Skeleton className="h-12 w-[54%]" />
        </div>
      ))}
    </div>
  ))
}
