import type { ComponentProps } from 'react'
import { cn } from './cn'
import { Icon } from './Icon'
import { PlusIcon } from './icons'

type AddCardButtonProps = Omit<ComponentProps<'button'>, 'children'> & {
  label: string
}

export function AddCardButton({
  label,
  className,
  type = 'button',
  ...props
}: AddCardButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'flex w-full min-w-[0] items-center gap-7 rounded-6 px-6 py-7 type-sans-13-regular-145 text-text-muted outline-none enabled:hover:bg-background-hover focus-visible:shadow-focus-accent phone:py-10 phone:type-sans-14-regular-145',
        className,
      )}
      {...props}
    >
      <Icon icon={PlusIcon} />
      <span className="truncate">{label}</span>
    </button>
  )
}
