import { describe, expect, it } from 'vitest'
import { exportFileName } from './exportFileName'

const exportFile = (content: unknown) => new Blob([JSON.stringify(content)])
const validFile = exportFile({
  board: { key: 'CRD' },
  exportedAt: '2026-11-04T23:30:00Z',
})

describe('exportFileName', () => {
  it('uses the quoted file name from the header', async () => {
    expect(
      await exportFileName(
        'attachment; filename="CRD-2026-11-04.json"',
        validFile,
      ),
    ).toBe('CRD-2026-11-04.json')
  })

  it('uses an unquoted file name from the header', async () => {
    expect(
      await exportFileName(
        'attachment; filename=GARD-2026-01-02.json',
        validFile,
      ),
    ).toBe('GARD-2026-01-02.json')
  })

  it('prefers the UTF-8 file name over the plain one', async () => {
    const header = `attachment; filename="fallback.json"; filename*=UTF-8''K%C3%84Y-2026-11-04.json`

    expect(await exportFileName(header, validFile)).toBe('KÄY-2026-11-04.json')
  })

  it('falls back to the plain name when the UTF-8 name is malformed', async () => {
    const header = `attachment; filename*=UTF-8''%E0%A4%A; filename="CRD-2026-11-04.json"`

    expect(await exportFileName(header, validFile)).toBe('CRD-2026-11-04.json')
  })

  it('builds the name from the key and the UTC date when the header is missing', async () => {
    expect(new Date('2026-11-04T23:30:00Z').getDate()).toBe(5)

    expect(await exportFileName(null, validFile)).toBe('CRD-2026-11-04.json')
  })

  it('falls back to the file when the header has no file name', async () => {
    expect(await exportFileName('attachment', validFile)).toBe(
      'CRD-2026-11-04.json',
    )
    expect(await exportFileName('attachment; filename=""', validFile)).toBe(
      'CRD-2026-11-04.json',
    )
  })

  it('strips path separators and control characters', async () => {
    expect(
      await exportFileName(
        'attachment; filename="../etc\\pa\u0007sswd.json"',
        validFile,
      ),
    ).toBe('..etcpasswd.json')
    expect(
      await exportFileName(
        null,
        exportFile({
          board: { key: '../CRD' },
          exportedAt: '2026-11-04T10:00:00Z',
        }),
      ),
    ).toBe('..CRD-2026-11-04.json')
  })

  it.each([
    ['not JSON', new Blob(['nope'])],
    ['no key', exportFile({ board: {}, exportedAt: '2026-11-04T10:00:00Z' })],
    ['no exportedAt', exportFile({ board: { key: 'CRD' } })],
    [
      'an invalid exportedAt',
      exportFile({ board: { key: 'CRD' }, exportedAt: 'yesterday' }),
    ],
    [
      'a key of only separators',
      exportFile({ board: { key: '//' }, exportedAt: '2026-11-04T10:00:00Z' }),
    ],
    ['null', exportFile(null)],
  ])('uses board-export.json for a file with %s', async (_, file) => {
    expect(await exportFileName(null, file)).toBe('board-export.json')
  })
})
