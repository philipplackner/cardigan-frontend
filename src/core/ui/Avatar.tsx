import { cn } from './cn'

type AvatarProps = {
  initial: string
  /** Accessible name. Leave it out when the user's name is shown next to the avatar. */
  label?: string
  className?: string
}

export function Avatar({ initial, label, className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex size-[26px] shrink-0 items-center justify-center rounded-full bg-accent-soft type-sans-11.5-semibold-100 text-accent',
        className,
      )}
      {...(label
        ? { role: 'img', 'aria-label': label }
        : { 'aria-hidden': true })}
    >
      {initial}
    </span>
  )
}
