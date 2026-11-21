# Design

## Context

See proposal.md › Why. Current state that shapes the approach:

- `src/features/boards/` has only empty folders. `App` renders nothing.
- The web foundation change (D16) lands first. It adds TanStack Router, TanStack Query with the app's `QueryClient` (`staleTime: Infinity`, no refetch on focus, reconnect or mount, `retry: false`), React Hook Form and Zod, the shell layout (sidebar frame with only the brand, main area, and a top-bar slot for each page's `AppBar`, built on `core/ui` `AppLayout`), a temporary empty `/` index route, and the text normalize-and-count helper in `core/utils`. This design assumes those exist.
- `core/ui` already has every component the screens need: `BoardTile`, `BoardRow`, `Sidebar` (with `boards`, `boardsAction` and `account` slots), `AppBar` (`isRaised`), `PageHeader`, `EmptyState`, `Skeleton`, `Menu`, `Dialog`, `Field`, `Input`, `Button` (loading state), `IconButton`, toasts. `AppLayout` switches between the app bar and the sidebar with the phone condition from `web-design-system`.
- `transfer` exports `useImportFlow` and `ImportTrigger`. It takes `findBoardNameByKey` and `onBoardsChanged`, which the app layer will point at the board list. Its key check and key error strings live inside `transfer` today.
- i18n (`common` namespace in `core/i18n`, one namespace per feature registered in `src/app/i18n.ts`) and the screen test stack (Vitest + jsdom for `*.test.tsx`, RTL, user-event, `TZ=Europe/Berlin`) are in place.
- No backend board endpoints and no OpenAPI board schemas yet.

## Goals / Non-Goals

**Goals:**
- Every state in `specs/web-board-list`, testable without a backend, with a data seam that `web-boards-connect` fills without touching the screens.
- Rename and Delete dialogs the board view can reuse (D17).
- One key check and one set of key and name error strings for `boards` and `transfer` (D6, D7).

**Non-Goals:**
- API functions, DTOs, mappers, MSW handlers, E2E tests, timeouts, route mounting and navigation targets (`web-boards-connect`).
- The auth session itself. This change only consumes an email and a logout action.
- Labels page, board view.

## Decisions

### The seam: `BoardsDataAccess` (D16, D17)

`features/boards/types.ts`:

```ts
type BoardSummary = {
  id: string
  name: string
  key: string
  cardCount: number
  updatedAt: Date
}

type BoardFieldError = {
  field: 'name' | 'key'
  code: string // REQUIRED, TOO_SHORT, TOO_LONG, INVALID_CHARACTER, INVALID_FORMAT, ALREADY_USED, or unknown
  min?: number
  max?: number
}

type BoardsErrorKind =
  | { kind: 'notFound' }                          // 404
  | { kind: 'invalid'; fields: BoardFieldError[] } // 400 / 409 with field errors
  | { kind: 'other' }                             // network, 5xx, anything else

interface BoardsDataAccess {
  listBoards(): Promise<BoardSummary[]>          // server order (D3)
  createBoard(input: { name: string; key: string }): Promise<BoardSummary>
  renameBoard(id: string, name: string): Promise<BoardSummary>
  deleteBoard(id: string): Promise<void>
}
```

Methods reject with a `BoardsError` (an `Error` subclass carrying a `BoardsErrorKind`). Rejection instead of a result union fits TanStack Query, whose `queryFn` and `mutationFn` signal failure by throwing.

