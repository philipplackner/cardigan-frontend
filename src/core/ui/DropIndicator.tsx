import { cn } from './cn'

/** Shows where a dragged card will land. */
export function DropIndicator({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('relative block h-3 w-full rounded-2 bg-accent', className)}
    >
      <span className="absolute -top-3 -left-4 size-9 rounded-full bg-accent" />
    </span>
  )
}
