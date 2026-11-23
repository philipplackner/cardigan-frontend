import { QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createQueryClient } from '@/core/api/queryClient'
import {
  AppBarSlotProvider,
  AppBarSlotTarget,
  AppLayout,
  Sidebar,
} from '@/core/ui'
import {
  BoardsDataAccessProvider,
  BoardsNavItem,
  BoardsNavList,
  BoardViewDataAccessProvider,
  BoardViewError,
  BoardViewRoot,
  ClockProvider,
  createInMemoryBoardsDataAccess,
  createInMemoryBoardViewDataAccess,
  sampleBoards,
  sampleNow,
  sidebarAccount,
  type BoardViewErrorKind,
  type BoardViewMethod,
} from '@/features/boards'
import { useExportBoard } from '@/features/transfer'

const DELAY_MS = 600

const params = () => new URLSearchParams(location.search)

type Failure = {
  label: string
  method: BoardViewMethod
  error: BoardViewErrorKind
}

const METHODS: BoardViewMethod[] = [
  'loadBoard',
  'createCard',
  'createColumn',
  'renameColumn',
  'moveColumn',
  'deleteColumn',
]

const FAILURES: Failure[] = [
  ...METHODS.map((method): Failure => ({
    label: `${method}: network`,
    method,
    error: { kind: 'other' },
  })),
  ...METHODS.map((method): Failure => ({
    label: `${method}: 404`,
    method,
    error: { kind: 'notFound' },
  })),
  {
    label: 'moveColumn: OUT_OF_RANGE',
    method: 'moveColumn',
    error: { kind: 'outOfRange' },
  },
  {
    label: 'createCard: field error',
    method: 'createCard',
    error: {
      kind: 'invalid',
      fields: [{ field: 'title', code: 'TOO_LONG', max: 200 }],
    },
  },
  {
    label: 'createColumn: field error',
    method: 'createColumn',
    error: {
      kind: 'invalid',
      fields: [{ field: 'name', code: 'TOO_LONG', max: 30 }],
    },
  },
  {
    label: 'renameColumn: field error',
    method: 'renameColumn',
    error: {
      kind: 'invalid',
      fields: [{ field: 'name', code: 'INVALID_CHARACTER' }],
    },
  },
]

function createPlaygroundDataAccess() {
  const boards = createInMemoryBoardsDataAccess(sampleBoards, {
    delayMs: DELAY_MS,
    now: () => sampleNow,
  })
  const boardView = createInMemoryBoardViewDataAccess(boards, {
    delayMs: DELAY_MS,
  })
  if (params().has('failLoad')) {
    boardView.failNext('loadBoard', { kind: 'other' })
  }
  if (params().has('holdLoad')) boardView.holdNext('loadBoard')
  return { boards, boardView }
}

