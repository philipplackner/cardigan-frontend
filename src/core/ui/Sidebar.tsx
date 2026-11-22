import type { ReactNode } from 'react'
import { Avatar } from './Avatar'
import { Brand } from './Brand'
import { cn } from './cn'
import { IconButton } from './IconButton'
import { LogOutIcon } from './icons'

type BoardsSection =
  | {
      boardsHeading: string
      /** One `NavItem` per board. */
      boards?: ReactNode
      /** A dim `NavItem` after the boards, such as "New board". */
      boardsAction?: ReactNode
    }
  | { boardsHeading?: never; boards?: never; boardsAction?: never }

type SidebarProps = {
  brandName: string
  /** Accessible name of the navigation landmark. */
  navLabel: string
  /** Top-level `NavItem`s, such as all boards and labels. */
  mainNav?: ReactNode
  /** The account footer. Omitted when not given. */
  account?: {
    initial: string
    email: string
    logOutLabel: string
    onLogOut: () => void
  }
  className?: string
} & BoardsSection

/** Every block except the brand is optional and is left out when its props are missing. */
export function Sidebar({
  brandName,
  navLabel,
  mainNav,
  boardsHeading,
  boards,
  boardsAction,
  account,
  className,
}: SidebarProps) {
  return (
    <div
      className={cn(
        'flex h-full w-full min-w-[0] flex-col gap-18 border-r border-border bg-background-sidebar px-10 pt-14 pb-10',
        className,
      )}
    >
      <Brand name={brandName} size="sidebar" />
      <nav
        aria-label={navLabel}
        className="-mx-10 flex min-h-[0] flex-1 flex-col gap-18 overflow-y-auto px-10"
      >
        {mainNav != null && (
          <div className="flex flex-col gap-1">{mainNav}</div>
        )}
        {(boards != null || boardsAction != null) && (
          <div className="flex flex-col gap-1">
            <h2 className="px-8 pt-2 pb-8 type-mono-11-medium-100-ls6-caps text-text-muted">
              {boardsHeading}
            </h2>
            {boards != null && (
              <div className="flex flex-col gap-1">{boards}</div>
            )}
            {boardsAction}
          </div>
        )}
      </nav>
      {account && (
        <div className="border-t border-border pt-8">
          <div className="flex min-w-[0] items-center gap-9 py-4 pr-4 pl-8">
            <Avatar initial={account.initial} />
            <span className="min-w-[0] flex-1 truncate type-sans-13-regular-145 text-text-primary">
              {account.email}
            </span>
            <IconButton
              icon={LogOutIcon}
              label={account.logOutLabel}
              onClick={account.onLogOut}
            />
          </div>
        </div>
      )}
    </div>
  )
}
