import { cn } from './cn'
import { Icon } from './Icon'
import { CloseSmallIcon } from './icons'
import { LabelDot } from './LabelDot'
import type { LabelColor } from './labelColors'

type LabelChipProps = {
  name: string
  color: LabelColor
  className?: string
} & (
  | { onRemove?: never; removeLabel?: never }
  | {
      onRemove: () => void
      /** Accessible name of the remove button, for example "Remove api". */
      removeLabel: string
    }
)

export function LabelChip({
  name,
  color,
  onRemove,
  removeLabel,
  className,
}: LabelChipProps) {
  return (
    <span
      className={cn(
        'inline-flex min-w-[0] max-w-full items-center gap-5 rounded-full border border-border bg-background-surface py-4 pr-9 pl-8',
        className,
      )}
    >
      <LabelDot color={color} size="small" />
      <span className="truncate type-sans-12-medium-100 text-text-primary">
        {name}
      </span>
      {onRemove && (
        <button
          type="button"
          aria-label={removeLabel}
          onClick={onRemove}
          className="flex shrink-0 rounded-full text-text-muted outline-none hover:text-text-primary focus-visible:shadow-focus-accent"
        >
          <Icon icon={CloseSmallIcon} size={12} />
        </button>
      )}
    </span>
  )
}
