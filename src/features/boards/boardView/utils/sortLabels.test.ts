import { describe, expect, it } from 'vitest'
import type { CardLabel } from '../types'
import { sortLabels } from './sortLabels'

const label = (name: string): CardLabel => ({
  id: name,
  name,
  color: 'blue',
})
const names = (labels: CardLabel[]) => labels.map((each) => each.name)

describe('sortLabels', () => {
  it('ignores case', () => {
    expect(names(sortLabels(['beta', 'Gamma', 'Alpha'].map(label)))).toEqual([
      'Alpha',
      'beta',
      'Gamma',
    ])
  })

  it('compares lowercase names, so an underscore sorts before letters', () => {
    expect(names(sortLabels(['ab', 'a_'].map(label)))).toEqual(['a_', 'ab'])
  })

  it.each([[['Bug', 'bug']], [['bug', 'Bug']]])(
    'keeps the given order of names that differ only in case: %j',
    (given) => {
      expect(names(sortLabels(given.map(label)))).toEqual(given)
    },
  )

  it('does not change the given array', () => {
    const given = Object.freeze(['b', 'a'].map(label))

    expect(names(sortLabels(given))).toEqual(['a', 'b'])
    expect(names([...given])).toEqual(['b', 'a'])
  })
})
