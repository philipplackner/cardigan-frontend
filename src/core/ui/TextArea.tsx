import { cva } from 'class-variance-authority'
import { useCallback, type ComponentProps, type Ref } from 'react'
import { cn } from './cn'
import { useFieldControl } from './FieldContext'

const textAreaVariants = cva(
  'block w-full min-w-[0] resize-none overflow-hidden rounded-6 border bg-background-surface text-text-primary caret-accent outline-none transition-shadow placeholder:text-text-faint disabled:opacity-55',
  {
    variants: {
      type: {
        multiLine:
          'px-10 py-8 type-sans-13.5-regular-150 phone:type-sans-15-regular-150',
        title:
          'px-10 py-8 type-sans-18-semibold-150-ls-1 phone:type-sans-15-semibold-150-ls-1',
        description:
          'px-12 py-10 type-sans-13.5-regular-155 phone:type-sans-15-regular-155',
      },
      isInvalid: {
        true: 'border-danger shadow-focus-danger',
        false:
          'border-border-strong focus:border-accent focus:shadow-focus-accent',
      },
    },
  },
)

type TextAreaProps = Omit<ComponentProps<'textarea'>, 'rows'> & {
  type?: 'multiLine' | 'title' | 'description'
  isInvalid?: boolean
}

function fitHeight(element: HTMLTextAreaElement) {
  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight + element.offsetHeight - element.clientHeight}px`
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value)
  else if (ref) ref.current = value
}

/** Grows with its content and never shows an inner scrollbar. In a scrolling panel body, the body scrolls instead. */
export function TextArea({
  type = 'multiLine',
  isInvalid,
  className,
  onInput,
  ref,
  ...props
}: TextAreaProps) {
  const field = useFieldControl()
  const invalid = isInvalid ?? field?.['aria-invalid'] === true

  const measureRef = useCallback(
    (element: HTMLTextAreaElement | null) => {
      assignRef(ref, element)
      if (!element) return
      fitHeight(element)
      let width = element.offsetWidth
      const observer = new ResizeObserver(() => {
        if (element.offsetWidth === width) return
        width = element.offsetWidth
        fitHeight(element)
      })
      observer.observe(element)
      // Crossing the phone condition changes the font size without changing the width.
      const refit = () => fitHeight(element)
      window.addEventListener('resize', refit)
      return () => {
        observer.disconnect()
        window.removeEventListener('resize', refit)
        assignRef(ref, null)
      }
    },
    [ref],
  )

  return (
    <textarea
      ref={measureRef}
      rows={1}
      id={field?.id}
      aria-describedby={field?.['aria-describedby']}
      aria-invalid={invalid || undefined}
      className={cn(textAreaVariants({ type, isInvalid: invalid }), className)}
      onInput={(event) => {
        fitHeight(event.currentTarget)
        onInput?.(event)
      }}
      {...props}
    />
  )
}
