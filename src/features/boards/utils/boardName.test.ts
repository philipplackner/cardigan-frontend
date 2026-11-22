import { describe, expect, it } from 'vitest'
import common from '@/core/i18n/en/common.json'
import type { TextError } from '@/core/utils/text'
import { checkBoardName, nameErrorMessageKey } from './boardName'

function messageFor(code: string) {
  const [group, key] = nameErrorMessageKey(code).split('.') as [
    'nameErrors',
    keyof typeof common.nameErrors,
  ]
  return common[group][key]
}

describe('checkBoardName', () => {
  it('reports a name of only spaces as empty', () => {
    expect(checkBoardName('   ').error).toBe('EMPTY')
  })

  it('accepts 100 letters surrounded by spaces and returns them trimmed', () => {
    const name = 'a'.repeat(100)

    expect(checkBoardName(`  ${name}  `)).toEqual({ value: name, error: null })
  })

  it('rejects 101 code points', () => {
    expect(checkBoardName('a'.repeat(101)).error).toBe('TOO_LONG')
  })

  it('counts a family emoji as its 5 code points', () => {
    const family = '👨‍👩‍👧'

    expect(checkBoardName(family + 'a'.repeat(95)).error).toBeNull()
    expect(checkBoardName(family + 'a'.repeat(96)).error).toBe('TOO_LONG')
  })

  it.each([
    ['tab', 'Road\tmap'],
    ['line feed', 'Road\nmap'],
    ['carriage return', 'Road\rmap'],
    ['NUL', 'Road\u0000map'],
    ['unpaired surrogate', 'Road\uD800map'],
  ])('rejects a %s', (_, name) => {
    expect(checkBoardName(name).error).toBe('INVALID_CHARACTER')
  })

  it('counts a decomposed é at the limit as one code point after NFC', () => {
    const name = 'a'.repeat(99) + 'é'

    expect(checkBoardName(name)).toEqual({
      value: 'a'.repeat(99) + 'é',
      error: null,
    })
  })
})

describe('nameErrorMessageKey', () => {
  const nameErrors: TextError[] = ['EMPTY', 'TOO_LONG', 'INVALID_CHARACTER']

  it.each(nameErrors)('maps %s to a message', (code) => {
    expect(messageFor(code)).toEqual(expect.any(String))
  })

  it('maps the name checks to their messages', () => {
    expect(messageFor('EMPTY')).toBe('Enter a name.')
    expect(messageFor('TOO_LONG')).toBe('Use at most {{n}} characters.')
    expect(messageFor('INVALID_CHARACTER')).toBe(
      'Use a single line without control characters.',
    )
  })

  it('maps the server codes REQUIRED and an unknown code', () => {
    expect(messageFor('REQUIRED')).toBe('Enter a name.')
    expect(messageFor('NEW_CODE')).toBe(
      'Use a single line without control characters.',
    )
  })
})
