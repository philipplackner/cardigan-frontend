import { describe, expect, it, vi } from 'vitest'
import { checkExportFile } from './checkExportFile'

const HEADER = { format: 'cardigan.board', formatVersion: 1 }

function jsonFile(content: unknown, name = 'board.json') {
  return new File([JSON.stringify(content)], name)
}

function paddedExport(size: number) {
  const base = JSON.stringify({ ...HEADER, pad: '' })
  const json = base.replace(
    '"pad":""',
    `"pad":"${'x'.repeat(size - base.length)}"`,
  )
  return new File([json], 'big.json')
}

describe('checkExportFile', () => {
  it('accepts a valid export of exactly 5,242,880 bytes', async () => {
    const file = paddedExport(5_242_880)

    expect(file.size).toBe(5_242_880)
    expect(await checkExportFile(file)).toEqual({ ok: true })
  })

  it('rejects 5,242,881 bytes as too large without reading it', async () => {
    const file = paddedExport(5_242_881)
    const text = vi.spyOn(file, 'text')

    expect(await checkExportFile(file)).toEqual({
      ok: false,
      reason: 'tooLarge',
    })
    expect(text).not.toHaveBeenCalled()
  })

  it.each([
    [
      'not JSON',
      new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'image.json'),
    ],
    ['an empty file', new File([], 'empty.json')],
    ['a JSON array', jsonFile([HEADER])],
    ['null', jsonFile(null)],
    ['a string', jsonFile('cardigan.board')],
    ['a wrong format', jsonFile({ ...HEADER, format: 'trello.board' })],
    ['no format', jsonFile({ formatVersion: 1 })],
    ['formatVersion 2', jsonFile({ ...HEADER, formatVersion: 2 })],
    ['formatVersion "1"', jsonFile({ ...HEADER, formatVersion: '1' })],
    ['no formatVersion', jsonFile({ format: 'cardigan.board' })],
  ])('rejects %s as an invalid file', async (_, file) => {
    expect(await checkExportFile(file)).toEqual({
      ok: false,
      reason: 'invalidFile',
    })
  })

  it('accepts a valid export with a UTF-8 BOM', async () => {
    const file = new File([`﻿${JSON.stringify(HEADER)}`], 'bom.json')

    expect(await checkExportFile(file)).toEqual({ ok: true })
  })

  it('leaves invalid content to the backend', async () => {
    const file = jsonFile({ ...HEADER, board: { name: 'x'.repeat(10_000) } })

    expect(await checkExportFile(file)).toEqual({ ok: true })
  })
})
