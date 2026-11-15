import { cn } from './cn'
import { IconButton } from './IconButton'
import { EditIcon, TrashIcon } from './icons'
import { LabelDot } from './LabelDot'
import type { LabelColor } from './labelColors'

type LabelRowProps = {
  name: string
  color: LabelColor
  editLabel: string
  deleteLabel: string
  onEdit: () => void
  onDelete: () => void
  hasDivider?: boolean
  className?: string
}

export function LabelRow({
  name,
  color,
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
  hasDivider = true,
  className,
}: LabelRowProps) {
  return (
    <div
      className={cn(
        'flex w-full min-w-[0] items-center gap-12 pt-10 pr-8 pl-16 phone:pt-14 phone:pr-6',
        // Figma draws the divider inside the row height.
        hasDivider
          ? 'border-b border-border pb-9 phone:pb-13'
          : 'pb-10 phone:pb-14',
        className,
      )}
    >
      <span className="flex min-w-[0] flex-1 items-center gap-5">
        <LabelDot color={color} />
        <span className="truncate type-sans-13.5-medium-100 text-text-primary phone:type-sans-15-medium-100">
          {name}
        </span>
      </span>
      <IconButton icon={EditIcon} label={editLabel} onClick={onEdit} />
      <IconButton icon={TrashIcon} label={deleteLabel} onClick={onDelete} />
    </div>
  )
}
