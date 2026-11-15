import { cva } from 'class-variance-authority'
import { cn } from './cn'
import { LabelDot } from './LabelDot'
import type { LabelColor } from './labelColors'

const nameVariants = cva('truncate', {
  variants: {
    size: {
      small: 'type-sans-12-medium-100 text-text-muted',
      medium: 'type-sans-13.5-medium-100 text-text-primary',
      large: 'type-sans-15-medium-100 text-text-primary',
    },
  },
})

type LabelProps = {
  name: string
  color: LabelColor
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export function Label({ name, color, size = 'medium', className }: LabelProps) {
  return (
    <span
      className={cn(
        'inline-flex min-w-[0] max-w-full items-center gap-5',
        className,
      )}
    >
      <LabelDot color={color} size={size === 'small' ? 'small' : 'medium'} />
      <span className={nameVariants({ size })}>{name}</span>
    </span>
  )
}