The interface reaches the hooks through `BoardsDataAccessProvider` (React context) in `features/boards`. The app layer provides it. The preview page and tests provide `createInMemoryBoardsDataAccess(seed, options)`, which keeps boards in memory (with a `createdAt` it doesn't expose), sorts them like `api-conventions` › *Board list order* (D3), enforces the key rules, and can be told to fail the next call with a given kind or to hold a call until released (for loading and saving states).

The seed boards live in `features/boards/testing/sampleBoards.ts` (`sampleBoards`: the 14 boards from the Figma frames, with ids, keys, card counts and fixed `createdAt`/`updatedAt` times). `createInMemoryBoardsDataAccess` defaults to them, and the board view's in-memory data access reuses them so both show the same boards. They are exported for tests and the preview page only; the app layer never provides an in-memory data access (D23).

`BoardsDataAccess` is only the seam for whatever data layer `web-boards-connect` brings in. It is not a repository layer. In connect, the data layer follows `react-data-layer` as usual: plain API functions on the generated client, mappers, `DataError`. The object connect provides only points the four methods at those functions and maps `DataError` to `BoardsErrorKind`, applying `api-errors` › *Clients handle unknown error codes by status*. Connect may also replace the seam with direct calls to the API functions if that turns out simpler; the screens only depend on the hooks.

Alternatives: plain API functions with MSW now (rejected: there is no contract to write handlers against, and "never invent an endpoint" forbids guessing one). Injected callbacks like `TransferActions` (rejected: the board view needs the same calls, so one object passed once is simpler).

### Server state (D3, D10, D11, D19)

- `boardsQueryOptions(dataAccess)` with key `['boards']`. `useBoards()` reads it. The board list, the sidebar section and the local key clash check all read the same cache entry, so they never disagree.
- The foundation's defaults already fit: `retry: false` keeps mutations from repeating (`api-conventions` › *Retries after a lost response*) and shows the error state at once; `staleTime: Infinity` without focus or mount refetches means boards load once and change only through Refresh, Try again or an invalidation after a mutation (the breakdown's "intentional refresh"). Invalidation still refetches the active query.
- Refresh and Try again call `refetch()`. The screen derives:
  - `loading`: no data and fetching (first load or Try again after an error)
  - `error`: no data and error
  - `ready`: data, with `isRefreshing = isFetching`
  A failed `refetch()` while data exists keeps the data (Query's default) and the view model shows the refresh error toast from the `refetch` result.
- Mutations (`useCreateBoard`, `useRenameBoard`, `useDeleteBoard`):
  - Success: invalidate `['boards']`. Rename and delete also update the cache right away (replace or remove the board) so the dialog closes on a current list. The server order may change after rename, which the refetch picks up.
  - Rename 404: remove the board from the cache, then invalidate.
  - Delete 404: handled as success.
  - Create failure of kind `other`: invalidate `['boards']` (D19).
- Exports for the app layer: `useBoardsChanged()` (returns an invalidate function for `transfer`'s `onBoardsChanged`) and `useFindBoardNameByKey()` (reads the cache for `transfer`'s `findBoardNameByKey`).

### Pieces and structure

All in `features/boards`, exported from `index.ts`:

- `BoardListRoot` → `useBoardListViewModel` → `BoardListScreen`. The Screen renders the header (tablet/desktop) or the phone app bar content, the grid or list, the states, and the dialogs. Props from the app layer:
  - `onOpenBoard(boardId)` and `onBoardCreated(board)`: navigation (D9). Until the board view route exists, the preview logs them.
  - `importAction: { open(): void; dialogs: ReactNode }` from `transfer`'s `useImportFlow`. The board list renders the header Import button, the empty state Import button and the phone "Import board" item from it, without importing `transfer`.
  - `account: { email: string | null; onLogOut(): void }` (D15). The app layer fills it from auth's `useSession()`, so `boards` doesn't depend on where auth puts the session. A `null` email hides "Signed in as" and the sidebar email.
  - `onOpenLabels()`.
- The Screen renders its phone `AppBar` (brand or "Boards", +, ⋯) into the shell's top-bar slot and its desktop header in the main area.
- `BoardsSidebarSection`: "All boards" (current on `/`) for the sidebar's main nav, and the rows and "+ New board" for `Sidebar`'s `boards` slot. It reads `useBoards()` and opens the same New board dialog through a small `NewBoardDialogProvider` context, so the sidebar and the screen share one dialog instance.
- `NewBoardDialog`, `RenameBoardDialog`, `DeleteBoardDialog`: each a Root with its own view-model hook over the matching mutation. Rename and Delete take the board and `onClose(result)`, with `result` being `{ kind: 'renamed'; board: BoardSummary } | { kind: 'deleted' } | { kind: 'unchanged' }`. A rename 404 reports `deleted`, since the board is gone. The board view opens them from its ⋯ menu and goes back to the list on `deleted` (D17, D22).
- Dialogs render outside menus, as in `transfer`. `core/ui/Menu` unmounts its content on close, so a menu item only sets the dialog state that the Screen renders. The open dialog is a discriminated union in the view model: `none | create | rename(board) | delete(board)`.

### Forms (D4–D8, D14)

- React Hook Form (in the approved stack), `mode: 'onSubmit'`, `reValidateMode: 'onChange'`. That is D5 exactly: errors appear on the first submit, then follow typing. The primary button is disabled when `formState.errors` has an entry or a mutation is pending.
- Validation uses `validate` functions that call the shared checks, not a Zod schema. Two fields don't need a schema, and the generated API schemas come later.
- Server field errors go into the form with `setError`. An unknown `key` code maps to `INVALID_FORMAT` (D7), and an unknown `name` code to the generic save failure toast.
- Key prefill (D4): `keyFromName(name)` in `features/boards/utils`. The name field's `onChange` sets the key while `dirtyFields.key` is false. Typing in the key uses the form's own `onChange`, which marks it dirty, so the prefill stops.
- Key input uppercases on change, keeping the caret position, as the clash dialog already does.
- Local clash (D8): the key validator also checks the keys from `useBoards()` data.
- Rename unchanged (D14): on submit, if `normalize(name) === board.name`, close without calling the mutation.
- The name input has no `maxLength`. Over-limit text stays visible and shows the error, as `text-length` › *Clients validate with the same rule* requires.

### Shared checks and strings (D6, D7)

- `core/utils/boardKey.ts`: `normalizeKeyInput` (uppercase ASCII) and `checkBoardKey(key)` returning `REQUIRED | TOO_SHORT | TOO_LONG | INVALID_FORMAT | null` in the breakdown order. Moved out of `transfer/hooks/useImportViewModel.ts`.
- `core/utils/textField.ts`: `checkSingleLineText(value, { max })` returning `REQUIRED | INVALID_CHARACTER | TOO_LONG | null`, built on the foundation's normalize-and-count helper. It follows the `api-errors` › *One field error per field* order. Column and label names will reuse it.
- `common` namespace: `keyErrors.*` (moved from `transfer`'s `clash.keyErrors`) and `nameErrors.*`. `transfer`'s `ClashDialog` switches to them. Its existing tests must pass unchanged, which shows the copy didn't change.

### Relative time (D13)

`formatRelativeTime(updatedAt, now)` in `features/boards/utils` returns a tagged value (`justNow`, `minutes n`, `hours n`, `yesterday`, `date`, `dateWithYear`). The Screen turns it into text with i18next plurals and `Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' [, year] })`. Calendar comparisons use local dates. `now` comes from a `useNow()` hook read once per render, so tests pass a fixed time. The text doesn't tick (D13). It stays in `boards` until `cards` needs it; then it moves to `core/utils` (repo rule: move when a second feature needs it).

### Phone app bar title (spec › *Phone title on scroll*)

The foundation deferred scroll detection to this change (D24). The board list reads no scroll position. A `useLargeTitleCollapsed(ref)` hook runs an `IntersectionObserver` with the viewport as root on the large title. The browser clips the target by every scrolling ancestor, so the hook works whether the shell's main area or the window scrolls, and the shell needs no scroll API. When the title isn't visible, the app bar gets `isRaised` and shows "Boards" instead of the brand. The hook lives in `features/boards/hooks` and moves to `core/ui` when a second feature needs it. jsdom has no `IntersectionObserver`, so the screen test installs a small controllable stub on `window` (a global, not a project module, so the no-`vi.mock` rule holds). The visual result is checked on the preview page.

### Refresh control (D11, D12)

The Refresh `IconButton` exists only in the tablet/desktop header. It spins its icon while `isRefreshing` (CSS animation, off under `prefers-reduced-motion`, where the button shows the loading state without motion). It keeps its accessible name "Refresh" and sets `aria-busy`. The phone app bar has no refresh button (D12), a deliberate deviation from Figma.

### Grid (D20)

CSS grid with `repeat(auto-fill, minmax(260px, 1fr))` inside the main area. With the sidebar widths from `web-design-system` that gives 2 columns at 834 px and 4 at 1440 px. The 260 px value is a theme token, so it can follow a Figma change in one place.

### No route in this change (D23)

The foundation's empty `/` index route stays. Nothing in `src/app` provides a `BoardsDataAccess` yet. `web-boards-connect` mounts `BoardListRoot`, `BoardsSidebarSection` and the import flow at `/` with the real data access, and wires `account` from `useSession()`. This change exposes everything that wiring needs from `features/boards/index.ts`, and the preview page shows the same composition with the in-memory data access.

### Preview

`src/preview/sections/BoardListSection.tsx` mounts `BoardListRoot` and `BoardsSidebarSection` inside `AppLayout` with an in-memory data access and controls to: seed 0, 6 or 14 boards; fail the next load, refresh, create, rename or delete with `other` or `notFound`; hold the next call. It uses `transfer`'s import flow with a fake, as `TransferPlayground` does.

### Tests

- Unit: `keyFromName`, `checkBoardKey`, `checkSingleLineText`, `formatRelativeTime`, the view-model dialog reducer, the in-memory data access's ordering and key rules.
- Screen: `BoardListScreen` per state with props only; each dialog Screen.
- Feature: `BoardListRoot` with the in-memory data access and a fresh `QueryClient`: load, empty, error and Try again, refresh success and failure, create (prefill, local checks, local clash, server clash, server field errors, failure + reload, success callback), rename (unchanged, success, 404), delete (success, 404, failure), sidebar section states.
- No `vi.mock`. The only fakes are the in-memory data access, the `IntersectionObserver` stub and fixed time.

## Risks / Trade-offs

- **[Foundation not landed]** → This change can't start implementation until the web foundation change is merged. Task 1 checks this.
- **[Board list not reachable in the app until connect]** (D23) → Only the preview page shows it. The connect chunk's wiring is small because the exports are designed for it.
- **[Title clipped by something other than scrolling]** (D24) → If an overlay or a `clip-path` hides the large title, the bar would raise as well. No such element exists on the board list; the preview check in 4.3 covers it.
- **[`src/features/boards/` shared with the board view change]** (D17) → Board view adds its own files and rebases onto this change. This change keeps the public names stable: `BoardsDataAccess`, `BoardSummary`, `useBoards`, `RenameBoardDialog`, `DeleteBoardDialog`.
- **[Seam drifts from the real API]** → The interface only uses fields and codes from `domain-board` and `api-errors`. If the backend names the card count differently, only the connect mapper changes.
- **[`cardCount` comes from be-cards]** → There is no backend change for cards yet. `cardCount` on the board list item comes from the later be-cards change, not from be-boards. This change is not affected, because the test double provides `cardCount`. If `web-boards-connect` runs before be-cards, the connect change decides the placeholder (for example, hiding the card count).
- **[`Intl` month names]** → `en-US` is fixed because the app is English only. A second language will need locale-aware formatting.
- **[Moving key strings touches `transfer`]** → Its tests act as the regression check; the move is its own commit.

