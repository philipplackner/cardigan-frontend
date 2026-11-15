import { DropdownMenu } from 'radix-ui'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from './cn'
import { Icon, type IconComponent } from './Icon'

type MenuProps = {
  /** The element that opens the menu, usually an `IconButton`. */
  trigger: ReactNode
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  align?: 'start' | 'center' | 'end'
  className?: string
}

export function Menu({
  trigger,
  children,
  open,
  onOpenChange,
  align = 'end',
  className,
}: MenuProps) {
  return (
    <DropdownMenu.Root open={open} onOpenChange={onOpenChange}>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={4}
          collisionPadding={8}
          className={cn(
            'z-50 flex min-w-[208px] flex-col gap-1 rounded-8 border border-border bg-background-surface p-4 shadow-popover outline-none phone:min-w-[232px]',
            'motion-safe:data-[state=open]:animate-pop-in motion-safe:data-[state=closed]:animate-pop-out',
            className,
          )}
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

type MenuItemProps = Omit<
  ComponentProps<typeof DropdownMenu.Item>,
  'asChild' | 'children'
> & {
  label: string
  icon?: IconComponent
  variant?: 'default' | 'danger'
}

/** Arrow keys and hover show the Highlighted state. Disabled items are skipped by the keyboard. */
export function MenuItem({
  label,
  icon,
  variant = 'default',
  className,
  ...props
}: MenuItemProps) {
  return (
    <DropdownMenu.Item
      className={cn(
        'group flex min-w-[0] cursor-default items-center gap-10 rounded-5 px-10 py-8 type-sans-13.5-regular-145 outline-none select-none data-highlighted:bg-background-hover phone:p-12 phone:type-sans-15-regular-145',
        variant === 'danger' ? 'text-danger' : 'text-text-primary',
        'data-disabled:text-text-faint',
        className,
      )}
      {...props}
    >
      {icon && (
        <Icon
          icon={icon}
          className={cn(
            variant === 'danger' ? 'text-danger' : 'text-text-muted',
            'group-data-disabled:text-text-faint',
          )}
        />
      )}
      <span className="truncate">{label}</span>
    </DropdownMenu.Item>
  )
}

type MenuHeaderProps = {
  label: string
  className?: string
}

export function MenuHeader({ label, className }: MenuHeaderProps) {
  return (
    <DropdownMenu.Label
      className={cn(
        'truncate px-10 pt-8 pb-6 type-sans-12-regular-145 text-text-muted phone:p-12 phone:type-sans-15-regular-145',
        className,
      )}
    >
      {label}
    </DropdownMenu.Label>
  )
}

export function MenuDivider({ className }: { className?: string }) {
  return (
    <DropdownMenu.Separator
      className={cn('mx-2 my-4 h-1 bg-border', className)}
    />
  )
}
