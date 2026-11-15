import type { ComponentProps } from 'react'
import { cn } from './cn'
import { Label } from './Label'
import type { LabelColor } from './labelColors'

type CardProps = Omit<ComponentProps<'button'>, 'children' | 'id'> & {
  /** Display ID, for example "CRD-101". */
  displayId: string
  title: string
  labels?: { name: string; color: LabelColor }[]
  /** The card open in the detail panel. */
  isSelected?: boolean
  /** The card following the pointer while dragged. */
  isDragging?: boolean
  /** The gap where the dragged card will land. Its content is invisible but keeps the size. */
  isPlaceholder?: boolean
}

export function Card({
  displayId,
  title,
  labels = [],
  isSelected = false,
  isDragging = false,
  isPlaceholder = false,
  className,
  type = 'button',
  ...props
}: CardProps) {
  return (
    <button
      type={type}
      aria-current={isSelected || undefined}
      className={cn(
        'flex w-full min-w-[0] flex-col items-start gap-7 rounded-8 border px-12 pt-10 pb-11 text-left outline-none phone:px-14 phone:py-12',
        isPlaceholder
          ? 'border-[1.5px] border-dashed border-border-strong'
          : 'border-border bg-background-surface shadow-small focus-visible:shadow-focus-accent',
        isSelected && 'border-accent shadow-focus-accent',
        isDragging && 'rotate-[2.2deg] border-accent shadow-drag',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'flex w-full min-w-[0] flex-col gap-7',
          isPlaceholder && 'invisible',
        )}
      >
        <span className="type-mono-11-medium-100 text-text-muted">
          {displayId}
        </span>
        <span className="type-card-title text-text-primary">{title}</span>
        {labels.length > 0 && (
          <span className="flex flex-wrap gap-x-10 gap-y-4">
            {labels.map((label) => (
              <Label
                key={label.name}
                name={label.name}
                color={label.color}
                size="small"
              />
            ))}
          </span>
        )}
      </span>
    </button>
  )
}
