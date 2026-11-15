import type { ComponentProps } from 'react'
import { cn } from './cn'
import { Icon } from './Icon'
import { PlusIcon } from './icons'

type AddColumnButtonProps = Omit<ComponentProps<'button'>, 'children'> & {
  label: string
}

export function AddColumnButton({
  label,
  className,
  type = 'button',
  ...props
}: AddColumnButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'flex w-full min-w-[0] items-center gap-7 rounded-10 border border-dashed border-border-strong px-12 py-11 type-sans-13-regular-145 text-text-muted outline-none enabled:hover:bg-background-hover focus-visible:shadow-focus-accent',
        className,
      )}
      {...props}
    >
      <Icon icon={PlusIcon} />
      <span className="truncate">{label}</span>
    </button>
  )
}
