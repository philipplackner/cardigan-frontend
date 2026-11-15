import type { ComponentProps } from 'react'

export function EditIcon(props: ComponentProps<'svg'>) {
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
      <path d="M2.66669 13.3333H5.33335L12.6667 6L10 3.33334L2.66669 10.6667V13.3333Z" />
      <path d="M9 4.33334L11.6667 7" />
    </svg>
  )
}
