import type { ComponentProps } from 'react'

export function SearchIcon(props: ComponentProps<'svg'>) {
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
      <path d="M7.33333 11.6667C9.72657 11.6667 11.6667 9.72657 11.6667 7.33333C11.6667 4.9401 9.72657 3 7.33333 3C4.9401 3 3 4.9401 3 7.33333C3 9.72657 4.9401 11.6667 7.33333 11.6667Z" />
      <path d="M13.3333 13.3333L10.5333 10.5333" />
    </svg>
  )
}
