import { RadioGroup } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from './cn'
import { LABEL_BG_CLASSES, type LabelColor } from './labelColors'

type SwatchGroupProps = Omit<
  ComponentProps<typeof RadioGroup.Root>,
  'value' | 'defaultValue' | 'onValueChange'
> & {
  value?: LabelColor
  defaultValue?: LabelColor
  onValueChange?: (color: LabelColor) => void
}

/** Groups swatches as one radio group: arrow keys move between colors. */
export function SwatchGroup({
  className,
  onValueChange,
  ...props
}: SwatchGroupProps) {
  return (
    <RadioGroup.Root
      orientation="horizontal"
      className={cn('flex flex-wrap gap-8', className)}
      onValueChange={(value) => onValueChange?.(value as LabelColor)}
      {...props}
    />
  )
}

type SwatchProps = {
  color: LabelColor
  /** Accessible name, for example "Teal". */
  label: string
  className?: string
}

export function Swatch({ color, label, className }: SwatchProps) {
  return (
    <RadioGroup.Item
      value={color}
      aria-label={label}
      className={cn(
        'size-[30px] shrink-0 rounded-full outline-offset-2 data-[state=checked]:outline-2 data-[state=checked]:outline-text-primary focus-visible:shadow-focus-accent',
        LABEL_BG_CLASSES[color],
        className,
      )}
    />
  )
}
