import type { ComponentProps } from 'react'

export function ArrowLeftIcon(props: ComponentProps<'svg'>) {
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
      <path d="M12.6666 8H3.33331M7.33331 12L3.33331 8L7.33331 4" />
    </svg>
  )
}
