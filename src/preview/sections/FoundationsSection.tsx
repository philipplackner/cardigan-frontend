import { PreviewGroup, PreviewSection } from '../PreviewSection'

const COLORS = [
  'background-app',
  'background-surface',
  'background-column',
  'background-sidebar',
  'background-hover',
  'background-skeleton',
  'background-skeleton-highlight',
  'background-scrim',
  'background-toast',
  'text-primary',
  'text-muted',
  'text-faint',
  'text-on-accent',
  'text-on-danger',
  'text-toast',
  'border',
  'border-strong',
  'border-accent-subtle',
  'border-danger-subtle',
  'accent',
  'accent-hover',
  'accent-soft',
  'danger',
  'danger-soft',
  'success',
  'success-soft',
  'shadow-small',
  'shadow-popover-1',
  'shadow-popover-2',
  'shadow-drag-1',
  'shadow-drag-2',
  'shadow-panel',
  'shadow-raised',
  'label-red',
  'label-orange',
  'label-amber',
  'label-yellow',
  'label-lime',
  'label-green',
  'label-emerald',
  'label-teal',
  'label-cyan',
  'label-sky',
  'label-blue',
  'label-indigo',
  'label-violet',
  'label-purple',
  'label-fuchsia',
  'label-pink',
  'label-rose',
  'label-brown',
  'label-olive',
  'label-slate',
]

const SPACING = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 25, 28,
  32,
]

const RADII = ['1', '2', '4', '5', '6', '7', '8', '10', '12', '16', 'full']

const SIZES = [
  'control-sm',
  'control-md',
  'control-touch-sm',
  'control-touch',
  'input',
  'icon-button-small',
  'icon-button-medium',
  'icon-button-large',
  'sidebar-tablet',
  'sidebar-desktop',
  'panel-tablet',
  'panel-desktop',
]

const SHADOWS = [
  'shadow-small',
  'shadow-popover',
  'shadow-drag',
  'shadow-panel',
  'shadow-raised',
  'shadow-focus-accent',
  'shadow-focus-danger',
]

const TYPE_ROLES = [
  'type-page-title',
  'type-screen-title',
  'type-card-title',
  'type-body',
  'type-label',
  'type-metadata',
  'type-section-label',
]

const TYPE_STYLES = [
  'type-mono-11-medium-100',
  'type-mono-11-medium-100-ls2',
  'type-mono-11-medium-100-ls6-caps',
  'type-mono-11-regular-100',
  'type-mono-11-semibold-100',
  'type-mono-11.5-regular-100',
  'type-mono-11.5-regular-160',
  'type-mono-12-regular-100',
  'type-mono-12-regular-145',
  'type-mono-12.5-regular-145',
  'type-mono-13-medium-100',
  'type-mono-9.5-semibold-147',
  'type-sans-11.5-semibold-100',
  'type-sans-12-medium-100',
  'type-sans-12-regular-145',
  'type-sans-12.5-medium-100',
  'type-sans-12.5-medium-145',
  'type-sans-12.5-regular-145',
  'type-sans-13-bold-145',
  'type-sans-13-medium-100',
  'type-sans-13-medium-145',
  'type-sans-13-regular-145',
  'type-sans-13.5-bold-145',
  'type-sans-13.5-medium-100',
  'type-sans-13.5-medium-138',
  'type-sans-13.5-medium-145',
  'type-sans-13.5-regular-145',
  'type-sans-13.5-regular-150',
  'type-sans-13.5-regular-155',
  'type-sans-13.5-semibold-100',
  'type-sans-14-medium-100',
  'type-sans-14-medium-145',
  'type-sans-14-regular-145',
  'type-sans-14-semibold-145',
  'type-sans-14.5-medium-138',
  'type-sans-14.5-regular-145',
  'type-sans-15-medium-100',
  'type-sans-15-regular-145',
  'type-sans-15-regular-150',
  'type-sans-15-regular-155',
  'type-sans-15-semibold-130',
  'type-sans-15-semibold-130-ls-1',
  'type-sans-15-semibold-145',
  'type-sans-15-semibold-150-ls-1',
  'type-sans-15.5-semibold-100-ls-2',
  'type-sans-15.5-semibold-130-ls-1',
  'type-sans-16-bold-145',
  'type-sans-16-semibold-130-ls-1',
  'type-sans-16.5-semibold-115-ls-1',
  'type-sans-17-semibold-100-ls-2',
  'type-sans-17-semibold-130-ls-1',
  'type-sans-18-semibold-100-ls-2',
  'type-sans-18-semibold-120-ls-1.5',
  'type-sans-18-semibold-135-ls-1',
  'type-sans-18-semibold-150-ls-1',
  'type-sans-20-semibold-135-ls-1',
  'type-sans-22-semibold-120-ls-2',
  'type-sans-26-semibold-110-ls-2.5',
  'type-sans-28-semibold-120-ls-2',
]

