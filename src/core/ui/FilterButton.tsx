import { cva } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from './cn'
import { Icon, type IconComponent } from './Icon'
import { ChevronDownIcon } from './icons'

const filterButtonVariants = cva(
  'inline-flex max-w-full min-w-[0] min-h-control-md items-center gap-7 rounded-6 border px-11 type-sans-13.5-regular-145 whitespace-nowrap text-text-primary shadow-small outline-none transition-colors focus-visible:shadow-focus-accent disabled:opacity-45',
  {
    variants: {
      isActive: {
        false:
          'border-border-strong bg-background-surface enabled:hover:bg-background-hover',
        true: 'border-accent bg-accent-soft',
      },
    },
  },
)

type FilterButtonProps = Omit<ComponentProps<'button'>, 'children'> & {
  label: string
  icon: IconComponent
  isActive?: boolean
}

export function FilterButton({
  label,
  icon,
  isActive = false,
  className,
  type = 'button',
  ...props
}: FilterButtonProps) {
  return (
    <button
      type={type}
      className={cn(filterButtonVariants({ isActive }), className)}
      {...props}
    >
      <Icon icon={icon} className="text-text-muted" />
      <span className="truncate">{label}</span>
      <Icon icon={ChevronDownIcon} className="text-text-muted" />
    </button>
  )
}
