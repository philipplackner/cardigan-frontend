import type { ComponentProps } from 'react'

export function LogOutIcon(props: ComponentProps<'svg'>) {
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
      <path d="M10 2.66666H12.6667V13.3333H10M6.66667 10.6667L4 8L6.66667 5.33333M4 8H10.6667" />
    </svg>
  )
}
