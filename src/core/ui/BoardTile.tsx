import { Slot } from 'radix-ui'
import type { ReactElement, ReactNode } from 'react'
import { cn } from './cn'
import { Key } from './Key'

type BoardTileProps = {
  name: string
  keyValue: string
  /** For example "12 cards". */
  cardsText: string
  /** For example "Updated 2 hours ago". */
  updatedText: string
  /** The link that opens the board, without children, for example a router `Link`. The whole tile is clickable. */
  link: ReactElement
  /** Board menu trigger, usually a medium `IconButton` inside a `Menu`. */
  menu?: ReactNode
  className?: string
}

export function BoardTile({
  name,
  keyValue,
  cardsText,
  updatedText,
  link,
  menu,
  className,
}: BoardTileProps) {
  return (
    <article
      className={cn(
        'relative flex w-full min-w-[0] flex-col gap-10 rounded-8 border border-border bg-background-surface px-14 pt-14 pb-12 shadow-small hover:border-border-strong',
        className,
      )}
    >
      <div className="flex h-[26px] items-center">
        <Key value={keyValue} />
      </div>
      {menu && <div className="absolute top-9 right-7 z-10">{menu}</div>}
      <h3 className="min-w-[0] type-sans-15-semibold-130-ls-1 text-text-primary">
        <Slot.Root className="outline-none after:absolute after:inset-[0] after:rounded-8 focus-visible:after:shadow-focus-accent">
          <Slot.Slottable>{link}</Slot.Slottable>
          {name}
        </Slot.Root>
      </h3>
      <div className="flex justify-between gap-10 border-t border-border pt-10 type-mono-12-regular-100 text-text-muted">
        <span className="truncate">{cardsText}</span>
        <span className="truncate">{updatedText}</span>
      </div>
    </article>
  )
}
