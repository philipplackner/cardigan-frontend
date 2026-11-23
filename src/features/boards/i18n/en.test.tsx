import i18next from 'i18next'
import { describe, expect, it } from 'vitest'

const t = i18next.getFixedT('en', 'boards')

describe('boards translations', () => {
  it('pluralizes counts with en-US digit grouping', () => {
    expect(t('boardCount', { count: 0 })).toBe('0 boards')
    expect(t('boardCount', { count: 1 })).toBe('1 board')
    expect(t('boardCount', { count: 14 })).toBe('14 boards')
    expect(t('cardCount', { count: 1 })).toBe('1 card')
    expect(t('cardCount', { count: 1234 })).toBe('1,234 cards')
  })

  it('pluralizes relative times', () => {
    expect(t('relativeTime.minutes', { count: 1 })).toBe('1 minute ago')
    expect(t('relativeTime.hours', { count: 2 })).toBe('2 hours ago')
  })

  it('uses the shorter delete text for a board without cards', () => {
    expect(t('deleteDialog.body', { count: 0 })).toBe('This can’t be undone.')
    expect(t('deleteDialog.body', { count: 1 })).toBe(
      'Its 1 card will be deleted too. This can’t be undone.',
    )
    expect(t('deleteDialog.body', { count: 12 })).toBe(
      'Its 12 cards will be deleted too. This can’t be undone.',
    )
  })

  it('keeps curly quotes, the ’ apostrophe and the en dash', () => {
    expect(t('boardActions', { name: 'Cardigan v1' })).toBe(
      'Actions for board “Cardigan v1”',
    )
    expect(t('newBoardDialog.keyHint', { key: 'GARD' })).toBe(
      '2–5 uppercase letters. Card IDs will look like GARD-1. The key can’t be changed later.',
    )
    expect(t('newBoardDialog.keyHintEmpty')).toBe(
      '2–5 uppercase letters. The key can’t be changed later.',
    )
    expect(t('deleteDialog.failed', { name: 'R&D <x>' })).toBe(
      'Couldn’t delete “R&D <x>”. Check your connection and try again.',
    )
  })
})
