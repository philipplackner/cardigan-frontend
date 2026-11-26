import { cn } from './cn'
import { LABEL_BG_CLASSES, type LabelColor } from './labelColors'

type LabelDotProps = {
  color: LabelColor
  size?: 'small' | 'medium'
  className?: string
}

export function LabelDot({ color, size, className }: LabelDotProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'shrink-0 rounded-full',
        size === 'small' ? 'size-7' : 'size-10',
        LABEL_BG_CLASSES[color],
        className,
      )}
    />
  )
}
