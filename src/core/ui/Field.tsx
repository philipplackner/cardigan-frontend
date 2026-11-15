import { useId, type ReactNode } from 'react'
import { cn } from './cn'
import { ErrorMessage } from './ErrorMessage'
import { FieldContext } from './FieldContext'

type FieldProps = {
  label: string
  /** Hides the label visually. It stays the control's accessible name. */
  isLabelHidden?: boolean
  /** Help content below the control, such as password rules. Linked to the control with `aria-describedby`. */
  description?: ReactNode
  /** Shown below the control with `ErrorMessage`. Puts the control in its error state. */
  error?: string
  /** The control: `Input`, `TextArea` or another control that reads `useFieldControl()`. */
  children: ReactNode
  className?: string
}

export function Field({
  label,
  isLabelHidden = false,
  description,
  error,
  children,
  className,
}: FieldProps) {
  const id = useId()
  const descriptionId = `${id}-description`
  const errorId = `${id}-error`
  const describedBy =
    [error ? errorId : null, description ? descriptionId : null]
      .filter(Boolean)
      .join(' ') || undefined

  return (
    <div className={cn('flex w-full min-w-[0] flex-col gap-6', className)}>
      <label
        htmlFor={id}
        className={cn(
          'truncate type-sans-12.5-medium-100 text-text-primary phone:type-sans-13.5-medium-100',
          isLabelHidden && 'sr-only',
        )}
      >
        {label}
      </label>
      <div className="flex flex-col gap-6">
        <FieldContext
          value={{
            id,
            'aria-describedby': describedBy,
            'aria-invalid': error ? true : undefined,
          }}
        >
          {children}
        </FieldContext>
        {error && <ErrorMessage id={errorId}>{error}</ErrorMessage>}
        {description && <div id={descriptionId}>{description}</div>}
      </div>
    </div>
  )
}
