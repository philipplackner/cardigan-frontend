import { cva } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type { ComponentProps, MouseEvent } from 'react'
import { cn } from './cn'
import { Icon, type IconComponent } from './Icon'
import { Spinner } from './Spinner'

const buttonVariants = cva(
  'inline-flex max-w-full min-w-[0] items-center justify-center gap-7 rounded-6 whitespace-nowrap outline-none transition-colors focus-visible:shadow-focus-accent disabled:opacity-45',
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-text-on-accent not-disabled:not-aria-disabled:hover:bg-accent-hover',
        secondary:
          'border border-border-strong bg-background-surface text-text-primary shadow-small not-disabled:not-aria-disabled:hover:bg-background-hover',
        ghost:
          'text-text-muted not-disabled:not-aria-disabled:hover:bg-background-hover',
        danger: 'bg-danger text-text-on-danger',
        dangerGhost: 'text-danger',
      },
      size: {
        small:
          'min-h-control-sm px-10 type-sans-13-medium-100 phone:min-h-control-touch-sm phone:px-16 phone:type-sans-14-medium-100',
        medium:
          'min-h-control-md px-13 type-sans-13.5-medium-100 phone:min-h-control-touch phone:px-16 phone:type-sans-15-medium-100',
      },
    },
    defaultVariants: { variant: 'primary', size: 'medium' },
  },
)

type ButtonProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerGhost'
  size?: 'small' | 'medium'
  /** Leading icon. While loading, the spinner takes its place. */
  icon?: IconComponent
  /** Shows the spinner, reports the button as busy and ignores activation, including implicit form submission. */
  isLoading?: boolean
  /** Renders the child element (a link, say) with the button styling. */
  asChild?: boolean
}

export function Button({
  variant,
  size,
  icon,
  isLoading = false,
  asChild = false,
  className,
  children,
  onClick,
  type = 'button',
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot.Root : 'button'

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (isLoading) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  return (
    <Component
      type={asChild ? undefined : type}
      aria-busy={isLoading || undefined}
      aria-disabled={isLoading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <Spinner size="small" />
      ) : (
        icon && <Icon icon={icon} size={15} />
      )}
      <Slot.Slottable>
        {asChild ? children : <span className="truncate">{children}</span>}
      </Slot.Slottable>
    </Component>
  )
}
