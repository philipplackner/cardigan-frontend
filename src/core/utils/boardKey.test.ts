import { describe, expect, it } from 'vitest'
import { checkBoardKey, normalizeKeyInput } from './boardKey'

describe('checkBoardKey', () => {
  it.each([
    ['', 'REQUIRED'],
    ['C', 'TOO_SHORT'],
    ['CRDBXY', 'TOO_LONG'],
    ['CR1', 'INVALID_FORMAT'],
    ['ÄB', 'INVALID_FORMAT'],
    ['C D', 'INVALID_FORMAT'],
  ])('rejects %j with %s', (key, error) => {
    expect(checkBoardKey(key)).toBe(error)
  })

  it.each(['CR', 'CRDBX'])('accepts %j at the length limits', (key) => {
    expect(checkBoardKey(key)).toBeNull()
  })

  it('accepts lowercase input once it is normalized', () => {
    expect(checkBoardKey(normalizeKeyInput('crd'))).toBeNull()
  })

  it('reports the length before the format for a 6-character key with a digit', () => {
    expect(checkBoardKey('CRDBX1')).toBe('TOO_LONG')
  })
})

describe('normalizeKeyInput', () => {
  it('uppercases only ASCII letters', () => {
    expect(normalizeKeyInput('cä')).toBe('Cä')
  })

  it('leaves digits, spaces and uppercase letters as typed', () => {
    expect(normalizeKeyInput('aB 1')).toBe('AB 1')
  })
})
