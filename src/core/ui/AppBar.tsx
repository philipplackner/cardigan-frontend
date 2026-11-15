import type { ReactNode } from 'react'
import { Brand } from './Brand'
import { cn } from './cn'

type AppBarProps = {
  /** Icon buttons on the right. */
  actions?: ReactNode
  /** Border and shadow once content scrolls under the bar. */
  isRaised?: boolean
  className?: string
} & (
  | { type: 'brand'; brandName: string }
  | { type: 'title'; title: string; subtitle?: string; leading?: ReactNode }
  | { type: 'centered'; title: string; leading?: ReactNode }
)

export function AppBar(props: AppBarProps) {
  const { actions, isRaised = false, className } = props
  return (
    <header
      className={cn(
        'flex min-h-[56px] w-full min-w-[0] items-center gap-2 border-b bg-background-app py-6 pr-8 pl-10',
        isRaised ? 'border-border shadow-raised' : 'border-transparent',
        className,
      )}
    >
      {props.type === 'brand' ? (
        <>
          <Brand name={props.brandName} size="appBar" />
          <span className="flex-1" />
        </>
      ) : (
        <>
          {props.leading && (
            <div className="flex shrink-0 items-center">{props.leading}</div>
          )}
          {props.type === 'title' ? (
            <div className="flex min-w-[0] flex-1 flex-col gap-3 pl-2">
              <h1 className="truncate type-sans-16.5-semibold-115-ls-1 text-text-primary">
                {props.title}
              </h1>
              {props.subtitle && (
                <span className="truncate type-mono-11.5-regular-100 text-text-muted">
                  {props.subtitle}
                </span>
              )}
            </div>
          ) : (
            <h1 className="min-w-[0] flex-1 truncate text-center type-mono-13-medium-100 text-text-muted">
              {props.title}
            </h1>
          )}
        </>
      )}
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </header>
  )
}
