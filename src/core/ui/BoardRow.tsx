import { Slot } from 'radix-ui'
import type { ReactElement, ReactNode } from 'react'
import { cn } from './cn'
import { Key } from './Key'

type BoardRowProps = {
  name: string
  keyValue: string
  /** For example "12 cards". */
  cardsText: string
  /** For example "2 hours ago". */
  updatedText: string
  /** The link that opens the board, without children. The whole row is clickable. */
  link: ReactElement
  /** Board menu trigger, usually a medium `IconButton` inside a `Menu`. */
  menu?: ReactNode
  hasDivider?: boolean
  className?: string
}

export function BoardRow({
  name,
  keyValue,
  cardsText,
  updatedText,
  link,
  menu,
  hasDivider,
  className,
}: BoardRowProps) {
  return (
    <article
      className={cn(
        'relative flex w-full min-w-[0] items-center gap-10 pt-12 pr-6 pl-14',
        // Figma draws the divider inside the row height.
        hasDivider === false ? 'pb-12' : 'border-b border-border pb-11',
        className,
      )}
    >
      <div className="flex min-w-[0] flex-1 flex-col gap-6">
        <h3 className="truncate type-sans-15.5-semibold-130-ls-1 text-text-primary">
          <Slot.Root className="outline-none after:absolute after:inset-[0] focus-visible:after:shadow-focus-accent">
            <Slot.Slottable>{link}</Slot.Slottable>
            {name}
          </Slot.Root>
        </h3>
        <div className="flex min-w-[0] items-center gap-8 type-mono-12-regular-100 text-text-muted">
          <Key value={keyValue} />
          <span className="truncate">{cardsText}</span>
          <span aria-hidden>·</span>
          <span className="truncate">{updatedText}</span>
        </div>
      </div>
      {menu && <div className="relative z-10 shrink-0">{menu}</div>}
    </article>
  )
}
