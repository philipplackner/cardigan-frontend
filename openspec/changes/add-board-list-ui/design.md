# Design

## Context

See proposal.md › Why. Current state that shapes the approach:

- `src/features/boards/` has only empty folders. `App` renders nothing.
- The web foundation change (D16) lands first. It adds TanStack Router, TanStack Query with the app's `QueryClient` (`staleTime: Infinity`, no refetch on focus, reconnect or mount, `retry: false`), React Hook Form and Zod, the shell layout (sidebar frame with only the brand, main area, and a top-bar slot for each page's `AppBar`, built on `core/ui` `AppLayout`), a temporary empty `/` index route, and the text helpers `normalizeText` and `checkText` in `core/utils/text.ts`. This design assumes those exist.
- `core/ui` already has every component the screens need: `BoardTile`, `BoardRow` (both take a `link` element), `Sidebar` (with `mainNav`, `boards`, `boardsAction` and `account` slots), `NavItem`, `AppBar` (`isRaised`), `PageHeader`, `EmptyState`, `Skeleton`, `Menu`, `Dialog`, `Field`, `Input`, `Button` (loading state), `IconButton`, toasts. `AppLayout` mounts both the app bar and the sidebar and hides one with the phone condition from `web-design-system`. `Sidebar.account` requires a non-null `email` and `initial` today; this change makes them nullable (see *Sidebar pieces*).
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
  | { kind: 'sessionEnded' }                      // the session ended during the request
  | { kind: 'other' }                             // network, 5xx, anything else

