import type { ComponentProps } from 'react'

export function FileIcon(props: ComponentProps<'svg'>) {
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
      <path d="M4 2.33333H9.33333L12 4.99999V13.6667H4V2.33333Z" />
      <path d="M9.33334 2.33333V5.33333H12" />
    </svg>
  )
}
