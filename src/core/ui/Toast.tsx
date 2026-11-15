import { Toast as ToastPrimitive } from 'radix-ui'
import { useState, type ReactNode } from 'react'
import { cn } from './cn'
import { Icon } from './Icon'
import { CloseIcon } from './icons'
import { ToastContext, type ToastApi, type ToastOptions } from './ToastContext'

const SUCCESS_DURATION_MS = 4000

type ToastProviderProps = {
  /** Accessible name of every toast's close button, for example "Close". */
  closeLabel: string
  /** Accessible name of the toast region, for example "Notifications ({hotkey})". */
  regionLabel?: string
  children: ReactNode
}

export function ToastProvider({
  closeLabel,
  regionLabel,
  children,
}: ToastProviderProps) {
  const [current, setCurrent] = useState<
    (ToastOptions & { key: number }) | null
  >(null)
  const [open, setOpen] = useState(false)

  const api: ToastApi = {
    show: (toast) => {
      setCurrent((previous) => ({ ...toast, key: (previous?.key ?? 0) + 1 }))
      setOpen(true)
    },
  }

  return (
    <ToastContext value={api}>
      <ToastPrimitive.Provider swipeDirection="right" label={regionLabel}>
        {children}
        {current && (
          <ToastPrimitive.Root
            key={current.key}
            open={open}
            onOpenChange={setOpen}
            type={current.type === 'error' ? 'foreground' : 'background'}
            duration={
              current.type === 'success' ? SUCCESS_DURATION_MS : Infinity
            }
            className={cn(
              'pointer-events-auto flex items-center gap-12 rounded-8 bg-background-toast py-10 pr-10 pl-14 text-text-toast shadow-popover phone:w-full',
              'data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[swipe=cancel]:translate-x-[0] data-[swipe=cancel]:transition-transform',
              'motion-safe:data-[state=open]:animate-rise-in motion-safe:data-[state=closed]:animate-sink-out motion-safe:data-[swipe=end]:animate-swipe-out',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'size-8 shrink-0 rounded-full',
                current.type === 'success' ? 'bg-success' : 'bg-danger',
              )}
            />
            <ToastPrimitive.Description className="min-w-[0] flex-1 type-sans-13.5-regular-145">
              {current.message}
            </ToastPrimitive.Description>
            <ToastPrimitive.Close
              aria-label={closeLabel}
              className="flex shrink-0 rounded-4 opacity-70 outline-none focus-visible:shadow-focus-accent"
            >
              <Icon icon={CloseIcon} />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        )}
        <ToastPrimitive.Viewport className="pointer-events-none fixed inset-x-[0] bottom-24 z-50 flex justify-center outline-none phone:bottom-28 phone:px-16" />
      </ToastPrimitive.Provider>
    </ToastContext>
  )
}
