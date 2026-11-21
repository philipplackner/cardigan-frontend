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
- There are no board, column or card endpoints in the OpenAPI snapshot, so no `core/api` code can be written for them.
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
type BoardDetail = { id: string; name: string; key: string; columns: BoardColumn[] }

class BoardViewError extends Error {
  kind:
    | { kind: 'notFound' }                                         // 404
    | { kind: 'outOfRange' }                                       // 400 position/OUT_OF_RANGE
    | { kind: 'invalid'; fields: { field: 'name' | 'title'; code: string; max?: number }[] } // 400/409 field errors
    | { kind: 'other' }                                            // network, 5xx, unknown
}

type BoardViewDataAccess = {
  loadBoard(boardId: string): Promise<BoardDetail>
  createColumn(boardId: string, name: string): Promise<BoardColumn>
  renameColumn(columnId: string, name: string): Promise<BoardColumn>
  moveColumn(columnId: string, position: number): Promise<{ id: string; position: number }[]>
  deleteColumn(columnId: string): Promise<void>
  createCard(columnId: string, title: string): Promise<BoardCard>
}
```

Every method rejects with a `BoardViewError` on failure, the same way `BoardsDataAccess` rejects with `BoardsError`.

- **What it is:** `BoardViewDataAccess` is only the data-access interface that the data layer from chunk 35 (`web-boards-connect`) plugs into. It is not a repository layer, and nothing here adds one. Chunk 35 fills it with plain API functions as in `react-data-layer`.
- **Why its own error and not `DataError`:** `core/api` has no board code yet. Chunk 35 maps `DataError` to `BoardViewError` in one place, and that mapper applies `api-errors` › *Clients handle unknown error codes by status*. Rejecting fits TanStack Query, whose `queryFn` and `mutationFn` signal failure by throwing.
- **Why `notFound` has no target:** a 404 on a column change can't say whether the column or the whole board is gone. The view model always reloads the board after a 404. A 404 on that reload means the board is gone. The exception is a 404 on delete, which counts as deleted (D15).
- **Alternatives:**
  - API functions with MSW now. Rejected: needs invented paths.
  - A result union instead of rejecting. Rejected: the board list's interface rejects, and both live in the same feature.

The interface reaches `BoardViewRoot` through `BoardViewDataAccessProvider`, set by the app layer, the same way `BoardsDataAccessProvider` passes the board list's.

An in-memory implementation, `createInMemoryBoardViewDataAccess(seed, options)`, lives in `features/boards/boardView/testing/`. It keeps positions dense as in `domain-ordering` and rejects with `outOfRange` for out-of-range moves. Options let a test make the next call fail with a given error or hang until released. Tests and the preview use it. The route wiring is described below.

### Server state (D21)

- **Query:** the board is one query, `boardViewKeys.detail(boardId)`. Its `queryFn` calls `loadBoard`, which rejects with a `BoardViewError` on failure.
  - The foundation's defaults apply: `staleTime: Infinity`, no refetch on focus or reconnect, and `retry: false`. Returning to a board already in the cache shows the cached board without a request; the refresh button is the way to get changes from other devices.
  - On refetch errors Query keeps the previous data. That gives "the board stays" on a failed refresh (D16) without extra code.
- **Mutations:** each change is a `useMutation` that calls the data-access method. On success it writes the response into the cached board with a pure updater from `boardView/utils/applyChanges.ts`:
  - `addColumn` appends the column.
  - `renameColumn` replaces the column's name.
  - `applyColumnPositions` re-sorts all columns by the returned positions.
  - `removeColumn` drops the column.
  - `addCard` appends the card to its column.

  No mutation invalidates the board query (spec › Saves apply the response). The updaters are unit-tested.
- **Board list cache:** after a change that alters the card count or the board's updated time, the view model invalidates the `['boards']` query from the board list's `boardsQueryOptions`, which backs `useBoards`. The sidebar and board list then stay correct without a reload of the board itself.
- **Refresh:** `refetch()` on the board query. The button spins while `isFetching && !isPending`. A refetch error shows the refresh toast.
- **Alternatives:** optimistic updates (rejected by D21) and invalidate-and-refetch after each change (rejected by D21).

### Error handling

`boardView/utils/handleBoardViewError.ts` maps a `BoardViewError` from a mutation to one outcome:

| Error | Outcome |
|---|---|
| `invalid` | Field error under the input; the form stays open (spec › Server field errors) |
| `other` | Error toast for the action; the form stays open with its input (D15) |
| `notFound` on delete | Treat as deleted: remove the column locally, close the dialog |
| `notFound` otherwise | Refetch the board, then the toast "“{name}” no longer exists. The board was reloaded." |
| `outOfRange` | Refetch the board, then the stale-move toast (WBV-23) |

- If the first load returns `notFound` (no cached board), the view model throws the router's `notFound()`, so the foundation's not-found page shows.
- If a later load returns `notFound`, the view model shows "This board no longer exists." through `useToast` and navigates to the board list route with `replace`. A later load is a refresh or a reload after a stale change (D23).
- Field error codes map to the D13 messages:
  - `REQUIRED` → "Enter a name."
  - `TOO_LONG` → "Use at most {max} characters."
  - Any other code → the control-character message.

### Screen structure

The structure follows the Root/Screen split from `react-presentation-mvi`, in `features/boards/boardView/components/`:

- `BoardViewRoot({ boardId, onOpenCard, onExport, onBoardDeleted })` reads the data access from its provider, calls `useBoardViewModel` and renders `BoardViewScreen`. It also renders the board list's rename and delete board dialogs (D5).
- `BoardViewScreen` is driven by props only. It picks the state: loading, load error, no columns, or columns.
- `BoardHeader` is the tablet/desktop header at the top of the content area. `BoardAppBarContent` is the phone app bar. The route puts it into the shell's top-bar slot (D3).
- `BoardColumns`, `BoardColumn`, `CardTile`, `QuickAddForm`, `AddColumnForm`, `ColumnMenu`, `RenameColumnDialog`, `DeleteColumnDialog`, `BoardSkeleton`.
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

### Quick add details (D22)

- The field is a `TextArea` that grows, as the title wraps on the tile.
- Enter submits and Shift+Enter is ignored, because titles are single-line. A pasted line break is left in the text and fails validation with the control-character message.
- While a create runs, the field and buttons are disabled (D15). On success the reducer clears the text and focus returns to the field.
- Outside clicks are handled with a `pointerdown` listener on `document` and a `focusout` check (`relatedTarget` outside the form). The form closes only when the text is empty after normalization.
- Quick add and add column share one slot (WBV-24). `quickAdd` and `addColumn` are never both set. Opening another inline form (quick add → quick add, quick add → add column, add column → quick add) is not an outside click:
  - If the open form's normalized text is empty, the new form replaces it.
  - If it has text, the view model sets `dialog: { kind: 'discardInline', target }` and shows `DiscardInlineDialog`.
    - It reuses the card detail's "Unsaved changes" pattern: a `core/ui` `Dialog` titled "Discard changes?" with "Keep editing" (secondary) and "Discard" (danger).
    - The body depends on the open form: "The card you started in “{column}” hasn’t been added." or "The column you started hasn’t been added."
    - "Discard" drops the text and opens the target form empty with focus.
    - "Keep editing", Escape and a backdrop click clear the dialog, then scroll the first form into view and focus its field. The focus target is set by the view model, so Radix's return-focus to the trigger is turned off for this dialog.
- While an inline form saves, "Add card" in other columns and "Add column" are disabled, so the dialog never has to deal with a pending save.
- Enter is ignored while a create runs (F1).

### Add column and column menu

- `AddColumnForm` renders in place of `AddColumnButton` after the last column. When there are no columns, it renders in place of the `EmptyState`. Enter submits and Escape cancels.
- After success (WBV-22):
  - The view model stores the new column's ID.
  - An effect scrolls that column into view (`scrollIntoView({ inline: 'nearest' })`) and focuses its "Add card".
- **Column menu:** a `core/ui` `Menu`.
  - Move left targets `position - 1` and Move right `position + 1`. Both are disabled at the ends and while `movingColumnId` is set.
  - Dialogs open from menu items, are rendered outside the menu, and are driven by `dialog` state, because Radix unmounts menu content on close (same reason as in `add-import-export-ui`).
- **Rename (D19):** the dialog compares the normalized new name with the current name. If they are equal, it closes without calling the action.
- **Delete column:** the copy comes from i18next plural keys (`_one`, `_other`) with the column's card count.

### Validation (D12, D13)

`boardView/utils/validateName.ts` returns `null | { code: 'REQUIRED' | 'TOO_LONG' | 'INVALID_CHARACTERS'; max?: number }` for a value and a maximum length (30 for columns, 200 for titles). It uses the foundation's normalize-and-count helper from `core/utils`. Control characters U+0000–U+001F (including tab and LF) and unpaired surrogates fail as `INVALID_CHARACTERS`. Unit tests cover:

- Empty, whitespace only, 30 and 31 code points.
- An emoji counted as 1, a ZWJ sequence counted per code point, a decomposed "é".
- A tab, a pasted CRLF, U+0000, and a lone surrogate.

### Board menu, export and navigation (D5, L2)

- The board menu items open the board list's `RenameBoardDialog` and `DeleteBoardDialog` with a `BoardSummary` built from the cached board. Their `onClose(result)` drives what happens next:
  - `{ kind: 'renamed', board }`: `setQueryData` writes the new name into the board query, so the header changes without a reload.
  - `{ kind: 'unchanged' }`: nothing.
  - `{ kind: 'deleted' }` from `DeleteBoardDialog`: `onBoardDeleted` navigates to the board list without a toast (F3).
  - `{ kind: 'deleted' }` from `RenameBoardDialog`: the board was deleted elsewhere (a rename 404 reports `deleted`). The dialog already showed "“{name}” no longer exists.", so the view model only navigates to the board list, without a toast of its own. The call site knows which dialog it opened, so it tells the two `deleted` results apart.
- `onExport` comes from the route. The route calls `useExportBoard` from `transfer` and renders its `dialog`. Feature code never imports `transfer`.

### Route and data source

`src/app/routes/boards.$boardId.tsx` (the exact file name follows the foundation's route layout) renders `BoardViewRoot` with:

- `boardId` from the path params.
- `onOpenCard` (a no-op until card detail lands).
- `onExport` from `useExportBoard`.
- Navigation to the board list.

The app has no in-memory data (F6). The app layer provides `BoardViewDataAccessProvider` only when chunk 35 brings the real data layer, together with `BoardsDataAccessProvider`. Until then, the board route shows an empty content area, the same way `/` stays empty in the board list change. Task 1.1 checks how the board list renders its route without a provider, and `BoardViewRoot` does the same.

In-memory data lives only in tests and on the preview page. `createInMemoryBoardViewDataAccess` builds its default boards from the board list's `sampleBoards` (`features/boards/testing/sampleBoards.ts`). It uses the same IDs, names and keys, and columns and cards that match each board's card count. The Figma board "Cardigan v1" gets the columns and cards from page `9:6`.

### Accessible names (F4)

The names come from the `boardView` namespace:
- `IconButton` labels: "Back", "Board actions", "Actions for column “{name}”".
- The `AddCardButton` label "Add card to “{name}”".
- `AddColumnButton`: "Add column".

`CardTile` sets `aria-label` to "{displayId}, {title}, labels {a}, {b}". The labels come in their displayed order, joined with ", ", and the labels part is left out when there are none. This replaces the visible text as the tile's name, so screen readers don't read the ID and title as one run-on string. Screen tests check each name with `getByRole(…, { name })`.

### i18n

Board view strings live in their own namespace, `boardView` (`features/boards/i18n/boardView.json`), registered in `src/app/i18n.ts` (D5). The Figma copy on page `9:6` is the source. The copy without a design comes from proposal.md. "Cancel", "Save" and "Try again" come from `common` if that namespace already has them.

### Tests

- **Unit:** `validateName`, `boardViewReducer`, the `applyChanges` updaters, `handleBoardViewError`, and the in-memory data access's position handling.
- **Screen:** `BoardViewScreen` per state (loading with and without a known name, load error, no columns, empty columns, board with cards), the header plurals, and the column menu's disabled items. Rendered with props only.
- **Feature:** `BoardViewRoot` with a real `QueryClient`, a memory router and the in-memory data access, driven with user-event. It covers every scenario in the spec: quick add rules, add column, move/rename/delete, failures, field errors, refresh, stale recovery and board not found.
- **Route:** with a test-only `BoardViewDataAccessProvider` around the router, the board route loads the board from the URL and uses the board list route as the 404 target. Without a provider it renders an empty content area.
- No `vi.mock`. The only fakes are the in-memory data-access implementations.

## Risks / Trade-offs

- **[Two prerequisite changes]** The foundation and board list changes must land first, and the shell slot API isn't final. → Task group 1 rebases and checks what they actually expose before any screen code. Differences are fixed in this change's design before implementation goes on.
- **[Shared `boards` folder]** Parallel work in the same feature folder. → Board view files stay under `features/boards/boardView/`, with their own namespace file. Only `features/boards/index.ts` and `src/app/i18n.ts` are shared, as one-line additions.
- **[Seam drifts from the real API]** The action shapes are written before the endpoints exist. → They use only behavior from the shared specs (dense positions, move responses with all columns, field error codes). Chunk 35 adds the mapper and its tests.
- **[No board view in the running app before chunk 35]** The route shows an empty content area until the real data layer exists (F6). → The preview page shows every state with in-memory data, and Figma checks run there.
- **[Focus after "Keep editing"]** Radix dialogs return focus to their trigger, but here focus has to go to the first form. → `onCloseAutoFocus` is prevented for this dialog and the view model focuses the field. A screen test checks it.
