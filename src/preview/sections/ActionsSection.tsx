import { useState } from 'react'
import { Button, FilterButton, icons } from '@/core/ui'
import { PreviewGroup, PreviewSection } from '../PreviewSection'

const VARIANTS = [
  'primary',
  'secondary',
  'ghost',
  'danger',
  'dangerGhost',
] as const
const SIZES = ['small', 'medium'] as const

export function ActionsSection() {
  const [clicks, setClicks] = useState(0)
  const [submits, setSubmits] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  return (
    <PreviewSection title="Actions">
      {VARIANTS.map((variant) => (
        <PreviewGroup
          key={variant}
          title={`Button · ${variant} · small, medium (touch sizes on phones)`}
        >
          {SIZES.map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-8">
              <Button variant={variant} size={size} icon={icons.PlusIcon}>
                New board
              </Button>
              <Button variant={variant} size={size}>
                No icon
              </Button>
              <Button
                variant={variant}
                size={size}
                icon={icons.PlusIcon}
                disabled
              >
                Disabled
              </Button>
              <Button
                variant={variant}
                size={size}
                icon={icons.PlusIcon}
                isLoading
              >
                Loading
              </Button>
            </div>
          ))}
        </PreviewGroup>
      ))}
      <PreviewGroup title="Long label truncates">
        <div className="w-[160px]">
          <Button icon={icons.PlusIcon}>
            Create a board with a very long name
          </Button>
        </div>
      </PreviewGroup>
      <PreviewGroup title="asChild renders a link">
        <Button asChild variant="secondary" icon={icons.ArrowRightIcon}>
          <a href="#actions">Link styled as a button</a>
        </Button>
      </PreviewGroup>
      <PreviewGroup title="Loading ignores clicks, Enter and implicit form submission">
        <form
          className="flex flex-wrap items-center gap-8"
          onSubmit={(event) => {
            event.preventDefault()
            setSubmits((count) => count + 1)
          }}
        >
          <input
            aria-label="Press Enter here"
            placeholder="Press Enter here"
            className="min-h-input rounded-6 border border-border-strong bg-background-surface px-10 type-sans-13.5-regular-145"
          />
          <Button
            type="submit"
            isLoading={isLoading}
            onClick={() => setClicks((count) => count + 1)}
          >
            Submit
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsLoading((value) => !value)}
          >
            {isLoading ? 'Stop loading' : 'Start loading'}
          </Button>
          <output className="type-mono-12-regular-100 text-text-muted">
            clicks {clicks} · submits {submits}
          </output>
        </form>
      </PreviewGroup>
      <PreviewGroup title="Filter button · default, active, disabled">
        <FilterButton label="Labels" icon={icons.LabelIcon} />
        <FilterButton label="Labels" icon={icons.LabelIcon} isActive />
        <FilterButton label="Labels" icon={icons.LabelIcon} disabled />
      </PreviewGroup>
    </PreviewSection>
  )
}
