import { describe, expect, it } from 'vitest'
import { keyFromName } from './keyFromName'

describe('keyFromName', () => {
  it.each([
    ['Garden irrigation', 'GARD'],
    ['Ärger v2', 'ARGE'],
    ['Q3 2026', ''],
    ['A', ''],
    ['ab', 'AB'],
    ['Cardigan v1', 'CARD'],
    ['🚀 Rocket 🚀', 'ROCK'],
    ['看板 Kanban', 'KANB'],
    ['Ølsted', 'LSTE'],
    ['ﬁx', ''],
    ['ılık', 'LK'],
    ['', ''],
  ])('turns %j into %j', (name, key) => {
    expect(keyFromName(name)).toBe(key)
  })
})
