import type { ComponentProps } from 'react'
import { cn } from './cn'
import { Icon } from './Icon'
import { AlertIcon } from './icons'

type ErrorMessageProps = ComponentProps<'p'>

export function ErrorMessage({
  className,
  children,
  ...props
}: ErrorMessageProps) {
  return (
    <p
      className={cn(
        'flex items-center gap-5 type-sans-12-regular-145 text-danger',
        className,
      )}
      {...props}
    >
      <Icon icon={AlertIcon} />
      <span className="min-w-[0]">{children}</span>
    </p>
  )
}
