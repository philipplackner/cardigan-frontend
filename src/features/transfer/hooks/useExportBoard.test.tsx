import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/core/ui'
import type { ExportBoard, ExportResult } from '../types'
import { useExportBoard } from './useExportBoard'

const BOARD = { id: 'b1', name: 'Cardigan v1' }

function Host({ exportBoard }: { exportBoard: ExportBoard }) {
  const { start, dialog } = useExportBoard({ exportBoard })
  return (
    <>
      <button type="button" onClick={() => void start(BOARD)}>
        Export as JSON
      </button>
      {dialog}
    </>
  )
}

function renderHost(exportBoard: ExportBoard) {
  render(
    <ToastProvider closeLabel="Close">
      <Host exportBoard={exportBoard} />
    </ToastProvider>,
  )
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

const downloads: string[] = []

beforeEach(() => {
  downloads.length = 0
  URL.createObjectURL = vi.fn(() => 'blob:fake-url')
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    downloads.push(this.download)
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useExportBoard', () => {
  it('shows the progress dialog while exporting, then downloads with the response name and confirms', async () => {
    const user = userEvent.setup()
    const pending = deferred<ExportResult>()
    const exportBoard = vi.fn(() => pending.promise)
    renderHost(exportBoard)

    await user.click(screen.getByRole('button', { name: 'Export as JSON' }))

    const dialog = await screen.findByRole('dialog', {
      name: 'Exporting “Cardigan v1”',
    })
    expect(dialog).toHaveTextContent(
      'When the file is ready, the browser downloads it.',
    )
    expect(dialog).not.toHaveTextContent(/share sheet/)
    expect(exportBoard).toHaveBeenCalledExactlyOnceWith('b1')

    pending.resolve({
      ok: true,
      file: new Blob(['{}']),
      contentDisposition: 'attachment; filename="CRD-2026-11-04.json"',
    })

    expect(
      await screen.findByText('“Cardigan v1” exported.'),
    ).toBeInTheDocument()
    expect(downloads).toEqual(['CRD-2026-11-04.json'])
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('keeps the progress dialog open on Escape', async () => {
    const user = userEvent.setup()
    renderHost(() => new Promise(() => {}))

    await user.click(screen.getByRole('button', { name: 'Export as JSON' }))
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')

    expect(
      screen.getByRole('dialog', { name: 'Exporting “Cardigan v1”' }),
    ).toBeInTheDocument()
  })

  it('shows the no-longer-exists toast on 404 and downloads nothing', async () => {
    const user = userEvent.setup()
    renderHost(async () => ({ ok: false, error: 'notFound' }))

    await user.click(screen.getByRole('button', { name: 'Export as JSON' }))

    expect(
      await screen.findByText(
        "“Cardigan v1” no longer exists, so it can't be exported.",
      ),
    ).toBeInTheDocument()
    expect(downloads).toEqual([])
  })

  it.each([
    [
      'fails',
      async (): Promise<ExportResult> => ({ ok: false, error: 'other' }),
    ],
    [
      'throws',
      async (): Promise<ExportResult> =>
        Promise.reject(new TypeError('Failed to fetch')),
    ],
  ])(
    'shows the generic error toast when the export %s',
    async (_, exportBoard) => {
      const user = userEvent.setup()
      renderHost(exportBoard)

      await user.click(screen.getByRole('button', { name: 'Export as JSON' }))

      expect(
        await screen.findByText(
          "Couldn't export “Cardigan v1”. Check your connection and try again.",
        ),
      ).toBeInTheDocument()
      expect(downloads).toEqual([])
    },
  )
})