type BoardsDataAccess = {
  listBoards(): Promise<BoardSummary[]>          // server order (D3)
  createBoard(input: { name: string; key: string }): Promise<BoardSummary>
  renameBoard(id: string, name: string): Promise<BoardSummary>
  deleteBoard(id: string): Promise<void>
}
```

Methods reject with a `BoardsError` (an `Error` subclass carrying a `BoardsErrorKind`). Rejection instead of a result union fits TanStack Query, whose `queryFn` and `mutationFn` signal failure by throwing.

`renameBoard` and `createBoard` results are only trusted for `id`, `name`, `key` and `updatedAt`. `cardCount` belongs to the list item and may be missing from the board resource the backend returns (see Risks).

When a request fails because the session ended (a rejected token refresh, `api-auth-tokens` › *Clients end the session on a rejected refresh*), the connect data access rejects with `sessionEnded`. The board list shows no toast and starts no reload for it; `core/auth` handles the redirect.

The interface reaches the hooks through `BoardsDataAccessProvider` (React context) in `features/boards`. The app layer provides it. The preview page and tests provide `createInMemoryBoardsDataAccess(seed, options)`, which keeps boards in memory (with a `createdAt` it doesn't expose), sorts them like `api-conventions` › *Board list order* (D3), enforces the key rules, and can be told to fail the next call with a given kind, to apply the next create and then reject it with `other` (a lost response), or to hold a call until released (for loading and saving states).

The seed boards live in `features/boards/testing/sampleBoards.ts` (`sampleBoards`: the 14 boards from the Figma frames, with ids, keys, card counts and fixed `createdAt`/`updatedAt` times). `createInMemoryBoardsDataAccess` defaults to them, and the board view's in-memory data access reuses them so both show the same boards. They are exported for tests and the preview page only; the app layer never provides an in-memory data access (D23).

`BoardsDataAccess` is only the seam for whatever data layer `web-boards-connect` brings in. It is not a repository layer. In connect, the data layer follows `react-data-layer` as usual: plain API functions on the generated client, mappers, `DataError`. The object connect provides only points the four methods at those functions and maps `DataError` to `BoardsErrorKind`, applying `api-errors` › *Clients handle unknown error codes by status*. Connect may also replace the seam with direct calls to the API functions if that turns out simpler; the screens only depend on the hooks.

Alternatives: plain API functions with MSW now (rejected: there is no contract to write handlers against, and "never invent an endpoint" forbids guessing one). Injected callbacks like `TransferActions` (rejected: the board view needs the same calls, so one object passed once is simpler).

### Server state (D3, D10, D11, D19)

- `boardsQueryOptions(dataAccess)` with key `['boards']`. `useBoards()` reads it. The board list, the sidebar pieces and the local key clash check all read the same cache entry, so they never disagree.
- The foundation's defaults already fit: `retry: false` keeps mutations from repeating (`api-conventions` › *Retries after a lost response*) and shows the error state at once; `staleTime: Infinity` without focus or mount refetches means boards load once and change only through Refresh, Try again or an invalidation after a mutation (the breakdown's "intentional refresh"). Invalidation still refetches the active query.
- Refresh and Try again call `refetch()`. The screen derives:
  - `loading`: no data and fetching (first load or Try again after an error)
  - `error`: no data and error
  - `ready`: data, with `isRefreshing` true only while a refetch started by Refresh runs. The view model tracks this itself, not through `isFetching`, so reloads after a mutation or an import don't spin the icon. Refresh is ignored while `isRefreshing`.
  A failed `refetch()` while data exists keeps the data (Query's default) and the view model shows the refresh error toast from the `refetch` result.
- Mutations (`useCreateBoard`, `useRenameBoard`, `useDeleteBoard`):
  - Success: invalidate `['boards']`. Rename updates the cached summary right away by merging `name` and `updatedAt` from the result into the existing entry; `cardCount` stays from the cache. Delete removes the board from the cache right away. Both let the dialog close on a current list. The server order may change after rename, which the refetch picks up. The create result is only passed to `onBoardCreated`; the list gets the new board from the refetch.
  - Rename 404: remove the board from the cache, then invalidate.
  - Delete 404: handled as success.
  - Create failure of kind `other`, or `invalid` with `key`/`ALREADY_USED`: invalidate `['boards']` (D19). While that reload runs, "Create board" stays disabled (`isFetching` on `['boards']`), so the user can't try again before the list is current (`api-conventions` › *Retries after a lost response*).
  - Failure of kind `sessionEnded`: no toast, no invalidation.
- Exports for the app layer: `useBoardsChanged()` (returns an invalidate function for `transfer`'s `onBoardsChanged`) and `useFindBoardNameByKey()` (reads the cache for `transfer`'s `findBoardNameByKey`).

### Pieces and structure

All in `features/boards`, exported from `index.ts`:

- `BoardListRoot` → `useBoardListViewModel` → `BoardListScreen`. The Screen renders both the tablet/desktop header and grid and the phone app bar content and list (see *Phone vs. tablet/desktop*), the states, and the Rename and Delete dialogs. Props from the app layer:
  - `renderBoardLink(boardId): ReactElement`: returns the element passed to `BoardTile`, `BoardRow` and the sidebar's `NavItem` as their link. Connect passes a router `Link` to `/boards/$boardId`. The preview and the tests pass a `<button>` that logs or records the id. This keeps real link behavior (new tab, middle-click) without changing the screens in connect.
  - `onOpenLabels()`.
  - `importAction: { open(): void; dialogs: ReactNode }` from `transfer`'s `useImportFlow`. The board list renders the header Import button, the empty state Import button and the phone "Import board" item from it, without importing `transfer`. The labels "Import" and "Import board" move to the `boards` namespace (`importButton`, `importMenuItem`); `transfer`'s `ImportTrigger`, `import.button` and `import.menuItem` are removed in the same commit as the key check move.
  - `account: { email: string | null; onLogOut(): void }` (D15). The app layer fills it from auth's `useSession()`, so `boards` doesn't depend on where auth puts the session. A `null` email hides "Signed in as".
- The Screen renders its phone `AppBar` (brand or "Boards", +, ⋯) into the shell's top-bar slot and its desktop header in the main area.
- `NewBoardDialogProvider({ onBoardCreated, children })` renders the single `NewBoardDialog` itself and exposes `openNewBoardDialog()` through context. The app layer mounts it, together with `BoardsDataAccessProvider`, around `AppLayout` in `AppShell`, so the header, the empty state, the phone + and the sidebar open the same dialog on every route that shows the sidebar. `BoardListScreen` does not render the New board dialog. `onBoardCreated(board)` stays a callback (D9).
- `NewBoardDialog`, `RenameBoardDialog`, `DeleteBoardDialog`: each a Root with its own view-model hook over the matching mutation. Rename and Delete take the board and `onClose(result)`, with `result` being `{ kind: 'renamed'; board: BoardSummary } | { kind: 'deleted' } | { kind: 'unchanged' }`. A rename 404 reports `deleted`, since the board is gone. Cancel and an unchanged name report `unchanged`. The board view opens them from its ⋯ menu and goes back to the list on `deleted` (D17, D22).
- Dialogs render outside menus, as in `transfer`. `core/ui/Menu` unmounts its content on close, so a menu item only sets the dialog state that the Screen renders. The open dialog is a discriminated union in the view model: `none | rename(board) | delete(board)`.
- Focus after a dialog closes returns to its trigger. When the board's tile or row is gone (delete, rename 404), the view model moves focus to the next board's menu button, or the previous one if it was the last, or the header New board button if no boards are left.

### Sidebar pieces (D15)

`Sidebar` takes `mainNav`, `boards`, `boardsAction` and `account` as separate props, so the board list provides one piece per slot. None of them uses router hooks; the current state and links come in as props, so the preview page can mount them without a router.

- `BoardsNavItem({ isCurrent, link })` for `mainNav`: "All boards".
- `BoardsNavList({ currentBoardId, renderBoardLink })` for `boards`: the rows with name and key in list order, the open board marked with `isSelected`. No rows while loading or in the error state.
- `NewBoardNavItem()` for `boardsAction`: "+ New board", which calls `openNewBoardDialog()`.
- `sidebarAccount(account, t)` returns the props for `Sidebar`'s `account` slot: the email, the avatar initial (first character of the email, uppercased) and the log out label and action. This change makes `Sidebar.account.email` and `initial` accept `null` in `core/ui`; while they are `null`, the email text and the avatar initial are hidden.

`AppShell` passes these in `web-boards-connect`.

### Phone vs. tablet/desktop

Like `AppLayout`, the Screen mounts both the tablet/desktop header and grid and the phone app bar and list, and hides one with the theme's `phone` variant. There is no JavaScript media query, so the phone condition keeps one definition (`web-design-system` › *Phone condition*). The phone app bar has no Refresh button in its markup. Screen and feature tests render both regions, because jsdom applies no CSS, and scope their queries with `within(...)` to the phone app bar and list region or to the header and grid region. Which region is visible at 390, 834 and 1440 px, the grid's column count and the phone dialog layout are checked on the preview page (task 7.1).

### Forms (D4–D8, D14)

- React Hook Form (in the approved stack), `mode: 'onSubmit'`, `reValidateMode: 'onChange'`. That is D5 exactly: errors appear on the first submit, then follow typing. The primary button is disabled when `formState.errors` has an entry or a mutation is pending.
- Validation uses `validate` functions that call the shared checks, not a Zod schema. Two fields don't need a schema, and the generated API schemas come later.
- Server field errors go into the form with `setError`. An unknown `key` code maps to `INVALID_FORMAT` (D7). An unknown `name` code shows "Use a single line without control characters." under the Name field, as in the board view change and as `api-errors` › *Clients handle unknown error codes by status* requires. An `invalid` result with no error for `name` or `key` is handled like `other` (toast, dialog stays open).
- Key prefill (D4): `keyFromName(name)` in `features/boards/utils`: NFD, remove `\p{M}`, keep ASCII letters only, take the first 4, map `a–z` to `A–Z` without locale rules, empty if fewer than 2. The name field's `onChange` sets the key while `dirtyFields.key` is false. Typing in the key uses the form's own `onChange`, which marks it dirty, so the prefill stops.
- Key input uppercases `a–z` on change, keeping the caret position, as the clash dialog already does. Other characters stay as typed.
- Local clash (D8): the key validator also checks the keys from `useBoards()` data. While there is no data (loading or load error), it skips this check and the server's 409 decides.
- Rename unchanged (D14): on submit, if `normalizeText(name, 'singleLine') === board.name`, close without calling the mutation.
- The name input has no `maxLength`. Over-limit text stays visible and shows the error, as `text-length` › *Clients validate with the same rule* requires.

### Shared checks and strings (D6, D7)

- `core/utils/boardKey.ts`: `normalizeKeyInput` (uppercase ASCII) and `checkBoardKey(key)` returning `REQUIRED | TOO_SHORT | TOO_LONG | INVALID_FORMAT | null` in the breakdown order. Moved out of `transfer/hooks/useImportViewModel.ts`.
- Name checks call the foundation's `checkText(value, { kind: 'singleLine', max: 100 })` and send its returned `value`. `EMPTY` maps to `nameErrors.required`, `INVALID_CHARACTER` to `nameErrors.invalidCharacter`, and `TOO_LONG` to `nameErrors.tooLong`. No new `core/utils` file. Column and label names use the same mapping.
- `common` namespace: `keyErrors.*` (moved from `transfer`'s `clash.keyErrors`, plus `keyErrors.alreadyUsed` moved from `clash.keyUsed`) and `nameErrors.*`. `transfer`'s `ClashDialog` switches to them. Its existing tests must pass unchanged, which shows the copy didn't change.

### Relative time (D13)

`formatRelativeTime(updatedAt, now)` in `features/boards/utils` returns a tagged value (`justNow`, `minutes n`, `hours n`, `yesterday`, `date`, `dateWithYear`). Minutes and hours are whole units rounded down. The Screen turns it into text with i18next plurals and `Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' [, year] })`. Calendar comparisons use local dates. `useNow()` returns a time taken when the screen mounts and updated whenever the boards query's `dataUpdatedAt` changes, so a Refresh updates the times even when the data is unchanged and memoized tiles would not re-render. Tests inject a fixed time through the same hook's provider. The text doesn't tick (D13). It stays in `boards` until `cards` needs it; then it moves to `core/utils` (repo rule: move when a second feature needs it).

