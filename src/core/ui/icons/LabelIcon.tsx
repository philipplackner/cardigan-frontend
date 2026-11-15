import type { ComponentProps } from 'react'

export function LabelIcon(props: ComponentProps<'svg'>) {
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
      <path d="M2.33334 8.33333V3H7.66668L13.6667 9L8.33334 14.3333L2.33334 8.33333Z" />
      <path d="M5.33334 6.86666C5.81199 6.86666 6.20001 6.47864 6.20001 6C6.20001 5.52135 5.81199 5.13333 5.33334 5.13333C4.85469 5.13333 4.46667 5.52135 4.46667 6C4.46667 6.47864 4.85469 6.86666 5.33334 6.86666Z" />
    </svg>
  )
}
