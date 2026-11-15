import type { ReactNode } from 'react'

type PreviewSectionProps = {
  title: string
  children?: ReactNode
}

export function PreviewSection({ title, children }: PreviewSectionProps) {
  const id = title.toLowerCase().replaceAll(/[^a-z]+/g, '-')
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="flex flex-col gap-16 border-t border-border py-32"
    >
      <h2 id={`${id}-title`} className="type-screen-title">
        {title}
      </h2>
      {children ?? <p className="type-body text-text-faint">Not built yet.</p>}
    </section>
  )
}

type PreviewGroupProps = {
  title: string
  children: ReactNode
}

export function PreviewGroup({ title, children }: PreviewGroupProps) {
  return (
    <div className="flex flex-col gap-8">
      <h3 className="type-section-label text-text-muted">{title}</h3>
      <div className="flex flex-wrap items-start gap-12">{children}</div>
    </div>
  )
}
