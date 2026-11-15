import type { ComponentProps, ComponentType } from 'react'
import { cn } from './cn'

export type IconComponent = ComponentType<ComponentProps<'svg'>>

const SIZE_CLASSES = {
  15: 'size-15',
  16: 'size-16',
  19: 'size-[19px]',
} as const

export type IconSize = keyof typeof SIZE_CLASSES

type IconProps = {
  icon: IconComponent
  size?: IconSize
  /** Accessible name. Leave it out for icons next to visible text, which are then hidden from assistive technology. */
  label?: string
  className?: string
}

export function Icon({ icon: Svg, size = 16, label, className }: IconProps) {
  return (
    <Svg
      className={cn('shrink-0', SIZE_CLASSES[size], className)}
      focusable="false"
      {...(label
        ? { role: 'img', 'aria-label': label }
        : { 'aria-hidden': true })}
    />
  )
}
