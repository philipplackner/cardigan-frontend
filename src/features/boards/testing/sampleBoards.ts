import type { BoardSummary } from '../types'

/** A board as the in-memory data access stores it. The server keeps `createdAt` for the list order. */
export type StoredBoard = BoardSummary & { createdAt: Date }

/** The time the Figma frames show, so the sample boards read "2 hours ago", "Yesterday", "Oct 9" and so on. */
export const sampleNow = new Date('2026-10-14T15:00:00+02:00')

/** The 14 boards from the Figma board list frames, in list order. The first 6 are the 6-board frames. */
export const sampleBoards: readonly StoredBoard[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Cardigan v1',
    key: 'CRD',
    cardCount: 12,
    createdAt: new Date('2026-01-28T09:00:00+01:00'),
    updatedAt: new Date('2026-10-14T13:00:00+02:00'),
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    name: 'Raytracer',
    key: 'RAY',
    cardCount: 23,
    createdAt: new Date('2026-01-27T09:00:00+01:00'),
    updatedAt: new Date('2026-10-13T18:20:00+02:00'),
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    name: 'Conference talk',
    key: 'TALK',
    cardCount: 7,
    createdAt: new Date('2026-01-26T09:00:00+01:00'),
    updatedAt: new Date('2026-10-09T11:05:00+02:00'),
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    name: 'Home server',
    key: 'HOME',
    cardCount: 9,
    createdAt: new Date('2026-01-25T09:00:00+01:00'),
    updatedAt: new Date('2026-09-30T21:40:00+02:00'),
  },
  {
    id: '00000000-0000-4000-8000-000000000005',
    name: 'Dotfiles cleanup',
    key: 'DOT',
    cardCount: 4,
    createdAt: new Date('2026-01-24T09:00:00+01:00'),
    updatedAt: new Date('2026-09-28T09:15:00+02:00'),
  },
  {
    id: '00000000-0000-4000-8000-000000000006',
    name: 'Reading list',
    key: 'READ',
    cardCount: 15,
    createdAt: new Date('2026-01-23T09:00:00+01:00'),
    updatedAt: new Date('2026-08-30T16:30:00+02:00'),
  },
  {
    id: '00000000-0000-4000-8000-000000000007',
    name: 'Garden irrigation',
    key: 'GARD',
    cardCount: 6,
    createdAt: new Date('2026-01-22T09:00:00+01:00'),
    updatedAt: new Date('2026-08-21T08:45:00+02:00'),
  },
  {
    id: '00000000-0000-4000-8000-000000000008',
    name: 'Bike repairs',
    key: 'BIKE',
    cardCount: 3,
    createdAt: new Date('2026-01-21T09:00:00+01:00'),
    updatedAt: new Date('2026-08-14T19:10:00+02:00'),
  },
  {
    id: '00000000-0000-4000-8000-000000000009',
    name: 'Thesis notes',
    key: 'THES',
    cardCount: 31,
    createdAt: new Date('2026-01-20T09:00:00+01:00'),
    updatedAt: new Date('2026-07-30T14:00:00+02:00'),
  },
  {
    id: '00000000-0000-4000-8000-000000000010',
    name: 'Recipe app',
    key: 'RCP',
    cardCount: 18,
    createdAt: new Date('2026-01-19T09:00:00+01:00'),
    updatedAt: new Date('2026-07-22T12:30:00+02:00'),
  },
  {
    id: '00000000-0000-4000-8000-000000000011',
    name: 'Advent of Code',
    key: 'AOC',
    cardCount: 25,
    createdAt: new Date('2026-01-18T09:00:00+01:00'),
    updatedAt: new Date('2026-07-03T07:50:00+02:00'),
  },
  {
    id: '00000000-0000-4000-8000-000000000012',
    name: 'Blog posts',
    key: 'BLOG',
    cardCount: 11,
    createdAt: new Date('2026-01-17T09:00:00+01:00'),
    updatedAt: new Date('2026-06-19T20:25:00+02:00'),
  },
  {
    id: '00000000-0000-4000-8000-000000000013',
    name: 'Kotlin course',
    key: 'KOT',
    cardCount: 14,
    createdAt: new Date('2026-01-16T09:00:00+01:00'),
    updatedAt: new Date('2026-06-02T10:00:00+02:00'),
  },
  {
    id: '00000000-0000-4000-8000-000000000014',
    name: 'Tax return 2026',
    key: 'TAX',
    cardCount: 5,
    createdAt: new Date('2026-01-15T09:00:00+01:00'),
    updatedAt: new Date('2026-05-27T17:35:00+02:00'),
  },
]
