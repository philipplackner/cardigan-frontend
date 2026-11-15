import { useState } from 'react'
import {
  LABEL_COLORS,
  Label,
  LabelChip,
  LabelDot,
  LabelRow,
  Swatch,
  SwatchGroup,
  type LabelColor,
} from '@/core/ui'
import { PreviewGroup, PreviewSection } from '../PreviewSection'

// @ts-expect-error Only the 20 palette names are label colors.
const NOT_A_LABEL_COLOR: LabelColor = 'magenta'
void NOT_A_LABEL_COLOR

const title = (color: string) => color[0]!.toUpperCase() + color.slice(1)

export function LabelsSection() {
  const [color, setColor] = useState<LabelColor>('teal')
  const [chips, setChips] = useState<LabelColor[]>(['blue', 'rose', 'lime'])

  return (
    <PreviewSection title="Labels">
      <PreviewGroup title="Label dot · all 20 palette colors">
        {LABEL_COLORS.map((name) => (
          <LabelDot key={name} color={name} />
        ))}
      </PreviewGroup>
      <PreviewGroup title="Label · small, medium, large, long name truncates">
        <Label name="api" color="blue" size="small" />
        <Label name="api" color="blue" size="medium" />
        <Label name="api" color="blue" size="large" />
        <div className="w-[120px]">
          <Label name="infrastructure-and-deployment" color="slate" />
        </div>
      </PreviewGroup>
      <PreviewGroup title="Label chip · plain, removable">
        <LabelChip name="api" color="blue" />
        {chips.map((chip) => (
          <LabelChip
            key={chip}
            name={chip}
            color={chip}
            onRemove={() =>
              setChips((current) => current.filter((c) => c !== chip))
            }
            removeLabel={`Remove ${chip}`}
          />
        ))}
      </PreviewGroup>
      <PreviewGroup
        title={`Swatch · radio group, arrow keys move, selected ${color}`}
      >
        <SwatchGroup
          aria-label="Label color"
          value={color}
          onValueChange={setColor}
        >
          {LABEL_COLORS.map((name) => (
            <Swatch key={name} color={name} label={title(name)} />
          ))}
        </SwatchGroup>
      </PreviewGroup>
      <PreviewGroup title="Label row · default (touch on phones), last without divider, long name">
        <div className="w-[480px] max-w-full">
          <LabelRow
            name="api"
            color="blue"
            editLabel="Edit api"
            deleteLabel="Delete api"
            onEdit={() => {}}
            onDelete={() => {}}
          />
          <LabelRow
            name="a-label-with-a-very-long-name-that-has-to-truncate-in-the-row"
            color="olive"
            editLabel="Edit label"
            deleteLabel="Delete label"
            onEdit={() => {}}
            onDelete={() => {}}
            hasDivider={false}
          />
        </div>
      </PreviewGroup>
    </PreviewSection>
  )
}
