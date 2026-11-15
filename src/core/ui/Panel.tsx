import { useId, type ReactNode } from 'react'
import { cn } from './cn'
import { IconButton } from './IconButton'
import { CloseIcon } from './icons'

type PanelProps = {
  /** Display ID of the card, for example "CRD-109". */
  cardId: string
  /** Where the card is, for example "in In progress". */
  context?: string
  closeLabel: string
  onClose: () => void
  /** Body slot. Scrolls when it's taller than the panel. */
  children: ReactNode
  /** Footer slot, for example delete and save buttons. */
  footer?: ReactNode
  className?: string
}

/** The card detail panel. `AppLayout` places it beside the content, or full screen on phones. */
export function Panel({
  cardId,
  context,
  closeLabel,
  onClose,
  children,
  footer,
  className,
}: PanelProps) {
  const headingId = useId()
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        'flex h-full w-full min-w-[0] flex-col border-l border-border bg-background-surface shadow-panel phone:border-l-0',
        className,
      )}
    >
      <header className="flex min-w-[0] items-center gap-6 border-b border-border py-12 pr-12 pl-20">
        <h2
          id={headingId}
          className="shrink-0 type-mono-12.5-regular-145 text-text-muted"
        >
          {cardId}
        </h2>
        {context && (
          <span className="truncate type-sans-12.5-regular-145 text-text-muted">
            {context}
          </span>
        )}
        <span className="flex-1" />
        <IconButton icon={CloseIcon} label={closeLabel} onClick={onClose} />
      </header>
      <div className="flex min-h-[0] flex-1 flex-col gap-20 overflow-y-auto p-20">
        {children}
      </div>
      {footer && (
        <footer className="flex items-center gap-8 py-12 pr-16 pl-12">
          {footer}
        </footer>
      )}
    </section>
  )
}
