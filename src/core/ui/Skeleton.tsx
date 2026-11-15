import { cn } from './cn'

type SkeletonProps = {
  /** Size and shape come from the parent, for example `h-12 w-[120px]`. */
  className?: string
}

/** A loading placeholder. Hidden from assistive technology; the screen announces loading itself. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={cn('block h-12 w-full rounded-4 skeleton-shimmer', className)}
    />
  )
}
