import { Slot } from 'radix-ui'
import type { ComponentProps, ReactElement } from 'react'
import { cn } from './cn'
import { Icon, type IconComponent } from './Icon'

type NavItemProps = Omit<ComponentProps<'a'>, 'children'> & {
  label: string
  icon: IconComponent
  /** Board key shown after the label, for example "CRD". */
  keyValue?: string
  /** The current page. Sets `aria-current="page"`. */
  isSelected?: boolean
  /** Muted text, used for secondary actions such as "New board". */
  isDim?: boolean
  /**
   * Renders the child element (a router link or a button) as the item. Pass it without children;
   * the icon, label and key are placed inside it.
   */
  asChild?: boolean
  children?: ReactElement
}

export function NavItem({
  label,
  icon,
  keyValue,
  isSelected = false,
  isDim,
  asChild = false,
  className,
  children,
  ...props
}: NavItemProps) {
  const Component = asChild ? Slot.Root : 'a'
  return (
    <Component
      aria-current={isSelected ? 'page' : undefined}
      className={cn(
        'flex w-full min-w-[0] items-center gap-9 rounded-6 px-8 py-7 text-left outline-none focus-visible:shadow-focus-accent',
        isSelected && 'border border-border bg-background-surface shadow-small',
        className,
      )}
      {...props}
    >
      <Icon
        icon={icon}
        className={isSelected ? 'text-accent' : 'text-text-muted'}
      />
      <Slot.Slottable>{asChild ? children : null}</Slot.Slottable>
      <span
        className={cn(
          'min-w-[0] flex-1 truncate',
          isSelected
            ? 'type-sans-13.5-medium-145'
            : 'type-sans-13.5-regular-145',
          isDim ? 'text-text-muted' : 'text-text-primary',
        )}
      >
        {label}
      </span>
      {keyValue && (
        <span className="shrink-0 type-mono-11-regular-100 text-text-faint">
          {keyValue}
        </span>
      )}
    </Component>
  )
}
