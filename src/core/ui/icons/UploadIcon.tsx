import type { ComponentProps } from 'react'

export function UploadIcon(props: ComponentProps<'svg'>) {
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
      <path d="M7.99999 10.6667V2.66667M11.3333 6.00001L7.99999 2.66667L4.66666 6.00001M2.66666 13.3333H13.3333" />
    </svg>
  )
}
