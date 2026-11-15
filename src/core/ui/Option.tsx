import { Checkbox as CheckboxPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { CheckboxBox } from './Checkbox'
import { cn } from './cn'

type OptionProps = Omit<
  ComponentProps<typeof CheckboxPrimitive.Root>,
  'asChild'
>

/** A checkable row. The whole row is the checkbox; hover and keyboard focus show the Highlighted state. */
export function Option({ className, children, ...props }: OptionProps) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'group flex w-full min-w-[0] items-center gap-10 rounded-5 p-8 text-left outline-none hover:bg-background-hover focus-visible:bg-background-hover disabled:opacity-45 phone:px-6 phone:py-12',
        className,
      )}
      {...props}
    >
      <CheckboxBox />
      <span className="flex min-w-[0] flex-1 items-center">{children}</span>
    </CheckboxPrimitive.Root>
  )
}
