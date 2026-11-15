import { cn } from './cn'
import { Icon } from './Icon'
import { FileIcon } from './icons'

type FileRowProps = {
  name: string
  /** Formatted size, for example "14 KB". */
  sizeText: string
  className?: string
}

export function FileRow({ name, sizeText, className }: FileRowProps) {
  return (
    <div
      className={cn(
        'flex w-full min-w-[0] items-center gap-10 rounded-8 border border-border px-12 py-10 text-text-primary',
        className,
      )}
    >
      <Icon icon={FileIcon} />
      <span className="min-w-[0] flex-1 truncate type-sans-13-regular-145">
        {name}
      </span>
      <span className="shrink-0 type-mono-12-regular-145 text-text-muted">
        {sizeText}
      </span>
    </div>
  )
}
