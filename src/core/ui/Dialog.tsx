import { Dialog as DialogPrimitive } from 'radix-ui'
import type { ReactNode } from 'react'
import { cn } from './cn'
import { useReturnFocus } from './useReturnFocus'
import { Spinner } from './Spinner'

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  /**
   * `progress` shows a spinner instead of content and actions, and can't be closed by Escape or the scrim.
   * It closes only when the screen sets `open` to false.
   */
  type?: 'default' | 'progress'
  /** Content slot, for example fields. */
  children?: ReactNode
  /** Buttons, right-aligned. */
  actions?: ReactNode
  /**
   * With `false`, closing leaves focus alone instead of returning it to the control that opened the
   * dialog. Use it when the screen moves focus itself after the dialog closes.
   */
  returnFocus?: boolean
  className?: string
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  type = 'default',
  children,
  actions,
  returnFocus: shouldReturnFocus = true,
  className,
}: DialogProps) {
  const isProgress = type === 'progress'
  const returnFocus = useReturnFocus()
  const preventClose = (event: Event) => {
    if (isProgress) event.preventDefault()
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-[0] z-50 bg-background-scrim motion-safe:data-[state=open]:animate-fade-in motion-safe:data-[state=closed]:animate-fade-out" />
        <DialogPrimitive.Content
          aria-busy={isProgress || undefined}
          {...(description ? {} : { 'aria-describedby': undefined })}
          {...returnFocus}
          onCloseAutoFocus={(event) => {
            if (shouldReturnFocus) returnFocus.onCloseAutoFocus(event)
            else event.preventDefault()
          }}
          onEscapeKeyDown={preventClose}
          onPointerDownOutside={preventClose}
          onInteractOutside={preventClose}
          className={cn(
            'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[420px] max-w-[calc(100vw-32px)] -translate-1/2 flex-col gap-16 overflow-y-auto rounded-12 border border-border bg-background-surface shadow-popover outline-none',
            'motion-safe:data-[state=open]:animate-pop-in motion-safe:data-[state=closed]:animate-pop-out',
            isProgress
              ? 'items-center px-24 py-28 text-center'
              : 'p-20 phone:p-22',
            className,
          )}
        >
          <DialogPrimitive.Title className="w-full type-sans-16-semibold-130-ls-1 text-text-primary phone:type-sans-17-semibold-130-ls-1">
            {title}
          </DialogPrimitive.Title>
          {description && (
            <DialogPrimitive.Description className="w-full type-sans-13.5-regular-145 text-text-muted phone:type-sans-14.5-regular-145">
              {description}
            </DialogPrimitive.Description>
          )}
          {isProgress ? (
            <Spinner size="large" className="text-accent" />
          ) : (
            <>
              {children && (
                <div className="flex flex-col gap-16">{children}</div>
              )}
              {actions && (
                <div className="flex flex-wrap items-start justify-end gap-8">
                  {actions}
                </div>
              )}
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
