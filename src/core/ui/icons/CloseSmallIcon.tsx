import type { ComponentProps } from 'react'

export function CloseSmallIcon(props: ComponentProps<'svg'>) {
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
      <path d="M4.66669 4.66667L11.3334 11.3333M11.3334 4.66667L4.66669 11.3333" />
    </svg>
  )
}
