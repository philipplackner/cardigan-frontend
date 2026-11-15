import { cn } from './cn'

type KeyProps = {
  /** The board key, for example "CRD". */
  value: string
  className?: string
}

export function Key({ value, className }: KeyProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-4 border border-border-strong bg-background-surface px-5 py-3 type-mono-11-medium-100-ls2 text-text-muted',
        className,
      )}
    >
      {value}
    </span>
  )
}
