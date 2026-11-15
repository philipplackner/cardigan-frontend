import type { ComponentProps } from 'react'

export function RefreshIcon(props: ComponentProps<'svg'>) {
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
      <path d="M13.3333 8C13.3354 9.23198 12.9108 10.4267 12.1318 11.3811C11.3528 12.3355 10.2674 12.9908 9.06003 13.2357C7.85262 13.4806 6.59768 13.2999 5.50841 12.7243C4.41914 12.1488 3.56271 11.2138 3.08463 10.0784C2.60655 8.94297 2.53631 7.67703 2.88583 6.49567C3.23535 5.31431 3.98308 4.29038 5.00198 3.59785C6.02089 2.90531 7.24813 2.58688 8.47521 2.69664C9.7023 2.80641 10.8535 3.33761 11.7333 4.2M13.3333 2.66666V6H10" />
    </svg>
  )
}