Counts ("12 cards", "14 boards") use i18next plurals with `en-US` digit grouping ("1,234 cards").

### Phone app bar title (spec › *Phone title on scroll*)

The foundation deferred scroll detection to this change (D24). The board list reads no scroll position. A `useLargeTitleCollapsed(ref)` hook runs an `IntersectionObserver` with the viewport as root on the large title. The browser clips the target by every scrolling ancestor, so the hook works whether the shell's main area or the window scrolls, and the shell needs no scroll API. The title counts as collapsed when it is fully hidden (`threshold: 0`, `isIntersecting === false`); then the app bar gets `isRaised` and shows "Boards" instead of the brand. The hook lives in `features/boards/hooks` and moves to `core/ui` when a second feature needs it. jsdom has no `IntersectionObserver`, so the screen test installs a small controllable stub on `window` (a global, not a project module, so the no-`vi.mock` rule holds). The visual result is checked on the preview page.

### Refresh control (D11, D12)

The Refresh `IconButton` exists only in the tablet/desktop header. It spins its icon while `isRefreshing` (CSS animation, off under `prefers-reduced-motion`, where the button shows the loading state without motion). It keeps its accessible name "Refresh" and sets `aria-busy`. The phone app bar has no refresh button (D12), a deliberate deviation from Figma.

