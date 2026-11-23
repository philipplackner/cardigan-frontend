# Design

## Context

See proposal.md › Why. The current state that shapes the approach:

- **Dependencies:** this change builds on two changes that must land first:
  - The web foundation change (D4): TanStack Router with file routes in `src/app/routes`, the TanStack Query client, the empty shell layout and a normalize-and-count text helper in `core/utils`.
    - A page's app bar goes into a shell top-bar slot.
    - The router's not-found and pending components are blank for now.
    - The Query client uses `staleTime: Infinity`, no automatic refetch, and `retry: false`.
  - The board list change (D5): the board summary type, the board list query, the rename and delete board dialogs, and the sidebar.
- `src/core/ui` already has what the screen needs: `Column` (name, count, menu and footer slots; 300 px on phones), `Card` (a button with display ID, title and labels), `AddCardButton`, `AddColumnButton`, `AppBar`, `Menu`, `Dialog`, `Field`, `Input`, `TextArea`, `EmptyState`, `Skeleton`, `IconButton`, `Button`, `useToast` and `AppLayout`.
- i18n (react-i18next with typed keys) and the screen test stack are in place. Each feature registers its namespace in `src/app/i18n.ts`.
- The backend snapshot has board and column endpoints but no card endpoints. This change still uses the data-access seam (D6), and chunk 35 adds `core/api` code once it syncs the spec.
- **Backend split:** be-boards (archived and implemented) covers the board and column endpoints. Cards come from the later be-cards backend change: the cards in the board response, card creation for quick add, and the card count. This change doesn't depend on either; it runs against the in-memory data access. Chunk 35 (`web-boards-connect`) handles the gap if it runs before be-cards lands.
- `transfer` exposes `useExportBoard({ exportBoard })`, which returns `{ start(board), dialog }` (`add-import-export-ui`).
- Repo rules: features don't import each other, no `vi.mock` of project modules, server data lives only in the Query cache, and all text goes through react-i18next.

## Goals / Non-Goals

**Goals:**
- Every state in `specs/web-board-view`, testable without a backend.
- A typed seam that chunks 35 and 39 fill with the real API without touching the screen.
- A board structure that the drag & drop and search & filter changes can hook into: tiles and columns as separate components, and the cached board as the only source of truth.

**Non-Goals:**
- Drag & drop, search, the label filter (later changes, D1).
- The sidebar, the board list query, the rename and delete board dialogs (board list change).
- API functions, DTO mappers, MSW handlers, E2E tests (chunks 35, 39).

## Decisions

### The seam: `BoardViewDataAccess` (D6)

`features/boards/boardView/types.ts` defines the domain types and the data-access interface the app layer passes in. These are separate files from the board list (D5). They follow the board list's `BoardsDataAccess` in naming and error style.

```ts
type BoardCard = { id: string; number: number; title: string; position: number; labels: CardLabel[] }
type BoardColumn = { id: string; name: string; position: number; cards: BoardCard[] }
type BoardColumnInfo = { id: string; name: string; position: number }
type BoardDetail = { id: string; name: string; key: string; columns: BoardColumn[] }

class BoardViewError extends Error {
  kind:
    | { kind: 'notFound' }                                         // 404 with code NOT_FOUND; ROUTE_NOT_FOUND and other 404s map to 'other'
    | { kind: 'outOfRange' }                                       // 400 position/OUT_OF_RANGE
    | { kind: 'invalid'; fields: { field: 'name' | 'title'; code: string; max?: number }[] } // 400/409 field errors
    | { kind: 'other' }                                            // network, 5xx, unknown
}

type BoardViewDataAccess = {
  loadBoard(boardId: string): Promise<BoardDetail>
  createColumn(boardId: string, name: string): Promise<BoardColumnInfo>
  renameColumn(boardId: string, columnId: string, name: string): Promise<BoardColumnInfo>
  moveColumn(boardId: string, columnId: string, position: number): Promise<{ id: string; position: number }[]>
  deleteColumn(boardId: string, columnId: string): Promise<void>
  createCard(boardId: string, columnId: string, title: string): Promise<BoardCard>
}
```

