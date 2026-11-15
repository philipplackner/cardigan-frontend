import { cn } from './cn'
import { Icon } from './Icon'
import { CheckIcon, CloseSmallIcon } from './icons'

type PasswordRuleProps = {
  text: string
  isMet: boolean
  /** Announced before the rule so the state isn't conveyed by color and icon alone, for example "Met" or "Not met". */
  stateLabel: string
  className?: string
}

export function PasswordRule({
  text,
  isMet,
  stateLabel,
  className,
}: PasswordRuleProps) {
  return (
    <p
      className={cn(
        'flex items-center gap-5 type-sans-12-regular-145',
        isMet ? 'text-success' : 'text-text-muted',
        className,
      )}
    >
      <Icon icon={isMet ? CheckIcon : CloseSmallIcon} size={13} />
      <span className="sr-only">{stateLabel}: </span>
      <span>{text}</span>
    </p>
  )
}
