import type { ComponentProps } from 'react'

export function AlertIcon(props: ComponentProps<'svg'>) {
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
      <path d="M8 13.6667C11.1296 13.6667 13.6667 11.1296 13.6667 8C13.6667 4.87038 11.1296 2.33333 8 2.33333C4.87038 2.33333 2.33333 4.87038 2.33333 8C2.33333 11.1296 4.87038 13.6667 8 13.6667Z" />
      <path d="M8 5V8.66667M8 10.8V10.8667" />
    </svg>
  )
}
