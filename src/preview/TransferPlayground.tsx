import { useState } from 'react'
import { Button, DownloadIcon, Key, PageHeader, UploadIcon } from '@/core/ui'
import {
  useExportBoard,
  useImportFlow,
  type ExportResult,
  type ImportBoard,
  type ImportResult,
} from '@/features/transfer'

const DELAY_MS = 1200

type Board = { id: string; name: string; key: string }

type ImportMode = 'server' | 'tooLarge' | 'invalidFile' | 'other'
type ExportMode = 'success' | 'noHeader' | 'notFound' | 'other'

const IMPORT_MODES: { value: ImportMode; label: string }[] = [
  {
    value: 'server',
    label: 'Like the server: clash if the key exists, else create',
  },
  { value: 'tooLarge', label: '413 Payload too large' },
  { value: 'invalidFile', label: '422 Invalid export file' },
  { value: 'other', label: 'Network error' },
]

const EXPORT_MODES: { value: ExportMode; label: string }[] = [
  { value: 'success', label: 'Success with Content-Disposition' },
  { value: 'noHeader', label: 'Success without Content-Disposition' },
  { value: 'notFound', label: '404 Not found' },
  { value: 'other', label: 'Network error' },
]

const INITIAL_BOARDS: Board[] = [
  { id: 'b1', name: 'Cardigan v1', key: 'CRD' },
  { id: 'b2', name: 'Raytracer', key: 'RAY' },
  { id: 'b3', name: 'Garden irrigation', key: 'GARD' },
]

const wait = <T,>(value: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), DELAY_MS))

function exportFileFor(board: Board) {
  const exportedAt = new Date().toISOString()
  const file = new Blob(
    [
      JSON.stringify(
        {
          format: 'cardigan.board',
          formatVersion: 1,
          exportedAt,
          board: { key: board.key, name: board.name, columns: [], labels: [] },
        },
        null,
        2,
      ),
    ],
    { type: 'application/json' },
  )
  return { file, fileName: `${board.key}-${exportedAt.slice(0, 10)}.json` }
}

async function readBoard(file: File) {
  try {
    const content = JSON.parse((await file.text()).replace(/^﻿/, '')) as {
      board?: { name?: unknown; key?: unknown }
    }
    const name =
      typeof content.board?.name === 'string'
        ? content.board.name
        : 'Imported board'
    const key = typeof content.board?.key === 'string' ? content.board.key : ''
    return { name, key }
  } catch {
    return null
  }
}

function ModePicker<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="flex min-w-[260px] flex-1 flex-col gap-6 rounded-8 border border-border p-12 phone:min-w-full">
      <legend className="px-4 type-sans-12-regular-145 text-text-muted">
        {legend}
      </legend>
      {options.map((option) => (
        <label
          key={option.value}
          className="flex items-center gap-8 type-sans-13-regular-145 text-text-primary"
        >
          <input
            type="radio"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  )
}

/** Dev-only page to try import and export against a fake server that keeps its boards in memory. */
export function TransferPlayground() {
  const [boards, setBoards] = useState(INITIAL_BOARDS)
  const [importMode, setImportMode] = useState<ImportMode>('server')
  const [exportMode, setExportMode] = useState<ExportMode>('success')
  const [log, setLog] = useState<string[]>([])
  const addLog = (line: string) =>
    setLog((lines) =>
      [`${new Date().toLocaleTimeString()}  ${line}`, ...lines].slice(0, 8),
    )

  const importBoard: ImportBoard = async (file, key) => {
    addLog(
      `POST import ${file.name} (${file.size} B)${key ? ` with key ${key}` : ''}`,
    )
    if (importMode !== 'server') {
      return wait<ImportResult>({ ok: false, error: { kind: importMode } })
    }
    const content = await readBoard(file)
    if (!content)
      return wait<ImportResult>({ ok: false, error: { kind: 'invalidFile' } })
    const finalKey = key ?? content.key
    if (!/^[A-Z]{2,5}$/.test(finalKey)) {
      return wait<ImportResult>({
        ok: false,
        error: { kind: 'keyInvalid', code: 'INVALID_FORMAT' },
      })
    }
    if (boards.some((board) => board.key === finalKey)) {
      return wait<ImportResult>({ ok: false, error: { kind: 'keyUsed' } })
    }
    const created = {
      id: crypto.randomUUID(),
      name: content.name,
      key: finalKey,
    }
    setBoards((current) => [...current, created])
    return wait<ImportResult>({
      ok: true,
      board: { name: created.name, key: created.key },
    })
  }

  const { open: openImport, dialogs: importDialogs } = useImportFlow({
    importBoard,
    findBoardNameByKey: (key) =>
      boards.find((board) => board.key === key)?.name,
    onBoardsChanged: () => addLog('onBoardsChanged → board list reloads'),
  })

  const { start: startExport, dialog: exportDialog } = useExportBoard({
    exportBoard: (boardId) => {
      const board = boards.find((candidate) => candidate.id === boardId)
      addLog(`GET export ${board?.key ?? boardId}`)
      if (!board || exportMode === 'notFound') {
        return wait<ExportResult>({ ok: false, error: 'notFound' })
      }
      if (exportMode === 'other')
        return wait<ExportResult>({ ok: false, error: 'other' })
      const { file, fileName } = exportFileFor(board)
      return wait<ExportResult>({
        ok: true,
        file,
        contentDisposition:
          exportMode === 'noHeader'
            ? null
            : `attachment; filename="${fileName}"`,
      })
    },
  })

  return (
    <div className="flex min-h-dvh flex-col bg-background-app">
      <PageHeader
        title="Boards"
        meta={`${boards.length} boards`}
        actions={
          <Button variant="secondary" icon={UploadIcon} onClick={openImport}>
            Import
          </Button>
        }
      />
      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-24 px-20 py-24 phone:px-16">
        <ul className="flex flex-col overflow-hidden rounded-10 border border-border bg-background-surface">
          {boards.map((board) => (
            <li
              key={board.id}
              className="flex min-w-[0] items-center gap-10 border-b border-border px-14 py-10 last:border-b-0"
            >
              <Key value={board.key} />
              <span className="min-w-[0] flex-1 truncate type-sans-14-semibold-145 text-text-primary">
                {board.name}
              </span>
              <Button
                variant="secondary"
                size="small"
                icon={DownloadIcon}
                onClick={() =>
                  void startExport({ id: board.id, name: board.name })
                }
              >
                Export as JSON
              </Button>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-12">
          <ModePicker
            legend="Fake server · import response"
            options={IMPORT_MODES}
            value={importMode}
            onChange={setImportMode}
          />
          <ModePicker
            legend="Fake server · export response"
            options={EXPORT_MODES}
            value={exportMode}
            onChange={setExportMode}
          />
        </div>

        <section className="flex flex-col gap-6">
          <h2 className="type-sans-12-regular-145 text-text-muted">Requests</h2>
          <pre className="min-h-[80px] overflow-x-auto rounded-8 border border-border bg-background-surface p-12 type-mono-12-regular-145 text-text-muted">
            {log.length
              ? log.join('\n')
              : 'Nothing yet. Export a board, then import the file.'}
          </pre>
        </section>
      </main>
      {exportDialog}
      {importDialogs}
    </div>
  )
}
