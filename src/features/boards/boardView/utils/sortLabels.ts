import type { CardLabel } from '../types'

const folded = (name: string) => name.toLocaleLowerCase('en-US')

/** Labels sorted by case-folded name, as shared `domain-card` › Card labels are a set sorted by name. */
export function sortLabels(labels: readonly CardLabel[]): CardLabel[] {
  return [...labels].sort((a, b) => {
    const left = folded(a.name)
    const right = folded(b.name)
    return left < right ? -1 : left > right ? 1 : 0
  })
}