Every method rejects with a `BoardViewError` on failure, the same way `BoardsDataAccess` rejects with `BoardsError`. Column methods take `boardId` because the API nests columns under `/boards/{boardId}/columns`. Column responses carry no cards, like the API's `ColumnDto`: `addColumn` creates the column with `cards: []`, and `renameColumn` copies only the name.

- **What it is:** `BoardViewDataAccess` is only the data-access interface that the data layer from chunk 35 (`web-boards-connect`) plugs into. It is not a repository layer, and nothing here adds one. Chunk 35 fills it with plain API functions as in `react-data-layer`.
- **Why its own error and not `DataError`:** `core/api` has no board code yet. Chunk 35 maps `DataError` to `BoardViewError` in one place, and that mapper applies `api-errors` › *Clients handle unknown error codes by status*. Rejecting fits TanStack Query, whose `queryFn` and `mutationFn` signal failure by throwing. The chunk 35 mapper maps only `NOT_FOUND` to `notFound`, so a route error never counts as deleted.
- **Why `notFound` has no target:** a 404 on a column change can't say whether the column or the whole board is gone. The view model always reloads the board after a 404. A 404 on that reload means the board is gone. The exception is a 404 on delete, which counts as deleted (D15).
- **Alternatives:**
  - API functions with MSW now. Rejected: needs invented paths.
  - A result union instead of rejecting. Rejected: the board list's interface rejects, and both live in the same feature.

The interface reaches `BoardViewRoot` through `BoardViewDataAccessProvider`, set by the app layer, the same way `BoardsDataAccessProvider` passes the board list's.

An in-memory implementation, `createInMemoryBoardViewDataAccess(boardsFake, options)`, lives in `features/boards/boardView/testing/`. It keeps positions dense as in `domain-ordering` and rejects with `outOfRange` for out-of-range moves. Options let a test make the next call fail with a given error, apply the next call and then reject with `other` (a lost response), hang until released, or change the stored board between calls (to act as another device). It shares its store with the board list's fake (see Mounting and data source). Tests and the preview use it. The route wiring is described below.

### Server state (D21)

