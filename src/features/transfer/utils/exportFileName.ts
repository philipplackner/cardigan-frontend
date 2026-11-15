const FALLBACK_NAME = 'board-export.json'

function sanitize(name: string) {
  // oxlint-disable-next-line no-control-regex -- control characters are exactly what gets removed
  return name.replace(/[/\\\u0000-\u001f\u007f]/g, '').trim()
}

function nameFromHeader(contentDisposition: string | null) {
  if (!contentDisposition) return ''
  const extended = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(contentDisposition)
  if (extended?.[1]) {
    try {
      const name = sanitize(decodeURIComponent(extended[1].trim()))
      if (name) return name
    } catch {
      // Malformed percent-encoding: fall through to the plain filename.
    }
  }
  const plain = /filename\s*=\s*(?:"([^"]*)"|([^;]+))/i.exec(contentDisposition)
  return sanitize(plain?.[1] ?? plain?.[2] ?? '')
}

function utcDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

async function nameFromFile(file: Blob) {
  try {
    const content = JSON.parse(await file.text()) as {
      board?: { key?: unknown }
      exportedAt?: unknown
    }
    const key = content.board?.key
    const exportedAt = content.exportedAt
    if (typeof key !== 'string' || typeof exportedAt !== 'string') return ''
    const date = new Date(exportedAt)
    if (Number.isNaN(date.getTime())) return ''
    const safeKey = sanitize(key)
    return safeKey ? `${safeKey}-${utcDate(date)}.json` : ''
  } catch {
    return ''
  }
}

/** The response's file name, else `<key>-<UTC date>.json` from the file, else `board-export.json`. */
export async function exportFileName(
  contentDisposition: string | null,
  file: Blob,
) {
  return (
    nameFromHeader(contentDisposition) ||
    (await nameFromFile(file)) ||
    FALLBACK_NAME
  )
}
