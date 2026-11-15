import { cva } from 'class-variance-authority'
import { cn } from './cn'
import { Logo } from './Logo'

const brandVariants = cva('inline-flex items-center gap-9 py-4 pr-8', {
  variants: {
    size: {
      sidebar: 'pl-8',
      appBar: 'pl-4',
      auth: 'pl-8',
    },
  },
})

const wordmarkVariants = cva('truncate text-text-primary', {
  variants: {
    size: {
      sidebar: 'type-sans-15.5-semibold-100-ls-2',
      appBar: 'type-sans-17-semibold-100-ls-2',
      auth: 'type-sans-18-semibold-100-ls-2',
    },
  },
})

type BrandProps = {
  /** The product name shown as the wordmark. */
  name: string
  size: 'sidebar' | 'appBar' | 'auth'
  className?: string
}

export function Brand({ name, size, className }: BrandProps) {
  return (
    <span
      className={cn(brandVariants({ size }), 'max-w-full min-w-[0]', className)}
    >
      <Logo />
      <span className={wordmarkVariants({ size })}>{name}</span>
    </span>
  )
}
