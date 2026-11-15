import type { ComponentProps } from 'react'

export function ChevronLeftIcon(props: ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.13333}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9.99998 3.33333L5.33331 8L9.99998 12.6667" />
    </svg>
  )
}
