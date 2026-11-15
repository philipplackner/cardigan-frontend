import { Dialog as DialogPrimitive } from 'radix-ui'
import type { ReactNode } from 'react'
import { cn } from './cn'
import { useReturnFocus } from './useReturnFocus'

type BottomSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Accessible name. The sheet has no visible title in Figma. */
  title: string
  children: ReactNode
  className?: string
}

/** Phone only. Closes on scrim tap, Escape or a close action in its content. The handle is decorative; there is no drag. */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
  className,
}: BottomSheetProps) {
  const returnFocus = useReturnFocus()
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-[0] z-50 bg-background-scrim motion-safe:data-[state=open]:animate-fade-in motion-safe:data-[state=closed]:animate-fade-out" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          {...returnFocus}
          className={cn(
            'fixed inset-x-[0] bottom-[0] z-50 flex max-h-[calc(100dvh-32px)] flex-col gap-12 overflow-y-auto rounded-t-16 border-t border-border bg-background-surface px-16 pt-8 pb-16 shadow-popover outline-none',
            'motion-safe:data-[state=open]:animate-sheet-in motion-safe:data-[state=closed]:animate-sheet-out',
            className,
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            {title}
          </DialogPrimitive.Title>
          <div aria-hidden className="flex justify-center pb-4">
            <span className="h-4 w-[36px] rounded-2 bg-border-strong" />
          </div>
          <div className="flex flex-col gap-12">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
