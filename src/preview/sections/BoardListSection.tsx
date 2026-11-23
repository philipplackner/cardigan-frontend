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
  BoardListRoot,
  BoardsDataAccessProvider,
  BoardsError,
  BoardsNavItem,
  BoardsNavList,
  ClockProvider,
  createInMemoryBoardsDataAccess,
  NewBoardDialogProvider,
  NewBoardNavItem,
  sampleBoards,
  sampleNow,
  sidebarAccount,
  useBoardsChanged,
  useFindBoardNameByKey,
  type BoardsErrorKind,
  type BoardsMethod,
  type InMemoryBoardsDataAccess,
} from '@/features/boards'
import { useImportFlow, type ImportBoard } from '@/features/transfer'
import { PreviewSection } from '../PreviewSection'

const DELAY_MS = 600
const SEEDS = { '0': 0, '6': 6, '14': 14 } as const
type Seed = keyof typeof SEEDS

const params = () => new URLSearchParams(location.search)

function readSeed(): Seed {
  const value = params().get('seed')
  return value === '0' || value === '6' ? value : '14'
}

type Failure = { label: string; method: BoardsMethod; error: BoardsErrorKind }

const FAILURES: Failure[] = [
  {
    label: 'load or refresh: network',
    method: 'listBoards',
    error: { kind: 'other' },
  },
  { label: 'create: network', method: 'createBoard', error: { kind: 'other' } },
  {
    label: 'create: 409 key used',
    method: 'createBoard',
    error: {
      kind: 'invalid',
      fields: [{ field: 'key', code: 'ALREADY_USED' }],
    },
  },
  { label: 'rename: network', method: 'renameBoard', error: { kind: 'other' } },
  { label: 'rename: 404', method: 'renameBoard', error: { kind: 'notFound' } },
  { label: 'delete: network', method: 'deleteBoard', error: { kind: 'other' } },
  { label: 'delete: 404', method: 'deleteBoard', error: { kind: 'notFound' } },
]

const HOLDS: BoardsMethod[] = [
  'listBoards',
  'createBoard',
  'renameBoard',
  'deleteBoard',
]

function createPlaygroundDataAccess(seed: Seed) {
  const dataAccess = createInMemoryBoardsDataAccess(
    sampleBoards.slice(0, SEEDS[seed]),
    { delayMs: DELAY_MS, now: () => sampleNow },
  )
  if (params().has('failLoad')) {
    dataAccess.failNext('listBoards', { kind: 'other' })
  }
  if (params().has('holdLoad')) dataAccess.holdNext('listBoards')
  return dataAccess
}

const isKeyClash = (error: unknown) =>
  error instanceof BoardsError &&
  error.error.kind === 'invalid' &&
  error.error.fields.some((field) => field.code === 'ALREADY_USED')

/** A fake import endpoint on top of the in-memory boards, as `TransferPlayground` has. */
function fakeImportBoard(dataAccess: InMemoryBoardsDataAccess): ImportBoard {
  return async (file, key) => {
    let content: { board?: { name?: string; key?: string } }
    try {
      content = JSON.parse(await file.text()) as typeof content
    } catch {
      return { ok: false, error: { kind: 'invalidFile' } }
    }
    try {
      const board = await dataAccess.createBoard({
        name: content.board?.name ?? 'Imported board',
        key: key ?? content.board?.key ?? '',
      })
      return { ok: true, board }
    } catch (error) {
      return {
        ok: false,
        error: isKeyClash(error)
          ? { kind: 'keyUsed' }
          : { kind: 'keyInvalid', code: 'INVALID_FORMAT' },
      }
    }
  }
}

type PlaygroundShellProps = {
  dataAccess: InMemoryBoardsDataAccess
  email: string | null
  addLog: (line: string) => void
}

