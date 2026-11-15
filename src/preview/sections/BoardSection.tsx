import {
  AddCardButton,
  AddColumnButton,
  Card,
  Column,
  DropIndicator,
  IconButton,
  icons,
} from '@/core/ui'
import { PreviewGroup, PreviewSection } from '../PreviewSection'

const LABELS = [
  { name: 'api', color: 'blue' as const },
  { name: 'bug', color: 'red' as const },
]

export function BoardSection() {
  return (
    <PreviewSection title="Board">
      <PreviewGroup title="Card · default, without labels, selected, dragging, placeholder, long title (touch on phones)">
        <div className="flex w-[258px] flex-col gap-12">
          <Card displayId="CRD-101" title="Card title" labels={LABELS} />
          <Card displayId="CRD-102" title="Card without labels" />
          <Card
            displayId="CRD-103"
            title="Selected card"
            labels={LABELS}
            isSelected
          />
          <Card
            displayId="CRD-104"
            title="Dragging card"
            labels={LABELS}
            isDragging
          />
          <Card
            displayId="CRD-105"
            title="Placeholder"
            labels={LABELS}
            isPlaceholder
          />
          <Card
            displayId="CRD-106"
            title="Single-flight token refresh in the Ktor client so parallel 401s trigger one refresh"
            labels={[
              ...LABELS,
              { name: 'infrastructure', color: 'slate' },
              { name: 'design', color: 'violet' },
            ]}
          />
        </div>
      </PreviewGroup>
      <PreviewGroup title="Column · with cards, drop indicator, add card; empty without add card">
        <Column
          name="To do"
          count={3}
          menu={
            <IconButton
              icon={icons.MoreIcon}
              label="Column menu"
              size="small"
            />
          }
          footer={<AddCardButton label="Add card" />}
        >
          <Card displayId="CRD-101" title="Card title" labels={LABELS} />
          <DropIndicator />
          <Card displayId="CRD-102" title="Card without labels" />
        </Column>
        <Column
          name="A column with a very long name that truncates"
          count={0}
          menu={
            <IconButton
              icon={icons.MoreIcon}
              label="Column menu"
              size="small"
            />
          }
        />
      </PreviewGroup>
      <PreviewGroup title="Add card button, add column button, drop indicator">
        <div className="flex w-[258px] flex-col gap-12">
          <AddCardButton label="Add card" />
          <AddColumnButton label="Add column" />
          <div className="px-8 py-8">
            <DropIndicator />
          </div>
        </div>
      </PreviewGroup>
    </PreviewSection>
  )
}
