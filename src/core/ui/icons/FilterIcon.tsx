import type { ComponentProps } from 'react'

export function FilterIcon(props: ComponentProps<'svg'>) {
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
      <path d="M2.66669 4H13.3334M4.66669 8H11.3334M6.66669 12H9.33335" />
    </svg>
  )
}
