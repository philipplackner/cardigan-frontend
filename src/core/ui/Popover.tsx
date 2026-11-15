import { Popover as PopoverPrimitive } from 'radix-ui'
import type { ReactNode } from 'react'
import { cn } from './cn'

type PopoverProps = {
  /** The element that opens the popover, for example a `FilterButton`. */
  trigger: ReactNode
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  align?: 'start' | 'center' | 'end'
  /** Accessible name of the popover content. */
  label?: string
  className?: string
}

export function Popover({
  trigger,
  children,
  open,
  onOpenChange,
  align = 'end',
  label,
  className,
}: PopoverProps) {
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          sideOffset={6}
          collisionPadding={8}
          aria-label={label}
          className={cn(
            'z-50 flex w-[280px] max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-10 border border-border bg-background-surface shadow-popover outline-none',
            'motion-safe:data-[state=open]:animate-pop-in motion-safe:data-[state=closed]:animate-pop-out',
            className,
          )}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
