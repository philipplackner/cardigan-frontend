import type { ComponentProps } from 'react'

export function InfoIcon(props: ComponentProps<'svg'>) {
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
      <path d="M7.99998 13.6667C11.1296 13.6667 13.6666 11.1296 13.6666 8C13.6666 4.87038 11.1296 2.33333 7.99998 2.33333C4.87037 2.33333 2.33331 4.87038 2.33331 8C2.33331 11.1296 4.87037 13.6667 7.99998 13.6667Z" />
      <path d="M8 7.33333V11M8 5.2V5.26666" />
    </svg>
  )
}
