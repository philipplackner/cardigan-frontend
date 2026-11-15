import { PreviewSection } from './PreviewSection'
import type { ComponentType } from 'react'
import { ActionsSection } from './sections/ActionsSection'
import { FeedbackSection } from './sections/FeedbackSection'
import { DataDisplaySection } from './sections/DataDisplaySection'
import { LabelsSection } from './sections/LabelsSection'
import { BoardSection } from './sections/BoardSection'
import { BoardsSection } from './sections/BoardsSection'
import { CardDetailSection } from './sections/CardDetailSection'
import { ImportExportSection } from './sections/ImportExportSection'
import { NavigationSection } from './sections/NavigationSection'
import { OverlaysSection } from './sections/OverlaysSection'
import { BrandSection } from './sections/BrandSection'
import { FoundationsSection } from './sections/FoundationsSection'
import { IconsSection } from './sections/IconsSection'
import { InputsSection } from './sections/InputsSection'

const BUILT_SECTIONS: Record<string, ComponentType> = {
  Icons: IconsSection,
  Brand: BrandSection,
  Actions: ActionsSection,
  Feedback: FeedbackSection,
  Labels: LabelsSection,
  'Data display': DataDisplaySection,
  Inputs: InputsSection,
  Overlays: OverlaysSection,
  Navigation: NavigationSection,
  Board: BoardSection,
  Boards: BoardsSection,
  'Card detail': CardDetailSection,
  'Import & export': ImportExportSection,
}

const DESIGN_SYSTEM_SECTIONS = [
  'Icons',
  'Brand',
  'Feedback',
  'Labels',
  'Data display',
  'Inputs',
  'Overlays',
  'Board',
  'Actions',
  'Navigation',
  'Boards',
  'Card detail',
  'Import & export',
]

export function PreviewApp() {
  return (
    <main className="flex flex-col px-24 py-32 phone:px-16">
      <h1 className="type-page-title">Design system preview</h1>
      <p className="type-body text-text-muted">
        Dev only. Follows the system color scheme.
      </p>
      <nav aria-label="Sections" className="flex flex-wrap gap-12 py-16">
        {['Foundations', ...DESIGN_SYSTEM_SECTIONS].map((title) => (
          <a
            key={title}
            href={`#${title.toLowerCase().replaceAll(/[^a-z]+/g, '-')}`}
            className="type-label text-accent"
          >
            {title}
          </a>
        ))}
      </nav>
      <FoundationsSection />
      {DESIGN_SYSTEM_SECTIONS.map((title) => {
        const Section = BUILT_SECTIONS[title]
        return Section ? (
          <Section key={title} />
        ) : (
          <PreviewSection key={title} title={title} />
        )
      })}
    </main>
  )
}
