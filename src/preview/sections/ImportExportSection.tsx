import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DownloadIcon,
  DropZone,
  FileRow,
  IconButton,
  LabelIcon,
  LogOutIcon,
  Menu,
  MenuDivider,
  MenuItem,
  MoreIcon,
  RenameIcon,
  TrashIcon,
  UploadIcon,
} from '@/core/ui'
import {
  ImportTrigger,
  useExportBoard,
  useImportFlow,
  type ExportResult,
  type ImportBoard,
  type ImportResult,
} from '@/features/transfer'
import { PreviewGroup, PreviewSection } from '../PreviewSection'

const DELAY_MS = 1500

type ExportOutcome = 'success' | 'noHeader' | 'notFound' | 'other'

const EXPORT_FILE = new Blob(
  [
    JSON.stringify({
      format: 'cardigan.board',
      formatVersion: 1,
      exportedAt: '2026-11-04T23:30:00Z',
      board: { key: 'CRD', name: 'Cardigan v1' },
    }),
  ],
  { type: 'application/json' },
)

function fakeExport(outcome: ExportOutcome): Promise<ExportResult> {
  const result: ExportResult =
    outcome === 'success'
      ? {
          ok: true,
          file: EXPORT_FILE,
          contentDisposition: 'attachment; filename="CRD-2026-11-04.json"',
        }
      : outcome === 'noHeader'
        ? { ok: true, file: EXPORT_FILE, contentDisposition: null }
        : { ok: false, error: outcome }
  return new Promise((resolve) => setTimeout(() => resolve(result), DELAY_MS))
}

function OutcomePicker<T extends string>({
  name,
  options,
  value,
  onChange,
}: {
  name: string
  options: readonly T[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="flex flex-wrap gap-12 type-body">
      <legend className="sr-only">{name}</legend>
      {options.map((option) => (
        <label key={option} className="flex items-center gap-4">
          <input
            type="radio"
            name={name}
            checked={value === option}
            onChange={() => onChange(option)}
          />
          {option}
        </label>
      ))}
    </fieldset>
  )
}

function ExportDemo() {
  const { t } = useTranslation('transfer')
  const [outcome, setOutcome] = useState<ExportOutcome>('success')
  const { start, dialog } = useExportBoard({
    exportBoard: () => fakeExport(outcome),
  })

  return (
    <div className="flex flex-col gap-12">
      <OutcomePicker
        name="Export outcome"
        options={['success', 'noHeader', 'notFound', 'other'] as const}
        value={outcome}
        onChange={setOutcome}
      />
      <Menu
        trigger={<IconButton icon={MoreIcon} label="Board menu" />}
        align="start"
      >
        <MenuItem label="Rename board" icon={RenameIcon} />
        <MenuItem
          label={t('export.menuItem')}
          icon={DownloadIcon}
          onSelect={() => void start({ id: 'b1', name: 'Cardigan v1' })}
        />
        <MenuDivider />
        <MenuItem label="Delete board" icon={TrashIcon} variant="danger" />
      </Menu>
      {dialog}
    </div>
  )
}

type ImportOutcome = 'success' | 'tooLarge' | 'invalidFile' | 'other'

const IMPORT_OUTCOMES = ['success', 'tooLarge', 'invalidFile', 'other'] as const

function fakeImport(outcome: ImportOutcome): ImportBoard {
  return () => {
    const result: ImportResult =
      outcome === 'success'
        ? { ok: true, board: { name: 'Cardigan v1', key: 'CRD' } }
        : { ok: false, error: { kind: outcome } }
    return new Promise((resolve) => setTimeout(() => resolve(result), DELAY_MS))
  }
}

const findBoardNameByKey = (key: string) =>
  key === 'CRD' ? 'Cardigan v1' : undefined

function ImportDemo() {
  const { t } = useTranslation('transfer')
  const [outcome, setOutcome] = useState<ImportOutcome>('success')
  const [reloads, setReloads] = useState(0)
  const params = {
    importBoard: fakeImport(outcome),
    findBoardNameByKey,
    onBoardsChanged: () => setReloads((count) => count + 1),
  }
  const menuFlow = useImportFlow(params)

  return (
    <div className="flex flex-col gap-12">
      <OutcomePicker
        name="Import outcome"
        options={IMPORT_OUTCOMES}
        value={outcome}
        onChange={setOutcome}
      />
      <p className="type-body text-text-muted">Board list reloads: {reloads}</p>
      <div className="flex items-center gap-12">
        <ImportTrigger {...params} />
        <Menu
          trigger={<IconButton icon={MoreIcon} label="Board list menu" />}
          align="start"
        >
          <MenuItem
            label={t('import.menuItem')}
            icon={UploadIcon}
            onSelect={menuFlow.open}
          />
          <MenuItem label="Labels" icon={LabelIcon} />
          <MenuDivider />
          <MenuItem label="Log out" icon={LogOutIcon} />
        </Menu>
      </div>
      {menuFlow.dialogs}
    </div>
  )
}

export function ImportExportSection() {
  const [received, setReceived] = useState<string>('nothing yet')

  return (
    <PreviewSection title="Import & export">
      <PreviewGroup title="File row · long name truncates">
        <div className="flex w-[380px] flex-col gap-8">
          <FileRow name="board-backup.json" sizeText="14 KB" />
          <FileRow
            name="cardigan-v1-full-export-2026-11-15-with-a-very-long-name.json"
            sizeText="1.2 MB"
          />
        </div>
      </PreviewGroup>
      <PreviewGroup
        title={`Drop zone · drag a file over, drop it, or browse · received: ${received}`}
      >
        <div className="w-[380px]">
          <DropZone
            title="Drop a board export here"
            overTitle="Release to import"
            hintPrefix="or "
            browseLabel="browse files"
            accept=".json,application/json"
            onFiles={(files) =>
              setReceived(
                files.map((file) => `${file.name} (${file.size} B)`).join(', '),
              )
            }
          />
        </div>
      </PreviewGroup>
      <PreviewGroup title="Import · header button and phone menu item · fake request takes 1.5 s">
        <ImportDemo />
      </PreviewGroup>
      <PreviewGroup title="Export · board menu → Export as JSON · fake request takes 1.5 s">
        <ExportDemo />
      </PreviewGroup>
    </PreviewSection>
  )
}
