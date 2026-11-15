import type { ComponentProps } from 'react'

export function ColumnsIcon(props: ComponentProps<'svg'>) {
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
      <path d="M5.99999 3H3.33333C2.78104 3 2.33333 3.44772 2.33333 4V12C2.33333 12.5523 2.78104 13 3.33333 13H5.99999C6.55228 13 7 12.5523 7 12V4C7 3.44772 6.55228 3 5.99999 3Z" />
      <path d="M12.6667 3H10C9.44772 3 9 3.44772 9 4V12C9 12.5523 9.44772 13 10 13H12.6667C13.219 13 13.6667 12.5523 13.6667 12V4C13.6667 3.44772 13.219 3 12.6667 3Z" />
    </svg>
  )
}