### Grid (D20)

CSS grid with `repeat(auto-fill, minmax(260px, 1fr))` inside the main area. With the sidebar widths from `web-design-system` that gives 2 columns at 834 px and 4 at 1440 px. The 260 px value is a theme token, so it can follow a Figma change in one place.

### No route in this change (D23)

The foundation's empty `/` index route stays. Nothing in `src/app` provides a `BoardsDataAccess` yet. `web-boards-connect` mounts `BoardListRoot` at `/`, mounts `BoardsDataAccessProvider` and `NewBoardDialogProvider` around `AppLayout`, passes the sidebar pieces and `sidebarAccount` to `Sidebar`, wires the import flow, and fills `account` from `useSession()`. This change exposes everything that wiring needs from `features/boards/index.ts`, and the preview page shows the same composition with the in-memory data access.

### Preview

`src/preview/sections/BoardListSection.tsx` mounts `BoardListRoot` and the sidebar pieces inside `AppLayout`, wrapped in `NewBoardDialogProvider`, with an in-memory data access and controls to: seed 0, 6 or 14 boards; fail the next load, refresh, create, rename or delete with `other` or `notFound`; apply the next create and then fail it; hold the next call; set the email to `null`. It uses `transfer`'s import flow with a fake, as `TransferPlayground` does.

