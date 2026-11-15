import { MAX_IMPORT_BYTES } from './limits'

export type ExportFileCheck =
  /** `boardKey` is the file's key if it has one, used to prefill the key after a clash. */
  | { ok: true; boardKey?: string }
  | { ok: false; reason: 'tooLarge' | 'invalidFile' }

const BOM = '\uFEFF'

function hasExportHeader(value: unknown) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  const header = value as Record<string, unknown>
  return header.format === 'cardigan.board' && header.formatVersion === 1
}

/** Checks size, JSON and format header only. Everything else is the backend's job. */
export async function checkExportFile(file: File): Promise<ExportFileCheck> {
  if (file.size > MAX_IMPORT_BYTES) return { ok: false, reason: 'tooLarge' }

  let parsed: unknown
  try {
    const text = await file.text()
    parsed = JSON.parse(text.startsWith(BOM) ? text.slice(1) : text)
  } catch {
    return { ok: false, reason: 'invalidFile' }
  }
  if (!hasExportHeader(parsed)) return { ok: false, reason: 'invalidFile' }
  const key = (parsed as { board?: { key?: unknown } }).board?.key
  return typeof key === 'string' ? { ok: true, boardKey: key } : { ok: true }
}
