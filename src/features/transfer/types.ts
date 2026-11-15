export type ExportResult =
  | { ok: true; file: Blob; contentDisposition: string | null }
  | { ok: false; error: 'notFound' | 'other' }

export type ImportError =
  /** 413 */
  | { kind: 'tooLarge' }
  /** 422 */
  | { kind: 'invalidFile' }
  /** 409 with the field error key/ALREADY_USED */
  | { kind: 'keyUsed' }
  /** 400 with a field error for key */
  | { kind: 'keyInvalid'; code: string; min?: number; max?: number }
  /** Network failure, 5xx, 415 and unknown codes */
  | { kind: 'other' }

export type ImportResult =
  | { ok: true; board: { name: string; key: string } }
  | { ok: false; error: ImportError }

/** Exports a board. Provided by the app layer. */
export type ExportBoard = (boardId: string) => Promise<ExportResult>

/** Uploads an export file as a new board, with a new key after a clash. Provided by the app layer. */
export type ImportBoard = (file: File, key?: string) => Promise<ImportResult>
