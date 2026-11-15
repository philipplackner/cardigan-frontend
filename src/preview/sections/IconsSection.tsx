import { Icon, IconButton, icons } from '@/core/ui'
import { PreviewGroup, PreviewSection } from '../PreviewSection'

const ALL_ICONS = Object.entries(icons)

export function IconsSection() {
  return (
    <PreviewSection title="Icons">
      <PreviewGroup title="All 27 icons, 16 px, text/muted">
        {ALL_ICONS.map(([name, svg]) => (
          <div
            key={name}
            className="flex w-[96px] flex-col items-center gap-4 text-text-muted"
          >
            <Icon icon={svg} />
            <span className="type-mono-11-regular-100">
              {name.replace('Icon', '')}
            </span>
          </div>
        ))}
      </PreviewGroup>
      <PreviewGroup title="Color follows the parent text color">
        <span className="text-accent">
          <Icon icon={icons.PlusIcon} />
        </span>
        <span className="text-danger">
          <Icon icon={icons.TrashIcon} />
        </span>
        <span className="text-success">
          <Icon icon={icons.CheckIcon} />
        </span>
        <span className="text-text-primary">
          <Icon icon={icons.BoardIcon} label="Board" />
        </span>
      </PreviewGroup>
      <PreviewGroup title="Icon sizes 15, 16, 19">
        <Icon icon={icons.PlusIcon} size={15} />
        <Icon icon={icons.PlusIcon} size={16} />
        <Icon icon={icons.PlusIcon} size={19} />
      </PreviewGroup>
      {(['ghost', 'boxed'] as const).map((variant) =>
        [false, true].map((isSelected) => (
          <PreviewGroup
            key={`${variant}-${isSelected}`}
            title={`Icon button · ${variant} · ${isSelected ? 'selected' : 'default'} · small, medium, large, disabled`}
          >
            <IconButton
              icon={icons.MoreIcon}
              label="More"
              variant={variant}
              isSelected={isSelected}
              size="small"
            />
            <IconButton
              icon={icons.MoreIcon}
              label="More"
              variant={variant}
              isSelected={isSelected}
              size="medium"
            />
            <IconButton
              icon={icons.MoreIcon}
              label="More"
              variant={variant}
              isSelected={isSelected}
              size="large"
            />
            <IconButton
              icon={icons.MoreIcon}
              label="More"
              variant={variant}
              isSelected={isSelected}
              disabled
            />
          </PreviewGroup>
        )),
      )}
    </PreviewSection>
  )
}
