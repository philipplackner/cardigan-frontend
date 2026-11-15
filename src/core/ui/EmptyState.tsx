import type { ReactNode } from 'react'
import { cn } from './cn'
import { Icon, type IconComponent } from './Icon'

type EmptyStateProps = {
  icon: IconComponent
  title: string
  description?: string
  /** Buttons below the text. */
  actions?: ReactNode
  type?: 'default' | 'error'
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  actions,
  type = 'default',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center gap-10 p-32 text-center',
        className,
      )}
    >
      <span className="flex size-[44px] items-center justify-center rounded-10 border border-border bg-background-surface shadow-small">
        <Icon
          icon={icon}
          size={20}
          className={type === 'error' ? 'text-danger' : 'text-text-muted'}
        />
      </span>
      <h2 className="pt-6 type-sans-15-semibold-130 text-text-primary">
        {title}
      </h2>
      {description && (
        <p className="type-sans-13.5-regular-145 text-text-muted">
          {description}
        </p>
      )}
      {actions && (
        <div className="flex flex-wrap items-center justify-center gap-8 pt-6">
          {actions}
        </div>
      )}
    </div>
  )
}
