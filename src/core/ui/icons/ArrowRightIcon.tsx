import type { ComponentProps } from 'react'

export function ArrowRightIcon(props: ComponentProps<'svg'>) {
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
      <path d="M3.33334 8H12.6667M8.66667 12L12.6667 8L8.66667 4" />
    </svg>
  )
}
