import { describe, expect, it } from 'vitest'
import { nameErrorMessageKey } from '../../utils/boardName'
import { checkCardTitle, checkColumnName } from './limits'

describe('column name and card title limits', () => {
  it.each([
    ['column name', checkColumnName, 30],
    ['card title', checkCardTitle, 200],
  ])('accepts a %s at its limit and rejects one more', (_, check, max) => {
    expect(check('a'.repeat(max)).error).toBeNull()
    expect(check('a'.repeat(max + 1)).error).toBe('TOO_LONG')
    expect(nameErrorMessageKey('TOO_LONG')).toBe('nameErrors.tooLong')
  })

  it('counts code points, so astral characters at the limit pass', () => {
    expect(checkColumnName('😀'.repeat(30)).error).toBeNull()
    expect(checkColumnName('😀'.repeat(31)).error).toBe('TOO_LONG')
    expect(checkCardTitle('😀'.repeat(200)).error).toBeNull()
    expect(checkCardTitle('😀'.repeat(201)).error).toBe('TOO_LONG')
  })

  it('counts the normalized text, so surrounding spaces do not count', () => {
    expect(checkColumnName(`  ${'a'.repeat(30)}  `)).toEqual({
      value: 'a'.repeat(30),
      error: null,
    })
  })

  it('maps empty and line breaks to the name messages', () => {
    expect(nameErrorMessageKey(checkCardTitle('   ').error!)).toBe(
      'nameErrors.required',
    )
    expect(nameErrorMessageKey(checkCardTitle('Fix\nlogin').error!)).toBe(
      'nameErrors.invalidCharacter',
    )
  })
})
