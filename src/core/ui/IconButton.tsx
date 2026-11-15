import { cva } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from './cn'
import { Icon, type IconComponent } from './Icon'

const iconButtonVariants = cva(
  'inline-flex shrink-0 items-center justify-center rounded-6 text-text-muted outline-none transition-colors enabled:hover:bg-background-hover focus-visible:shadow-focus-accent disabled:opacity-45',
  {
    variants: {
      variant: {
        ghost: '',
        boxed: 'border border-border-strong bg-background-surface shadow-small',
      },
      isSelected: {
        true: 'bg-background-hover text-text-primary',
        false: '',
      },
      size: {
        small: 'size-icon-button-small',
        medium: 'size-icon-button-medium',
        large: 'size-icon-button-large',
      },
    },
    defaultVariants: { variant: 'ghost', isSelected: false, size: 'medium' },
  },
)

type IconButtonProps = Omit<ComponentProps<'button'>, 'children'> & {
  icon: IconComponent
  /** Accessible name, announced by screen readers. Required because the button has no visible text. */
  label: string
  variant?: 'ghost' | 'boxed'
  isSelected?: boolean
  size?: 'small' | 'medium' | 'large'
}

export function IconButton({
  icon,
  label,
  variant,
  isSelected,
  size = 'medium',
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        iconButtonVariants({ variant, isSelected, size }),
        className,
      )}
      {...props}
    >
      <Icon icon={icon} size={size === 'large' ? 19 : 16} />
    </button>
  )
}