/** Dev-only: the board view with an in-memory backend, full screen, with a floating control panel. */
export function BoardViewPlayground() {
  const { t } = useTranslation('boards')
  const [queryClient] = useState(createQueryClient)
  const [{ boards, boardView }] = useState(createPlaygroundDataAccess)
  const [boardId, setBoardId] = useState(
    () => params().get('board') ?? sampleBoards[0]!.id,
  )
  const [log, setLog] = useState<string[]>([])
  const [releases, setReleases] = useState<(() => void)[]>([])
  const addLog = (line: string) =>
    setLog((lines) => [line, ...lines].slice(0, 8))
  const boardLink = (id: string) => (
    <button type="button" onClick={() => setBoardId(id)} />
  )
  const { start: startExport, dialog: exportDialog } = useExportBoard({
    exportBoard: async (id) => {
      try {
        const board = await boardView.loadBoard(id)
        const file = new Blob(
          [
            JSON.stringify(
              {
                format: 'cardigan.board',
                formatVersion: 1,
                exportedAt: new Date().toISOString(),
                board: { key: board.key, name: board.name, columns: [] },
              },
              null,
              2,
            ),
          ],
          { type: 'application/json' },
        )
        return {
          ok: true,
          file,
          contentDisposition: `attachment; filename="${board.key}.json"`,
        }
      } catch (error) {
        return {
          ok: false,
          error:
            error instanceof BoardViewError && error.error.kind === 'notFound'
              ? 'notFound'
              : 'other',
        }
      }
    },
  })
  const account = {
    email: 'philipp@example.com',
    onLogOut: () => addLog('log out'),
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BoardsDataAccessProvider dataAccess={boards}>
        <BoardViewDataAccessProvider dataAccess={boardView}>
          <ClockProvider clock={() => sampleNow}>
            <AppBarSlotProvider>
              <AppLayout
                sidebar={
                  <Sidebar
                    brandName="Cardigan"
                    navLabel="Main"
                    mainNav={
                      <BoardsNavItem
                        isCurrent={false}
                        link={
                          <button
                            type="button"
                            onClick={() => addLog('open board list')}
                          />
                        }
                      />
                    }
                    boardsHeading={t('sidebar.boardsHeading')}
                    boards={
                      <BoardsNavList
                        currentBoardId={boardId}
                        renderBoardLink={boardLink}
                      />
                    }
                    account={sidebarAccount(account, t)}
                  />
                }
                appBar={<AppBarSlotTarget />}
              >
                <BoardViewRoot
                  key={boardId}
                  boardId={boardId}
                  onOpenCard={(cardId) => addLog(`open card ${cardId}`)}
                  onExport={(board) => {
                    addLog(`export ${board.name}`)
                    void startExport(board)
                  }}
                  onBack={() => addLog('back to the board list')}
                  onBoardGone={() => addLog('board gone: open the board list')}
                  onNotFound={() => addLog('not found page')}
                />
              </AppLayout>
              {exportDialog}
            </AppBarSlotProvider>
          </ClockProvider>
        </BoardViewDataAccessProvider>
      </BoardsDataAccessProvider>
      <details className="fixed right-8 bottom-8 z-40 max-h-[80dvh] max-w-[300px] overflow-auto rounded-8 border border-border bg-background-surface p-8 type-sans-12-regular-145 text-text-primary shadow-popover">
        <summary>Dev controls</summary>
        <div className="flex flex-col items-start gap-6 pt-8">
          <label className="flex flex-col gap-4">
            Board
            <select
              value={boardId}
              onChange={(event) => setBoardId(event.target.value)}
            >
              {sampleBoards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="text-accent"
            onClick={async () => {
              const board = await boards.createBoard({
                name: 'Garden irrigation',
                key: `G${String(Date.now())
                  .slice(-4)
                  .replace(/\d/g, (d) => 'ABCDEFGHIJ'[Number(d)]!)}`,
              })
              setBoardId(board.id)
              addLog('created an empty board with the default columns')
            }}
          >
            Open a new board (default columns)
          </button>
          <p className="text-text-muted">Fail the next call</p>
          {FAILURES.map(({ label, method, error }) => (
            <button
              key={label}
              type="button"
              className="text-accent"
              onClick={() => {
                boardView.failNext(method, error)
                addLog(`next ${label}`)
              }}
            >
              {label}
            </button>
          ))}
          <p className="text-text-muted">
            Apply the next call, then lose its response
          </p>
          {(['createCard', 'createColumn', 'moveColumn'] as const).map(
            (method) => (
              <button
                key={method}
                type="button"
                className="text-accent"
                onClick={() => {
                  boardView.applyThenFailNext(method)
                  addLog(`next ${method} applies, then its response is lost`)
                }}
              >
                {method}
              </button>
            ),
          )}
          <p className="text-text-muted">Hold the next call</p>
          {METHODS.map((method) => (
            <button
              key={method}
              type="button"
              className="text-accent"
              onClick={() => {
                const release = boardView.holdNext(method)
                setReleases((current) => [...current, release])
                addLog(`holding next ${method}`)
              }}
            >
              {method}
            </button>
          ))}
          <button
            type="button"
            className="text-accent"
            onClick={() => {
              for (const release of releases) release()
              setReleases([])
              addLog('released held calls')
            }}
          >
            Release held calls ({releases.length})
          </button>
          <p className="text-text-muted">Another device</p>
          <button
            type="button"
            className="text-accent"
            onClick={() => {
              boardView.changeBoard(boardId, (columns) =>
                columns.map((column, index) =>
                  index === 0
                    ? {
                        ...column,
                        cards: [
                          ...column.cards,
                          {
                            id: `elsewhere-${Date.now()}`,
                            number: 900 + column.cards.length,
                            title: 'Added on another device',
                            position: column.cards.length,
                            labels: [],
                          },
                        ],
                      }
                    : column,
                ),
              )
              addLog('another device added a card to the first column')
            }}
          >
            Add a card elsewhere
          </button>
          <button
            type="button"
            className="text-accent"
            onClick={() => {
              boardView.changeBoard(boardId, (columns) => columns.slice(1))
              addLog('another device deleted the first column')
            }}
          >
            Delete the first column elsewhere
          </button>
          <button
            type="button"
            className="text-accent"
            onClick={() => {
              boardView.changeBoard(boardId, (columns) => [
                ...columns.slice(1),
                ...columns.slice(0, 1),
              ])
              addLog('another device moved the first column to the end')
            }}
          >
            Move the first column to the end elsewhere
          </button>
          <button
            type="button"
            className="text-accent"
            onClick={() => {
              void boards.deleteBoard(boardId)
              addLog('another device deleted this board')
            }}
          >
            Delete this board elsewhere
          </button>
          <button
            type="button"
            className="text-accent"
            onClick={() => {
              boardView.changeBoard(boardId, () => [])
              addLog('another device deleted every column: refresh')
            }}
          >
            Delete every column elsewhere
          </button>
          <pre className="type-mono-11-regular-100 whitespace-pre-wrap text-text-muted">
            {log.join('\n')}
          </pre>
        </div>
      </details>
    </QueryClientProvider>
  )
}
