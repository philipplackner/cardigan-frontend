import { useEffect, useRef, type ReactNode } from 'react'

type InlineFormProps = {
  /** While true, the field is disabled. When it ends, focus returns to the field. */
  isSaving: boolean
  /** Called on a pointer press or a focus move outside the form. */
  onOutside: () => void
  onSubmit: () => void
  className?: string
  children: ReactNode
  'data-inline-form': string
}

/**
 * A form inside the board, such as quick add. Reports pointer presses and focus moves outside it,
 * so the owner can close it when it is empty.
 */
export function InlineForm({
  isSaving,
  onOutside,
  onSubmit,
  className,
  children,
  ...props
}: InlineFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const outside = useRef(onOutside)
  useEffect(() => {
    outside.current = onOutside
  })

  const wasSaving = useRef(isSaving)
  useEffect(() => {
    if (wasSaving.current && !isSaving) {
      formRef.current
        ?.querySelector<HTMLElement>('[data-inline-field]')
        ?.focus()
    }
    wasSaving.current = isSaving
  }, [isSaving])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const form = formRef.current
      if (form && !form.contains(event.target as Node)) outside.current()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  return (
    <form
      ref={formRef}
      noValidate
      className={className}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
      onBlur={(event) => {
        const next = event.relatedTarget
        if (next instanceof Node && !event.currentTarget.contains(next)) {
          outside.current()
        }
      }}
      {...props}
    >
      {children}
    </form>
  )
}
