import type { ComponentProps } from 'react'

export function TrashIcon(props: ComponentProps<'svg'>) {
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
      <path d="M3.33334 4.66667H12.6667M6.66668 4.66667V3.33334H9.33334V4.66667M4.66668 4.66667L5.33334 13.3333H10.6667L11.3333 4.66667" />
    </svg>
  )
}