### Tests

- Unit: `keyFromName`, `checkBoardKey`, the name error mapping over `checkText`, `formatRelativeTime`, `sidebarAccount`, the view-model dialog reducer, the in-memory data access's ordering and key rules.
- Screen: `BoardListScreen` per state with props only, with queries scoped to the phone or the tablet/desktop region (see *Phone vs. tablet/desktop*); each dialog Screen; the sidebar pieces.
- Feature: `BoardListRoot` with the in-memory data access and a fresh `QueryClient`: load, empty, error and Try again, refresh success and failure, create (prefill, local checks, local clash, server clash, server field errors, unknown codes, failure + reload, success callback), rename (unchanged, success, server field errors, 404), delete (success, 404, failure), focus after delete, sidebar states.
- No `vi.mock`. The only fakes are the in-memory data access, the `IntersectionObserver` stub and fixed time.

## Risks / Trade-offs

- **[Foundation not landed]** → This change can't start implementation until the web foundation change is merged. Task 1 checks this.
- **[Board list not reachable in the app until connect]** (D23) → Only the preview page shows it. The connect chunk's wiring is small because the exports are designed for it.
- **[Title clipped by something other than scrolling]** (D24) → If an overlay or a `clip-path` hides the large title, the bar would raise as well. No such element exists on the board list; the preview check in 4.3 covers it.
- **[`src/features/boards/` shared with the board view change]** (D17) → Board view adds its own files and rebases onto this change. This change keeps the public names stable: `BoardsDataAccess`, `BoardsDataAccessProvider`, `BoardSummary`, `BoardsError`, `useBoards`, `boardsQueryOptions`, `createInMemoryBoardsDataAccess`, `sampleBoards`, `RenameBoardDialog`, `DeleteBoardDialog` and their `onClose` result type.
- **[Account footer ownership]** → add-web-foundation's D4 says auth adds the account footer. This change builds it (`sidebarAccount`, nullable `Sidebar.account`), with auth providing the email and log out. The coordinator is asked to correct the foundation's D4 (tasks.md › Workflow follow-up).
- **[Seam drifts from the real API]** → The interface only uses fields and codes from `domain-board` and `api-errors`. If the backend names the card count differently, only the connect mapper changes.
- **[`cardCount` comes from be-cards]** → There is no backend change for cards yet. `cardCount` on the board list item comes from the later be-cards change, not from be-boards. This change is not affected, because the test double provides `cardCount`. If `web-boards-connect` runs before be-cards, the connect change decides the placeholder (for example, hiding the card count).
- **[`Intl` month names]** → `en-US` is fixed because the app is English only. A second language will need locale-aware formatting.
- **[Moving key strings touches `transfer`]** → Its tests act as the regression check; the move is its own commit.
