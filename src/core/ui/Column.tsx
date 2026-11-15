import { useId, type ReactNode } from 'react'
import { cn } from './cn'

type ColumnProps = {
  name: string
  count: number | string
  /** Column menu trigger, usually a small `IconButton` inside a `Menu`. */
  menu?: ReactNode
  /** The column's cards. */
  children?: ReactNode
  /** Usually an `AddCardButton`. */
  footer?: ReactNode
  className?: string
}

export function Column({
  name,
  count,
  menu,
  children,
  footer,
  className,
}: ColumnProps) {
  const headingId = useId()
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        'flex w-[276px] shrink-0 flex-col gap-8 rounded-10 border border-border bg-background-column p-8 phone:w-[300px]',
        className,
      )}
    >
      <div className="flex min-h-[32px] min-w-[0] items-center gap-8 py-2 pr-2 pl-6">
        <h2
          id={headingId}
          className="truncate type-sans-13.5-semibold-100 text-text-primary"
        >
          {name}
        </h2>
        <span className="shrink-0 type-mono-11.5-regular-100 text-text-muted">
          {count}
        </span>
        <span className="flex-1" />
        {menu}
      </div>
      {children && <div className="flex flex-col gap-8">{children}</div>}
      {footer}
    </section>
  )
}
