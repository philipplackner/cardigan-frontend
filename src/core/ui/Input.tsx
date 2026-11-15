import type { ComponentProps, ReactNode } from 'react'
import { cn } from './cn'
import { useFieldControl } from './FieldContext'
import { Icon, type IconComponent } from './Icon'

type InputProps = ComponentProps<'input'> & {
  isInvalid?: boolean
  leadingIcon?: IconComponent
  /** Slot after the text, such as a clear button. */
  trailing?: ReactNode
}

export function Input({
  isInvalid,
  leadingIcon,
  trailing,
  className,
  readOnly,
  disabled,
  ref,
  ...props
}: InputProps) {
  const field = useFieldControl()
  const invalid = isInvalid ?? field?.['aria-invalid'] === true

  return (
    <div
      className={cn(
        'flex min-h-input w-full min-w-[0] items-center gap-8 rounded-6 border px-10 type-sans-13.5-regular-145 transition-shadow phone:min-h-control-touch phone:type-sans-15-regular-145',
        readOnly
          ? 'bg-background-column text-text-muted'
          : 'bg-background-surface text-text-primary',
        invalid
          ? 'border-danger shadow-focus-danger'
          : 'border-border-strong focus-within:border-accent focus-within:shadow-focus-accent',
        disabled && 'opacity-55',
        className,
      )}
    >
      {leadingIcon && <Icon icon={leadingIcon} className="text-text-muted" />}
      <input
        ref={ref}
        id={field?.id}
        aria-describedby={field?.['aria-describedby']}
        aria-invalid={invalid || undefined}
        readOnly={readOnly}
        disabled={disabled}
        className="min-w-[0] flex-1 self-stretch bg-transparent caret-accent outline-none placeholder:text-text-faint disabled:cursor-not-allowed"
        {...props}
      />
      {trailing}
    </div>
  )
}
