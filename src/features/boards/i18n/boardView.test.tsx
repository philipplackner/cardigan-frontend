import i18next from 'i18next'
import { describe, expect, it } from 'vitest'

const t = i18next.getFixedT('en', 'boardView')

describe('boardView translations', () => {
  it('pluralizes card counts', () => {
    expect(t('cardCount', { count: 1 })).toBe('1 card')
    expect(t('cardCount', { count: 12 })).toBe('12 cards')
    expect(t('subtitle', { key: 'CRD', cards: '12 cards' })).toBe(
      'CRD · 12 cards',
    )
  })

  it('uses the shorter delete column text for an empty column', () => {
    expect(t('deleteColumn.body', { count: 0 })).toBe('This can’t be undone.')
    expect(t('deleteColumn.submit', { count: 0 })).toBe('Delete column')
    expect(t('deleteColumn.body', { count: 1 })).toBe(
      'Its 1 card will be deleted too. This can’t be undone.',
    )
    expect(t('deleteColumn.submit', { count: 1 })).toBe(
      'Delete column and 1 card',
    )
    expect(t('deleteColumn.body', { count: 2 })).toBe(
      'Its 2 cards will be deleted too. This can’t be undone.',
    )
    expect(t('deleteColumn.submit', { count: 2 })).toBe(
      'Delete column and 2 cards',
    )
  })

  it('keeps curly quotes and apostrophes as in Figma and the proposal', () => {
    expect(t('deleteColumn.title', { name: 'Review' })).toBe(
      'Delete column “Review”?',
    )
    expect(t('loadError.title')).toBe('Couldn’t load this board')
    expect(t('discardInline.cardBody', { column: 'To do' })).toBe(
      'The card you started in “To do” hasn’t been added.',
    )
    expect(t('moveColumn.stale', { name: 'Review' })).toBe(
      "Couldn't move “Review”. The board changed on another device, so it was reloaded.",
    )
    expect(t('columnGone', { name: 'Review' })).toBe(
      '“Review” no longer exists. The board was reloaded.',
    )
  })

  it('does not escape names', () => {
    expect(t('columnActions', { name: 'R&D <x>' })).toBe(
      'Actions for column “R&D <x>”',
    )
  })
})
