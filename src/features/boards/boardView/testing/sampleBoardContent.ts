import type { BoardColumn, CardLabel } from '../types'

/** The ID of "Cardigan v1", the board the Figma board view frames show. */
export const CARDIGAN_BOARD_ID = '00000000-0000-4000-8000-000000000001'

const label = (id: number, name: string, color: CardLabel['color']) => ({
  id: `30000000-0000-4000-8000-${String(id).padStart(12, '0')}`,
  name,
  color,
})

const API = label(1, 'api', 'blue')
const INFRA = label(2, 'infra', 'amber')
const WEB = label(3, 'web', 'teal')
const MOBILE = label(4, 'mobile', 'violet')
const DESIGN = label(5, 'design', 'pink')
const BUG = label(6, 'bug', 'red')
const DOCS = label(7, 'docs', 'slate')

const columnId = (n: number) =>
  `20000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const cardId = (n: number) =>
  `40000000-0000-4000-8000-${String(n).padStart(12, '0')}`

const card = (number: number, title: string, labels: CardLabel[]) => ({
  id: cardId(number),
  number,
  title,
  labels,
})

const column = (
  n: number,
  name: string,
  cards: ReturnType<typeof card>[],
): BoardColumn => ({
  id: columnId(n),
  name,
  position: n - 1,
  cards: cards.map((c, position) => ({ ...c, position })),
})

/** The columns and cards of "Cardigan v1" in the Figma frame "Board · Desktop 1440" on page 9:6. */
export const cardiganColumns: readonly BoardColumn[] = [
  column(1, 'To do', [
    card(118, 'Decide card ordering: fractional ranks vs. integer positions', [
      API,
    ]),
    card(121, 'Define export file format v1', [API, INFRA]),
    card(124, 'Empty state for the board list', [WEB, MOBILE, DESIGN]),
    card(127, 'Refresh token transport on web', [WEB, API]),
  ]),
  column(2, 'In progress', [
    card(109, 'Single-flight token refresh in the Ktor client', [MOBILE, API]),
    card(112, 'Column menu with move left and right', [WEB]),
    card(115, 'Long-press drag with auto-scroll between columns', [MOBILE]),
  ]),
  column(3, 'Review', [
    card(104, 'Import fails on a board with an empty column', [API, BUG]),
    card(106, 'Reverse proxy and TLS on the VPS', [INFRA]),
  ]),
  column(4, 'Done', [
    card(101, 'First draft of the REST contract', [API, DOCS]),
    card(102, 'CMP project scaffolding with CI', [MOBILE, INFRA]),
    card(103, 'React and TypeScript scaffold', [WEB]),
  ]),
]

/** The columns every new board starts with (`newBoardDialog.columnsNote`). */
export const DEFAULT_COLUMN_NAMES = ['To do', 'In progress', 'Done'] as const
