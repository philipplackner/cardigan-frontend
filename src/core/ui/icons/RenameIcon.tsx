import type { ComponentProps } from 'react'

export function RenameIcon(props: ComponentProps<'svg'>) {
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
      <path d="M2.66666 4.66667H13.3333M2.66666 8.00001H9.33332M2.66666 11.3333H7.33332" />
      <path d="M11.3333 9.33333L13.3333 11.3333L10.6667 14H8.66666V12L11.3333 9.33333Z" />
    </svg>
  )
}