- **Query:** the board is one query with the key `boardViewKeys.detail(boardId)` = `['boardView', 'detail', boardId]`. Its root is deliberately not `['boards']`, so invalidating the board list (here and in the board list's own mutations) never refetches the open board. Its `queryFn` calls `loadBoard`, which rejects with a `BoardViewError` on failure.
  - The foundation's defaults apply: `staleTime: Infinity`, no refetch on focus or reconnect, and `retry: false`. Returning to a board already in the cache shows the cached board without a request; the refresh button is the way to get changes from other devices.
  - On refetch errors Query keeps the previous data. That gives "the board stays" on a failed refresh (D16) without extra code.
- **Mutations:** each change is a `useMutation` that calls the data-access method. On success it writes the response into the cached board with a pure updater from `boardView/utils/applyChanges.ts`:
  - `addColumn` appends the column.
  - `renameColumn` replaces the column's name.
  - `applyColumnPositions` re-sorts all columns by the returned positions. If the returned column IDs differ from the cached ones, it changes nothing and the view model reloads the board silently (no toast), because the server applied the move but the board changed elsewhere.
  - `removeColumn` drops the column and moves every later column up by one, so positions stay 0..n-1 as on the server (`domain-ordering`).
  - `addCard` appends the card to its column.

  No mutation invalidates the board query after a normal success (spec › Saves apply the response). The updaters are unit-tested.
  - Every cache write after a mutation uses `setQueryData(key, (old) => old === undefined ? undefined : update(old))`, so a write never creates a board entry that is missing, for example after `queryClient.clear()` at the end of a session. The same applies to the board rename result.
  - Mutations take `boardId` in their variables and write to `boardViewKeys.detail(variables.boardId)`, never the current render's `boardId`.
  - If a board load is in flight when a mutation succeeds, the view model applies the response and then calls `invalidateQueries` on the board key (which cancels the running load and starts a new one), so a load that started before the change never overwrites it.
- **Board list cache:** after every successful column or card change (each one updates the board's updated time, `domain-board` › *Board timestamps*), the view model invalidates the `['boards']` query from the board list's `boardsQueryOptions`, which backs `useBoards`. The sidebar and board list then stay correct without a reload of the board itself.
- **Refresh:** `refetch()` on the board query. The button spins while `isFetching && !isPending`. A refetch error shows the refresh toast.
- **Alternatives:** optimistic updates (rejected by D21) and invalidate-and-refetch after each change (rejected by D21).

### Error handling

`boardView/utils/handleBoardViewError.ts` maps a `BoardViewError` from a mutation to one outcome:

| Error | Outcome |
|---|---|
| `invalid` | Field error under the input; the form stays open (spec › Server field errors) |
| `other` | Error toast for the action; the form or dialog stays open with its input (D15). For create column, create card and move column, the view model also reloads the board in the background (`api-conventions` › *Retries after a lost response*), so a change that did apply shows up before the user tries again. The inline form keeps its text through that reload (F1). |
| `notFound` on delete | Treat as deleted: remove the column locally, close the dialog |
| `notFound` otherwise | Refetch the board, then the toast "“{name}” no longer exists. The board was reloaded." |
| `outOfRange` | Refetch the board, then the stale-move toast (WBV-23) |

- If the first load returns `notFound` (no cached board), the view model calls `onNotFound`. In the app, chunk 35's route throws the router's `notFound()`, so the foundation's not-found page shows. The view model calls `onNotFound` during render when the query error is `notFound` and no data exists, so a thrown `notFound()` reaches the router's not-found boundary. The route uses no loader prefetch, on purpose: the board view shows its own skeleton with the board list's name (WBV-20), while a loader would show the blank pending page.
- If a later load returns `notFound`, the view model shows "This board no longer exists." through `useToast` and calls `onBoardGone`. A later load is a refresh or a reload after a stale change (D23).
- Field error codes map to the D13 messages (`common` `nameErrors.*`):
  - `REQUIRED` → "Enter a name."
  - `TOO_LONG` → "Use at most {max} characters."
  - `INVALID_CHARACTER` and any other code → the control-character message.

### Screen structure

Board view files live in `features/boards/boardView/` with the standard subfolders (`components/`, `hooks/` for `useBoardViewModel` and `boardViewReducer`, `utils/`, `testing/`, `types.ts`). This deviates from `react-project-structure` on purpose, to keep the shared `boards` folder free of merge clashes (D5). The namespace file stays in `features/boards/i18n/`.

The structure follows the Root/Screen split from `react-presentation-mvi`, in `features/boards/boardView/components/`:

- `BoardViewRoot({ boardId, onOpenCard, onExport, onBack, onBoardGone, onNotFound })` reads the data access from its provider, calls `useBoardViewModel` and renders `BoardViewScreen`. It also renders the board list's rename and delete board dialogs (D5).
- `BoardViewScreen` is driven by props only. It picks the state: loading, load error, no columns, or columns.
- `BoardHeader` is the tablet/desktop header at the top of the content area. `BoardAppBarContent` is the phone app bar. `BoardViewScreen` renders it inside the foundation's `<AppBarSlot>`, like the board list's Screen, so the route adds nothing for it. The phone back button calls `onBack`.
- `BoardColumns`, `BoardColumn`, `CardTile`, `QuickAddForm`, `AddColumnForm`, `ColumnMenu`, `RenameColumnDialog`, `DeleteColumnDialog`, `BoardSkeleton`.
- All columns and cards render without virtualization. Boards up to the import limits are expected to work but may be slow. Virtualization, if needed, comes with the drag & drop change, because it constrains dnd-kit.
- **Hooks for the later changes:**
  - `CardTile` and `BoardColumn` take their data as props and render no drag code, so the drag & drop change can wrap them.
  - `BoardColumns` receives the columns to show from the view model, so search & filter can pass a filtered list.

UI-only state lives in a pure reducer, `boardViewReducer`, which is unit-tested. It is separate from the Query data:

```
quickAdd:   null | { columnId, text, submitted }   // one at a time (D22)
addColumn:  null | { text, submitted }
dialog:     null | { kind: 'renameColumn' | 'deleteColumn', columnId }
               | { kind: 'renameBoard' | 'deleteBoard' }
               | { kind: 'discardInline', target: { kind: 'quickAdd', columnId } | { kind: 'addColumn' } }
movingColumnId: string | null
```

- `submitted` drives D12: an error shows after the first submit, then is derived live from the text.
- When a refetch removes the column that a quick add or dialog points to, the reducer drops that state. An effect compares the IDs with the cached board.
- Quick add text lives only here, so a refresh never touches it (D16).
- Inline form text lives in the reducer and not in React Hook Form, because the view model must read it to decide on the discard dialog (WBV-24) and to keep one form slot. `RenameColumnDialog` uses React Hook Form like the board list's `RenameBoardDialog` (`mode: 'onSubmit'`, `reValidateMode: 'onChange'`, server errors through `setError`).

### Quick add details (D22)

- The field is a `TextArea` that grows, as the title wraps on the tile.
- Enter submits and Shift+Enter is ignored, because titles are single-line. A pasted line break is left in the text and fails validation with the control-character message.
- Enter or the form's "Add card" button on an empty or whitespace-only title does nothing and shows no error.
- Enter and Escape are ignored while an IME composition is active (`event.isComposing`, or `keyCode === 229` for Safari). This applies to quick add, add column and the rename column field.
- While a create runs, the field and buttons are disabled (D15). On success the reducer clears the text and focus returns to the field.
- Outside clicks are handled with a `pointerdown` listener on `document` and a `focusout` check (`relatedTarget` outside the form). The form closes only when the text is empty after normalization.
- Quick add and add column share one slot (WBV-24). `quickAdd` and `addColumn` are never both set. Opening another inline form (quick add → quick add, quick add → add column, add column → quick add) is not an outside click:
  - If the open form's normalized text is empty, the new form replaces it.
  - If it has text, the view model sets `dialog: { kind: 'discardInline', target }` and shows `DiscardInlineDialog`.
    - It reuses the card detail's "Unsaved changes" pattern: a `core/ui` `Dialog` titled "Discard changes?" with "Keep editing" (secondary) and "Discard" (danger).
    - The body depends on the open form: "The card you started in “{column}” hasn’t been added." or "The column you started hasn’t been added."
    - "Discard" drops the text and opens the target form empty with focus.
    - "Keep editing", Escape and a backdrop click clear the dialog, then scroll the first form into view and focus its field. The focus target is set by the view model, so `core/ui` `Dialog` gets an optional `returnFocus?: boolean` prop (default `true`). With `false` it prevents `onCloseAutoFocus`, and the screen sets focus itself (`web-design-system` › *Modal overlays and keyboard*, modified by this change).
- While an inline form saves, "Add card" in other columns and "Add column" are disabled, so the dialog never has to deal with a pending save.
- Enter is ignored while a create runs (F1).

### Add column and column menu

- `AddColumnForm` renders in place of `AddColumnButton` after the last column. When there are no columns, it renders in place of the `EmptyState`. Enter submits and Escape cancels.
- After success (WBV-22):
  - The view model stores the new column's ID.
  - An effect scrolls that column into view (`scrollIntoView({ inline: 'nearest' })`) and focuses its "Add card".
- **Column menu:** a `core/ui` `Menu`.
  - Move left targets `position - 1` and Move right `position + 1`. Both are disabled at the ends and while `movingColumnId` is set. Ends and targets come from the column's index in the shown order, which equals its position while the cache is dense.
  - Dialogs open from menu items, are rendered outside the menu, and are driven by `dialog` state, because Radix unmounts menu content on close (same reason as in `add-import-export-ui`).
- **Rename (D19):** the dialog compares the normalized new name with the current name. If they are equal, it closes without calling the action.
- **Delete column:** the copy comes from i18next plural keys (`_one`, `_other`) with the column's card count.

### Validation (D12, D13)

Column names (max 30) and card titles (max 200) use the foundation's `checkText(value, { kind: 'singleLine', max })` from `core/utils/text.ts`, send its returned `value`, and map its errors to the `common` `nameErrors.*` strings with the board list's mapping. Server field codes map through the same codes (`REQUIRED`, `TOO_LONG`, `INVALID_CHARACTER`). The board view adds no validation helper or error strings of its own.

### Board menu, export and navigation (D5, L2)

- The board menu items open the board list's `RenameBoardDialog` and `DeleteBoardDialog` with a `BoardSummary` built from the cached board. Their `onClose(result)` drives what happens next:
  - `{ kind: 'renamed', board }`: `setQueryData` writes the new name into the board query, so the header changes without a reload.
  - `{ kind: 'unchanged' }`: nothing.
  - `{ kind: 'deleted' }` from `DeleteBoardDialog`: `onBoardGone` navigates to the board list without a toast (F3).
  - `{ kind: 'deleted' }` from `RenameBoardDialog`: the board was deleted elsewhere (a rename 404 reports `deleted`). The dialog already showed "“{name}” no longer exists.", so the view model only calls `onBoardGone`, without a toast of its own. The call site knows which dialog it opened, so it tells the two `deleted` results apart.
- Before calling `onBoardGone` (after a delete, a rename that reports `deleted`, or a board 404 on a later load), the view model calls `removeQueries` for `boardViewKeys.detail(boardId)`.
- `onExport` comes from the host: chunk 35's route in the app, the playground on the preview page. The host calls `useExportBoard` from `transfer` and renders its `dialog`. Feature code never imports `transfer`.

### Mounting and data source (F6)

This change adds no route. Like the board list, it mounts nothing in the app before chunk 35: the foundation's routes stay as they are, and no component that needs `BoardViewDataAccessProvider` is rendered without one.

Chunk 35 adds the board route (`/boards/$boardId`, named after the foundation's route layout) together with the providers. The route then renders `BoardViewRoot` with these props:

- `boardId` from the path params.
- `onOpenCard` (a no-op until card detail lands).
- `onExport` from `useExportBoard`, with its dialog.
- `onBack` and `onBoardGone`, which navigate to the board list with `replace`.
- `onNotFound`, which throws the router's `notFound()`.

`BoardViewRoot` does no routing itself, so it runs the same in the app, in feature tests and on the preview page.

Chunk 35's route renders `BoardViewRoot` with `key={boardId}`, so switching boards resets all view-model state. Results that arrive after the switch don't show toasts or navigate. Leaving the board drops the text of an open inline form without asking.

In-memory data lives only in tests and on the preview page. `createInMemoryBoardViewDataAccess` builds its default boards from the board list's `sampleBoards` (`features/boards/testing/sampleBoards.ts`). It uses the same IDs, names and keys, and columns and cards that match each board's card count. The Figma board "Cardigan v1" gets the columns and cards from page `9:6`.

`createInMemoryBoardViewDataAccess(boardsFake, options)` shares one store with a `createInMemoryBoardsDataAccess` instance. It reads and writes the same boards, so `listBoards` derives `cardCount` and `updatedAt` from the board view's columns and cards, and a rename or delete through `BoardsDataAccess` shows in `loadBoard`. Tests and the preview provide both `BoardsDataAccessProvider` and `BoardViewDataAccessProvider` from that pair. The preview playground also wraps `BoardViewRoot` in `AppBarSlotProvider` and wires `useExportBoard` from `transfer` (the preview may import features).

### Accessible names (F4)

The names come from the `boardView` namespace:
- `IconButton` labels: "Back", "Board actions", "Actions for column “{name}”".
- The `AddCardButton` label "Add card to “{name}”".
- `AddColumnButton`: "Add column".

`CardTile` sets `aria-label` to "{displayId}, {title}, labels {a}, {b}". The labels come in their displayed order, joined with ", ", and the labels part is left out when there are none. This replaces the visible text as the tile's name, so screen readers don't read the ID and title as one run-on string. Screen tests check each name with `getByRole(…, { name })`.

### i18n

Board view strings live in their own namespace, `boardView` (`features/boards/i18n/boardView.json`), registered in `src/app/i18n.ts` (D5). The Figma copy on page `9:6` is the source. The copy without a design comes from proposal.md. "Cancel", "Save" and "Try again" come from `common` if that namespace already has them.

### Tests

- **Unit:** `boardViewReducer`, the `applyChanges` updaters, `handleBoardViewError`, and the in-memory data access's position handling.
- **Screen:** `BoardViewScreen` per state (loading with and without a known name, load error, no columns, empty columns, board with cards), the header plurals, and the column menu's disabled items. Rendered with props only.
- **Feature:** `BoardViewRoot` with a real `QueryClient`, the in-memory data access in its provider and spy callbacks for navigation, driven with user-event. It covers every scenario in the spec: quick add rules, add column, move/rename/delete, failures, field errors, refresh, stale recovery and board not found.
  - The harness renders `AppBarSlotProvider` with its target, `ToastProvider`, `BoardViewDataAccessProvider` with `createInMemoryBoardViewDataAccess`, and `BoardsDataAccessProvider` with `createInMemoryBoardsDataAccess`. Both are seeded from `sampleBoards` and share one store. Loading tests seed or leave empty the `['boards']` query to choose between known and unknown name.
  - jsdom has no `scrollIntoView`. Feature tests install a recording stub on `Element.prototype.scrollIntoView` (a browser global, so the no-`vi.mock` rule holds) and assert it was called on the kept form, or on the new column with `{ inline: 'nearest' }`. The real scrolling is checked on the preview page.
  - The fake rejects with `BoardViewError` kinds. A scenario's status maps to a kind as in The seam: no response, 5xx and unknown → `other`; 400/409 with field errors → `invalid`; 404 with `NOT_FOUND` → `notFound`; `OUT_OF_RANGE` → `outOfRange`. Chunk 35's mapper tests cover status → kind.
- **Size-dependent behavior:** visibility per size, the 300 px column width, the lack of snapping and the tablet layout can't be seen in jsdom. Screen tests check structure only (the app bar content has no Refresh button; the hint carries the phone-hidden class). The preview page checks at 390, 834 and 1440 px (task groups 3–7) are the verification for these.
- No `vi.mock`. The only fakes are the in-memory data-access implementations.

## Risks / Trade-offs

- **[Two prerequisite changes]** The foundation and board list changes must land first, and the shell slot API isn't final. → Task group 1 rebases and checks what they actually expose before any screen code. Differences are fixed in this change's design before implementation goes on.
- **[Shared `boards` folder]** Parallel work in the same feature folder. → Board view files stay under `features/boards/boardView/`, with their own namespace file. Only `features/boards/index.ts` and `src/app/i18n.ts` are shared, as one-line additions. The board list's in-memory fake must accept a shared store (Mounting and data source); task group 1 checks this.
- **[Seam drifts from the real API]** The action shapes are written before the endpoints exist. → They use only behavior from the shared specs (dense positions, move responses with all columns, field error codes). Chunk 35 adds the mapper and its tests.
- **[Cards depend on be-cards]** Cards on the board, quick add and the card counts need be-cards, which comes after be-boards. → No effect on this change. Chunk 35 decides how the board view behaves if it connects before be-cards exists.
- **[No board view in the running app before chunk 35]** Nothing is mounted in the app until the real data layer exists (F6). → The preview page shows every state with in-memory data, and Figma checks run there.
- **[Focus after "Keep editing"]** Radix dialogs return focus to their trigger, but here focus has to go to the first form. → `core/ui` `Dialog` gets a `returnFocus` prop; this dialog sets it to `false` and the view model focuses the field. A screen test checks it.
