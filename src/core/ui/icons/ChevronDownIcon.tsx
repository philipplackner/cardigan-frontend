import type { ComponentProps } from 'react'

export function ChevronDownIcon(props: ComponentProps<'svg'>) {
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
      <path d="M4.66666 6.66667L7.99999 10L11.3333 6.66667" />
    </svg>
  )
}
