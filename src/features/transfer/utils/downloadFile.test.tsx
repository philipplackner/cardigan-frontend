import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadFile } from './downloadFile'

describe('downloadFile', () => {
  const clicked: { href: string; download: string; connected: boolean }[] = []

  beforeEach(() => {
    vi.useFakeTimers()
    clicked.length = 0
    URL.createObjectURL = vi.fn(() => 'blob:fake-url')
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push({
        href: this.href,
        download: this.download,
        connected: this.isConnected,
      })
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('clicks an attached anchor with the blob URL and the file name, then removes it', () => {
    const file = new Blob(['{}'])

    downloadFile(file, 'CRD-2026-11-04.json')

    expect(URL.createObjectURL).toHaveBeenCalledWith(file)
    expect(clicked).toEqual([
      {
        href: 'blob:fake-url',
        download: 'CRD-2026-11-04.json',
        connected: true,
      },
    ])
    expect(document.querySelector('a')).toBeNull()
  })

  it('revokes the URL after 60 seconds, not before', () => {
    downloadFile(new Blob(['{}']), 'a.json')

    vi.advanceTimersByTime(59_999)
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:fake-url')
  })
})
