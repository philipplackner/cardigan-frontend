import type { ComponentProps } from 'react'

export function CheckIcon(props: ComponentProps<'svg'>) {
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
      <path d="M3.33334 8.33333L6.33334 11.3333L12.6667 5" />
    </svg>
  )
}
