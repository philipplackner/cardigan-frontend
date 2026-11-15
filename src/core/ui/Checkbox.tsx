import { Checkbox as CheckboxPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from './cn'
import { useFieldControl } from './FieldContext'
import { Icon } from './Icon'
import { CheckIcon } from './icons'

/** The visual box, shared by `Checkbox` and `Option`. */
export function CheckboxBox({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'group/box flex size-16 shrink-0 items-center justify-center rounded-4 border-[1.5px] border-border-strong bg-background-surface text-text-on-accent',
        'group-data-[state=checked]:border-accent group-data-[state=checked]:bg-accent',
        className,
      )}
    >
      <Icon
        icon={CheckIcon}
        size={12}
        className="hidden group-data-[state=checked]:block"
      />
    </span>
  )
}

type CheckboxProps = Omit<
  ComponentProps<typeof CheckboxPrimitive.Root>,
  'children' | 'asChild'
>

export function Checkbox({ className, ...props }: CheckboxProps) {
  const field = useFieldControl()
  return (
    <CheckboxPrimitive.Root
      id={field?.id}
      aria-describedby={field?.['aria-describedby']}
      className={cn(
        'group inline-flex shrink-0 rounded-4 outline-none focus-visible:shadow-focus-accent disabled:opacity-45',
        className,
      )}
      {...props}
    >
      <CheckboxBox />
    </CheckboxPrimitive.Root>
  )
}
