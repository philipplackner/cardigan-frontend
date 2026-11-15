import type { ComponentProps } from 'react'

export function DownloadIcon(props: ComponentProps<'svg'>) {
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
      <path d="M7.99999 2.66667V10.6667M11.3333 7.33334L7.99999 10.6667L4.66666 7.33334M2.66666 13.3333H13.3333" />
    </svg>
  )
}
