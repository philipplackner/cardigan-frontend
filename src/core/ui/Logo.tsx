import { cn } from './cn'

type LogoProps = {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-22 shrink-0 items-start gap-2 rounded-6 bg-text-primary p-4',
        className,
      )}
    >
      <span className="h-14 w-3 rounded-1 bg-background-app" />
      <span className="h-9 w-3 rounded-1 bg-background-app" />
      <span className="h-11 w-3 rounded-1 bg-background-app" />
    </span>
  )
}
