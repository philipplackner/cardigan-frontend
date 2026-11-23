import { useState } from 'react'
import {
  BottomSheet,
  Button,
  Dialog,
  Field,
  FilterButton,
  IconButton,
  Input,
  Label,
  Menu,
  MenuDivider,
  MenuHeader,
  MenuItem,
  Option,
  Popover,
  icons,
  type LabelColor,
} from '@/core/ui'
import { PreviewGroup, PreviewSection } from '../PreviewSection'

const FILTER_LABELS: { name: string; color: LabelColor }[] = [
  { name: 'api', color: 'blue' },
  { name: 'bug', color: 'red' },
  { name: 'design', color: 'violet' },
]

export function OverlaysSection() {
  const [lastAction, setLastAction] = useState('none')
  const [selected, setSelected] = useState<string[]>(['bug'])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [progressOpen, setProgressOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [noReturnOpen, setNoReturnOpen] = useState(false)

  const toggle = (name: string, checked: boolean) =>
    setSelected((current) =>
      checked ? [...current, name] : current.filter((n) => n !== name),
    )

  const options = FILTER_LABELS.map((label) => (
    <Option
      key={label.name}
      checked={selected.includes(label.name)}
      onCheckedChange={(value) => toggle(label.name, value === true)}
    >
      <Label name={label.name} color={label.color} size="small" />
    </Option>
  ))

  return (
    <PreviewSection title="Overlays">
      <PreviewGroup
        title={`Menu · arrow keys, Escape returns focus · last action: ${lastAction}`}
      >
        <Menu
          trigger={<IconButton icon={icons.MoreIcon} label="Column menu" />}
        >
          <MenuHeader label="Column" />
          <MenuItem
            icon={icons.RenameIcon}
            label="Rename"
            onSelect={() => setLastAction('rename')}
          />
          <MenuItem
            icon={icons.PlusIcon}
            label="Add card"
            onSelect={() => setLastAction('add card')}
          />
          <MenuItem
            icon={icons.DownloadIcon}
            label="Export (disabled)"
            disabled
          />
          <MenuDivider />
          <MenuItem
            icon={icons.TrashIcon}
            label="Delete column"
            variant="danger"
            onSelect={() => setLastAction('delete')}
          />
        </Menu>
      </PreviewGroup>
      <PreviewGroup
        title={`Popover · Escape and outside click close · selected: ${selected.join(', ') || 'none'}`}
      >
        <Popover
          label="Filter by label"
          trigger={
            <FilterButton
              label="Labels"
              icon={icons.LabelIcon}
              isActive={selected.length > 0}
            />
          }
        >
          {options}
        </Popover>
      </PreviewGroup>
      <PreviewGroup title="Dialog · default (Escape and scrim close), progress (nothing closes it, ends after 3 s)">
        <Button variant="secondary" onClick={() => setDialogOpen(true)}>
          Open dialog
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setProgressOpen(true)
            setTimeout(() => setProgressOpen(false), 3000)
          }}
        >
          Open progress dialog
        </Button>
        <Dialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="Rename board"
          description="Board names show in the sidebar and the board list."
          actions={
            <>
              <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setDialogOpen(false)}>Save</Button>
            </>
          }
        >
          <Field label="Name">
            <Input defaultValue="Cardigan v1" />
          </Field>
        </Dialog>
        <Dialog
          open={progressOpen}
          onOpenChange={setProgressOpen}
          type="progress"
          title="Importing board"
          description="This can take a few seconds."
        />
      </PreviewGroup>
      <PreviewGroup title="Dialog · returnFocus={false}: closing focuses the field, not the button">
        <Button variant="secondary" onClick={() => setNoReturnOpen(true)}>
          Open dialog
        </Button>
        <Input
          id="preview-kept-field"
          aria-label="Kept field"
          defaultValue="Focus lands here"
        />
        <Dialog
          open={noReturnOpen}
          onOpenChange={(open) => {
            setNoReturnOpen(open)
            if (!open) document.getElementById('preview-kept-field')?.focus()
          }}
          returnFocus={false}
          title="Discard changes?"
          actions={
            <Button
              variant="secondary"
              onClick={() => {
                setNoReturnOpen(false)
                document.getElementById('preview-kept-field')?.focus()
              }}
            >
              Keep editing
            </Button>
          }
        />
      </PreviewGroup>
      <PreviewGroup title="Bottom sheet · phone only, scrim tap and Escape close">
        <Button variant="secondary" onClick={() => setSheetOpen(true)}>
          Open bottom sheet
        </Button>
        <BottomSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title="Filter by label"
        >
          {options}
        </BottomSheet>
      </PreviewGroup>
    </PreviewSection>
  )
}
