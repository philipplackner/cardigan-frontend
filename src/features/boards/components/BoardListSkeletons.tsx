import { Skeleton } from '@/core/ui'

const TILE_COUNT = 6
const ROW_COUNT = 5

export function BoardTileSkeletons() {
  return Array.from({ length: TILE_COUNT }, (_, index) => (
    <div
      key={index}
      aria-hidden
      className="flex h-[103px] flex-col gap-10 rounded-8 border border-border bg-background-surface px-15 pt-15 pb-13 shadow-small"
    >
      <Skeleton className="h-[18px] w-[42px]" />
      <Skeleton className="h-16 w-[172px] max-w-full" />
      <div className="flex justify-between border-t border-border pt-11">
        <Skeleton className="h-10 w-[60px]" />
        <Skeleton className="h-10 w-[90px]" />
      </div>
    </div>
  ))
}

export function BoardRowSkeletons() {
  return Array.from({ length: ROW_COUNT }, (_, index) => (
    <li
      key={index}
      aria-hidden
      className="flex flex-col gap-6 border-b border-border pt-12 pr-6 pb-13 pl-14 last:border-b-0 last:pb-12"
    >
      <Skeleton className="h-14 w-[202px] max-w-full" />
      <Skeleton className="h-10 w-[134px]" />
    </li>
  ))
}
