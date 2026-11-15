import { Button, Field, LabelChip, Panel, TextArea } from '@/core/ui'
import { PreviewGroup, PreviewSection } from '../PreviewSection'

export function PreviewPanel({ onClose }: { onClose: () => void }) {
  return (
    <Panel
      cardId="CRD-109"
      context="in In progress"
      closeLabel="Close"
      onClose={onClose}
      footer={
        <>
          <Button variant="dangerGhost">Delete</Button>
          <span className="flex-1" />
          <Button>Save</Button>
        </>
      }
    >
      <Field label="Title">
        <TextArea
          type="title"
          defaultValue="Single-flight token refresh in the Ktor client"
        />
      </Field>
      <Field label="Description">
        <TextArea
          type="description"
          defaultValue="When several requests get a 401 at the same time, only one refresh call should run. The others wait and retry with the new token."
        />
      </Field>
      <div className="flex flex-wrap gap-6">
        <LabelChip
          name="api"
          color="blue"
          onRemove={() => {}}
          removeLabel="Remove api"
        />
        <LabelChip
          name="bug"
          color="red"
          onRemove={() => {}}
          removeLabel="Remove bug"
        />
      </div>
    </Panel>
  )
}

export function CardDetailSection() {
  return (
    <PreviewSection title="Card detail">
      <PreviewGroup title="Panel · header, body (scrolls), footer">
        <div className="h-[560px] w-panel-desktop">
          <PreviewPanel onClose={() => {}} />
        </div>
      </PreviewGroup>
    </PreviewSection>
  )
}