function PlaygroundShell({ dataAccess, email, addLog }: PlaygroundShellProps) {
  const { t } = useTranslation('boards')
  const importAction = useImportFlow({
    importBoard: fakeImportBoard(dataAccess),
    findBoardNameByKey: useFindBoardNameByKey(),
    onBoardsChanged: useBoardsChanged(),
  })
  const account = { email, onLogOut: () => addLog('log out') }
  const boardLink = (boardId: string) => (
    <button type="button" onClick={() => addLog(`open board ${boardId}`)} />
  )

  return (
    <AppLayout
      sidebar={
        <Sidebar
          brandName="Cardigan"
          navLabel="Main"
          mainNav={<BoardsNavItem isCurrent link={<button type="button" />} />}
          boardsHeading={t('sidebar.boardsHeading')}
          boards={<BoardsNavList renderBoardLink={boardLink} />}
          boardsAction={<NewBoardNavItem />}
          account={sidebarAccount(account, t)}
        />
      }
      appBar={<AppBarSlotTarget />}
    >
      <BoardListRoot
        renderBoardLink={boardLink}
        onOpenLabels={() => addLog('open labels')}
        importAction={importAction}
        account={account}
      />
    </AppLayout>
  )
}

/** Dev-only: the board list with an in-memory backend, full screen, with a floating control panel. */
export function BoardListPlayground() {
  const [queryClient] = useState(createQueryClient)
  const [dataAccess] = useState(() => createPlaygroundDataAccess(readSeed()))
  const [email, setEmail] = useState<string | null>('philipp@example.com')
  const [releases, setReleases] = useState<(() => void)[]>([])
  const [log, setLog] = useState<string[]>([])
  const addLog = (line: string) =>
    setLog((lines) => [line, ...lines].slice(0, 6))

  return (
    <QueryClientProvider client={queryClient}>
      <BoardsDataAccessProvider dataAccess={dataAccess}>
        <ClockProvider clock={() => sampleNow}>
          <AppBarSlotProvider>
            <NewBoardDialogProvider
              onBoardCreated={(board) => addLog(`open new board ${board.key}`)}
            >
              <PlaygroundShell
                dataAccess={dataAccess}
                email={email}
                addLog={addLog}
              />
            </NewBoardDialogProvider>
          </AppBarSlotProvider>
        </ClockProvider>
      </BoardsDataAccessProvider>
      <details className="fixed right-8 bottom-8 z-40 max-h-[80dvh] max-w-[300px] overflow-auto rounded-8 border border-border bg-background-surface p-8 type-sans-12-regular-145 text-text-primary shadow-popover">
        <summary>Dev controls</summary>
        <div className="flex flex-col items-start gap-6 pt-8">
          <p>
            Seed (reloads):{' '}
            {Object.keys(SEEDS).map((value) => (
              <a
                key={value}
                className="pr-8 text-accent"
                href={`?boardList&seed=${value}`}
              >
                {value}
              </a>
            ))}
          </p>
          <p className="text-text-muted">Fail the next call</p>
          {FAILURES.map(({ label, method, error }) => (
            <button
              key={label}
              type="button"
              className="text-accent"
              onClick={() => {
                dataAccess.failNext(method, error)
                addLog(`next ${label}`)
              }}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            className="text-accent"
            onClick={() => {
              dataAccess.applyThenFailNextCreate()
              addLog('next create is stored, then its response is lost')
            }}
          >
            create: apply, then lose the response
          </button>
          <p className="text-text-muted">Hold the next call</p>
          {HOLDS.map((method) => (
            <button
              key={method}
              type="button"
              className="text-accent"
              onClick={() => {
                const release = dataAccess.holdNext(method)
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
          <label className="flex items-center gap-6">
            <input
              type="checkbox"
              checked={email === null}
              onChange={(event) =>
                setEmail(event.target.checked ? null : 'philipp@example.com')
              }
            />
            Email still loading
          </label>
          <pre className="type-mono-11-regular-100 whitespace-pre-wrap text-text-muted">
            {log.join('\n')}
          </pre>
        </div>
      </details>
    </QueryClientProvider>
  )
}

export function BoardListSection() {
  return (
    <PreviewSection title="Board list">
      <p className="type-body text-text-muted">
        The board list with an in-memory backend and the sample boards from
        Figma. Open it with{' '}
        <a href="?boardList&seed=14" className="text-accent">
          14 boards
        </a>
        ,{' '}
        <a href="?boardList&seed=6" className="text-accent">
          6 boards
        </a>
        ,{' '}
        <a href="?boardList&seed=0" className="text-accent">
          no boards
        </a>
        ,{' '}
        <a href="?boardList&seed=6&holdLoad" className="text-accent">
          loading
        </a>{' '}
        or{' '}
        <a href="?boardList&seed=6&failLoad" className="text-accent">
          a load error
        </a>
        . The dev controls in the corner fail or hold the next call.
      </p>
    </PreviewSection>
  )
}
