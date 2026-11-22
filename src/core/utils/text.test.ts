import { describe, expect, it } from 'vitest'
import { checkText, countCodePoints, normalizeText } from './text'

describe('normalizeText', () => {
  it('removes surrounding spaces', () => {
    expect(normalizeText('  Release ', 'singleLine')).toBe('Release')
  })

  it('turns whitespace-only text into an empty string', () => {
    expect(normalizeText(' 　\n', 'multiLine')).toBe('')
  })

  it('turns CRLF and lone CR into LF', () => {
    expect(normalizeText('a\r\nb\rc', 'multiLine')).toBe('a\nb\nc')
  })

  it('composes decomposed characters', () => {
    expect(normalizeText('é', 'singleLine')).toBe('é')
  })

  it('trims U+0085, which JavaScript trim() keeps', () => {
    expect(normalizeText('\u0085a\u0085', 'singleLine')).toBe('a')
  })

  it('keeps U+FEFF, which JavaScript trim() removes', () => {
    expect(normalizeText('﻿a﻿', 'singleLine')).toBe('﻿a﻿')
  })

  it('keeps whitespace inside the text', () => {
    expect(normalizeText(' a 　 b ', 'singleLine')).toBe('a 　 b')
  })

  it('keeps leading and trailing whitespace in passwords', () => {
    expect(normalizeText(' Secret Pass 1 ', 'password')).toBe(' Secret Pass 1 ')
  })

  it('composes passwords so the same visible password matches', () => {
    expect(normalizeText('café', 'password')).toBe(
      normalizeText('café', 'password'),
    )
  })
})

describe('countCodePoints', () => {
  it.each([
    ['an emoji', '\u{1F44D}', 1],
    ['emojis joined by zero-width joiners', '\u{1F468}‍\u{1F469}‍\u{1F467}', 5],
    ['a non-Latin script', '看板', 2],
    ['a line break', 'a\nb', 3],
    ['an empty string', '', 0],
    ['each lone surrogate', 'a\uD83Db\uDC00', 4],
  ])('counts %s as %i', (_, value, expected) => {
    expect(countCodePoints(value)).toBe(expected)
  })

  it('counts the string it is given without normalizing it', () => {
    expect(countCodePoints('é')).toBe(2)
  })
})

describe('checkText', () => {
  it('returns the normalized value', () => {
    expect(checkText('  Roadmap  ', { kind: 'singleLine', max: 100 })).toEqual({
      value: 'Roadmap',
      error: null,
    })
  })

  it('reports whitespace-only text as empty', () => {
    expect(checkText(' 　\n', { kind: 'singleLine', min: 1 }).error).toBe(
      'EMPTY',
    )
  })

  it('reports empty text even without a minimum', () => {
    expect(checkText('', { kind: 'multiLine' }).error).toBe('EMPTY')
  })

  it.each([
    [2, null],
    [1, 'TOO_SHORT'],
  ] as const)('with min 2, a length of %i gives %s', (length, error) => {
    expect(
      checkText('a'.repeat(length), { kind: 'singleLine', min: 2 }).error,
    ).toBe(error)
  })

  it.each([
    [50, null],
    [51, 'TOO_LONG'],
  ] as const)('with max 50, a length of %i gives %s', (length, error) => {
    expect(
      checkText('a'.repeat(length), { kind: 'singleLine', max: 50 }).error,
    ).toBe(error)
  })

  it('accepts text that reaches the limit only after trimming', () => {
    const value = `   ${'a'.repeat(50)}   `

    expect(checkText(value, { kind: 'singleLine', max: 50 }).error).toBeNull()
  })

  it('counts an emoji as one against the maximum', () => {
    expect(
      checkText('\u{1F44D}', { kind: 'singleLine', max: 1 }).error,
    ).toBeNull()
  })

  it('counts a decomposed character as one after composing it', () => {
    expect(checkText('é', { kind: 'singleLine', max: 1 }).error).toBeNull()
  })

  it('counts CRLF as one line break', () => {
    expect(checkText('a\r\nb', { kind: 'multiLine', max: 3 })).toEqual({
      value: 'a\nb',
      error: null,
    })
  })

  it.each([
    ['a tab', 'a\tb'],
    ['a line break', 'a\nb'],
    ['a carriage return', 'a\rb'],
  ])('rejects %s inside a single-line field', (_, value) => {
    expect(checkText(value, { kind: 'singleLine' }).error).toBe(
      'INVALID_CHARACTER',
    )
  })

  it('trims a tab at the edge of a single-line field instead of rejecting it', () => {
    expect(checkText('\tname\n', { kind: 'singleLine' })).toEqual({
      value: 'name',
      error: null,
    })
  })

  it('reports a single tab as empty', () => {
    expect(checkText('\t', { kind: 'singleLine' }).error).toBe('EMPTY')
  })

  it('accepts tabs and line breaks inside a multi-line field', () => {
    expect(checkText('a\tb\nc', { kind: 'multiLine' }).error).toBeNull()
  })

  it.each([
    ['NUL', 'a\u0000b'],
    ['U+001F', 'a\u001Fb'],
  ])('rejects %s in a multi-line field', (_, value) => {
    expect(checkText(value, { kind: 'multiLine' }).error).toBe(
      'INVALID_CHARACTER',
    )
  })

  it('accepts U+007F, which is outside the forbidden range', () => {
    expect(checkText('a\u007Fb', { kind: 'singleLine' }).error).toBeNull()
  })

  it.each([
    ['a high surrogate on its own', '\uD83D'],
    ['a low surrogate inside text', 'a\uDC00b'],
  ])('rejects %s', (_, value) => {
    expect(checkText(value, { kind: 'multiLine' }).error).toBe(
      'INVALID_CHARACTER',
    )
  })

  it('rejects a tab in a password', () => {
    expect(checkText('pass\tword', { kind: 'password' }).error).toBe(
      'INVALID_CHARACTER',
    )
  })

  it('counts leading and trailing spaces toward a password length', () => {
    expect(checkText(' ab ', { kind: 'password', min: 4 })).toEqual({
      value: ' ab ',
      error: null,
    })
  })

  it('reports an invalid character before a length that is too long', () => {
    expect(checkText('a\tbcd', { kind: 'singleLine', max: 2 }).error).toBe(
      'INVALID_CHARACTER',
    )
  })

  it('reports an invalid character before a length that is too short', () => {
    expect(checkText('a\tb', { kind: 'singleLine', min: 10 }).error).toBe(
      'INVALID_CHARACTER',
    )
  })
})
