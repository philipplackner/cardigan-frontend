import type { ReactNode } from 'react'
import { cn } from './cn'
import { Key } from './Key'

type PageHeaderProps = {
  title: string
  keyValue?: string
  /** Count or other metadata after the title, for example "6 boards". */
  meta?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  keyValue,
  meta,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex min-h-[60px] w-full min-w-[0] items-center gap-10 border-b border-border bg-background-app px-20 py-12',
        className,
      )}
    >
      <h1 className="truncate type-sans-18-semibold-120-ls-1.5 text-text-primary">
        {title}
      </h1>
      {keyValue && <Key value={keyValue} />}
      {meta && (
        <span className="shrink-0 type-mono-12-regular-100 text-text-muted">
          {meta}
        </span>
      )}
      <span className="flex-1" />
      {actions && (
        <div className="flex shrink-0 items-center gap-10">{actions}</div>
      )}
    </header>
  )
}