export function FoundationsSection() {
  return (
    <PreviewSection title="Foundations">
      <PreviewGroup title="Color">
        {COLORS.map((name) => (
          <div key={name} className="flex w-[160px] flex-col gap-4">
            <div
              className="h-[40px] rounded-6 border border-border"
              style={{ backgroundColor: `var(--color-${name})` }}
            />
            <span className="type-mono-11-regular-100 text-text-muted">
              {name}
            </span>
          </div>
        ))}
      </PreviewGroup>
      <PreviewGroup title="Spacing">
        {SPACING.map((step) => (
          <div key={step} className="flex flex-col items-start gap-4">
            <div
              className="h-[12px] bg-accent"
              style={{ width: `var(--spacing-${step})` }}
            />
            <span className="type-mono-11-regular-100 text-text-muted">
              {step}
            </span>
          </div>
        ))}
      </PreviewGroup>
      <PreviewGroup title="Radius">
        {RADII.map((radius) => (
          <div key={radius} className="flex flex-col items-center gap-4">
            <div
              className="size-[48px] border border-border-strong bg-accent-soft"
              style={{ borderRadius: `var(--radius-${radius})` }}
            />
            <span className="type-mono-11-regular-100 text-text-muted">
              {radius}
            </span>
          </div>
        ))}
      </PreviewGroup>
      <PreviewGroup title="Size">
        {SIZES.map((size) => (
          <div
            key={size}
            className="flex max-w-full flex-col items-start gap-4 overflow-x-auto"
          >
            <div
              className="w-[24px] bg-accent"
              style={{
                height:
                  size.startsWith('sidebar') || size.startsWith('panel')
                    ? '12px'
                    : `var(--spacing-${size})`,
                width:
                  size.startsWith('sidebar') || size.startsWith('panel')
                    ? `var(--spacing-${size})`
                    : undefined,
              }}
            />
            <span className="type-mono-11-regular-100 text-text-muted">
              {size}
            </span>
          </div>
        ))}
      </PreviewGroup>
      <PreviewGroup title="Shadow and focus">
        {SHADOWS.map((shadow) => (
          <div
            key={shadow}
            className={`flex size-[120px] items-end rounded-8 bg-background-surface p-8 ${shadow}`}
          >
            <span className="type-mono-11-regular-100 text-text-muted">
              {shadow}
            </span>
          </div>
        ))}
      </PreviewGroup>
      <PreviewGroup title="Type roles">
        <div className="flex flex-col gap-12">
          {TYPE_ROLES.map((role) => (
            <div key={role} className="flex flex-col gap-2">
              <span className="type-mono-11-regular-100 text-text-faint">
                {role}
              </span>
              <span className={role}>Single-flight token refresh</span>
            </div>
          ))}
        </div>
      </PreviewGroup>
      <PreviewGroup title="Text styles">
        <div className="flex flex-col gap-12">
          {TYPE_STYLES.map((style) => (
            <div key={style} className="flex flex-col gap-2">
              <span className="type-mono-11-regular-100 text-text-faint">
                {style}
              </span>
              <span className={style}>Cardigan</span>
            </div>
          ))}
        </div>
      </PreviewGroup>
    </PreviewSection>
  )
}
