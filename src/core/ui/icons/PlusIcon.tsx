import type { ComponentProps } from 'react'

export function PlusIcon(props: ComponentProps<'svg'>) {
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
      <path d="M8.00001 3.33334V12.6667M3.33334 8H12.6667" />
    </svg>
  )
}
