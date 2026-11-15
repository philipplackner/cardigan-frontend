import type { ComponentProps } from 'react'
import { cn } from './cn'
import { Icon } from './Icon'
import { AlertIcon, InfoIcon } from './icons'

type BannerProps = ComponentProps<'div'> & {
  type: 'error' | 'info'
}

export function Banner({ type, className, children, ...props }: BannerProps) {
  return (
    <div
      className={cn(
        'flex w-full items-start gap-9 rounded-8 border px-12 py-10 type-sans-13-regular-145 text-text-primary',
        type === 'error'
          ? 'border-border-danger-subtle bg-danger-soft'
          : 'border-border-accent-subtle bg-accent-soft',
        className,
      )}
      {...props}
    >
      <Icon
        icon={type === 'error' ? AlertIcon : InfoIcon}
        className={type === 'error' ? 'text-danger' : 'text-accent'}
      />
      <div className="min-w-[0] flex-1">{children}</div>
    </div>
  )
}
