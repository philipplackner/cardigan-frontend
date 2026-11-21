# Design

## Context

See proposal.md › Why. The current state that shapes the approach:

- **Dependencies:** this change builds on two changes that must land first:
  - The web foundation change (D4): TanStack Router with file routes in `src/app/routes`, the TanStack Query client, the empty shell layout and a normalize-and-count text helper in `core/utils`.
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

### The seam: `BoardViewActions` (D6)

`features/boards/boardView/types.ts` defines the domain types and the actions the app layer passes in. These are separate files from the board list (D5).

```ts
type BoardCard = { id: string; number: number; title: string; position: number; labels: CardLabel[] }
type BoardColumn = { id: string; name: string; position: number; cards: BoardCard[] }
type BoardDetail = { id: string; name: string; key: string; columns: BoardColumn[] }

type ActionError =
  | { kind: 'notFound' }                                      // 404
  | { kind: 'outOfRange' }                                    // 400 position/OUT_OF_RANGE
  | { kind: 'field'; field: 'name' | 'title'; code: string; max?: number } // 400/409 field error
  | { kind: 'other' }                                         // network, 5xx, unknown

type Result<T> = { ok: true; value: T } | { ok: false; error: ActionError }

type BoardViewActions = {
  loadBoard(boardId: string): Promise<Result<BoardDetail>>
  createColumn(boardId: string, name: string): Promise<Result<BoardColumn>>
  renameColumn(columnId: string, name: string): Promise<Result<BoardColumn>>
  moveColumn(columnId: string, position: number): Promise<Result<{ id: string; position: number }[]>>
  deleteColumn(columnId: string): Promise<Result<void>>
  createCard(columnId: string, title: string): Promise<Result<BoardCard>>
}
```

- **Why a result union and not `DataError`:** `core/api` has no board code yet. The same reasoning applies as in `add-import-export-ui`. Chunk 35 writes one mapper from `DataError` to `ActionError`, and that mapper applies `api-errors` › *Clients handle unknown error codes by status*.
- **Why `notFound` has no target:** a 404 on a column change can't say whether the column or the whole board is gone. The view model always reloads the board after a 404. A 404 on that reload means the board is gone. The exception is a 404 on delete, which counts as deleted (D15).
- **Alternatives:**
  - API functions with MSW now. Rejected: needs invented paths.
  - A generic repository class. Rejected: CLAUDE.md asks for plain functions. The seam is a plain object of functions that chunk 35 builds from API functions.

An in-memory fake, `createFakeBoardViewActions(seed, options)`, lives in `features/boards/boardView/testing/`. It keeps positions dense as in `domain-ordering` and returns `outOfRange` for out-of-range moves. Options let a test make the next call fail with a given error or hang until released. Tests and the preview use it. The route wiring is described below.

### Server state (D21)

- **Query:** the board is one query, `boardViewKeys.detail(boardId)`. Its `queryFn` calls `loadBoard`. On `ok: false` it throws a `BoardViewLoadError` that carries the `ActionError`.
  - `retry` is off for `notFound`.
  - On refetch errors Query keeps the previous data. That gives "the board stays" on a failed refresh (D16) without extra code.
- **Mutations:** each change is a `useMutation` that calls the action. On success it writes the response into the cached board with a pure updater from `boardView/utils/applyChanges.ts`:
  - `addColumn` appends the column.
  - `renameColumn` replaces the column's name.
  - `applyColumnPositions` re-sorts all columns by the returned positions.
  - `removeColumn` drops the column.
  - `addCard` appends the card to its column.

  No mutation invalidates the board query (spec › Saves apply the response). The updaters are unit-tested.
- **Board list cache:** after a change that alters the card count or the board's updated time, the view model invalidates the board list query (owned by the board list change). The sidebar and board list then stay correct without a reload of the board itself.
- **Refresh:** `refetch()` on the board query. The button spins while `isFetching && !isPending`. A refetch error shows the refresh toast.
- **Alternatives:** optimistic updates (rejected by D21) and invalidate-and-refetch after each change (rejected by D21).

### Error handling

`boardView/utils/handleActionError.ts` maps an `ActionError` from a mutation to one outcome:

| Error | Outcome |
|---|---|
| `field` | Field error under the input; the form stays open (spec › Server field errors) |
| `other` | Error toast for the action; the form stays open with its input (D15) |
| `notFound` on delete | Treat as deleted: remove the column locally, close the dialog |
| `notFound` otherwise | Refetch the board, then the toast "“{name}” no longer exists. The board was reloaded." |
| `outOfRange` | Refetch the board, then the stale-move toast (WBV-23) |

- If any load returns `notFound`, the view model shows "This board no longer exists." through `useToast` and navigates to the board list route with `replace`. That covers the first load, a refresh, and a reload after a stale change.
- Field error codes map to the D13 messages:
  - `REQUIRED` → "Enter a name."
  - `TOO_LONG` → "Use at most {max} characters."
  - Any other code → the control-character message.

### Screen structure

The structure follows the Root/Screen split from `react-presentation-mvi`, in `features/boards/boardView/components/`:

- `BoardViewRoot({ boardId, actions, onOpenCard, onExport, onBoardDeleted })` calls `useBoardViewModel` and renders `BoardViewScreen`. It also renders the board list's rename and delete board dialogs (D5).
- `BoardViewScreen` is driven by props only. It picks the state: loading, load error, no columns, or columns.
- `BoardHeader` is the tablet/desktop header. `BoardAppBarContent` is the phone app bar content. Both are exported. The route puts each into the slot the foundation shell gives for page header and phone app bar content (D3). If the shell has no such slot, the header renders at the top of the content area and the app bar content goes to `AppLayout`'s `appBar`. The foundation change decides this.
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
- Opening another column's quick add is not an outside click. Because only one form can be open (D22), it replaces the first form and drops its text, even when that text isn't empty.

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

- The board menu items open the board list's rename and delete dialogs with the board summary built from the cached board. After a rename, the dialog's success path updates the board query's name with `setQueryData`, so the header changes without a reload.
- After a delete, `onBoardDeleted` navigates to the board list.
- `onExport` comes from the route. The route calls `useExportBoard` from `transfer` and renders its `dialog`. Feature code never imports `transfer`.

### Route and data source

`src/app/routes/boards.$boardId.tsx` (the exact file name follows the foundation's route layout) renders `BoardViewRoot` with:

- `boardId` from the path params.
- `actions` from the app layer's board data module.
- `onOpenCard` (a no-op until card detail lands).
- `onExport` from `useExportBoard`.
- Navigation to the board list.

Until chunk 35, the app layer passes the in-memory fake seeded with sample boards, the same way the board list change wires its own data source. Chunk 35 swaps in the real actions in one place.

### i18n

Board view strings live in their own namespace, `boardView` (`features/boards/i18n/boardView.json`), registered in `src/app/i18n.ts` (D5). The Figma copy on page `9:6` is the source. The copy without a design comes from proposal.md. "Cancel", "Save" and "Try again" come from `common` if that namespace already has them.

### Tests

- **Unit:** `validateName`, `boardViewReducer`, the `applyChanges` updaters, `handleActionError`, and the fake's position handling.
- **Screen:** `BoardViewScreen` per state (loading with and without a known name, load error, no columns, empty columns, board with cards), the header plurals, and the column menu's disabled items. Rendered with props only.
- **Feature:** `BoardViewRoot` with a real `QueryClient`, a memory router and the fake actions, driven with user-event. It covers every scenario in the spec: quick add rules, add column, move/rename/delete, failures, field errors, refresh, stale recovery and board not found.
- **Route:** the board route renders with the fake actions and the board list route as the 404 target.
- No `vi.mock`. The only fakes are the injected actions.

## Risks / Trade-offs

- **[Two prerequisite changes]** The foundation and board list changes must land first, and the shell slot API isn't final. → Task group 1 rebases and checks what they actually expose before any screen code. Differences are fixed in this change's design before implementation goes on.
- **[Shared `boards` folder]** Parallel work in the same feature folder. → Board view files stay under `features/boards/boardView/`, with their own namespace file. Only `features/boards/index.ts` and `src/app/i18n.ts` are shared, as one-line additions.
- **[Seam drifts from the real API]** The action shapes are written before the endpoints exist. → They use only behavior from the shared specs (dense positions, move responses with all columns, field error codes). Chunk 35 adds the mapper and its tests.
- **[Fake data in the running app]** The route shows sample data until chunk 35. → It is the same approach as the board list change, and it's replaced in one module.
- **[Pending decisions]** WBV-19, WBV-20, WBV-22 and WBV-23 were sent to the coordinator. → The spec and this design use the recommended options. If an answer differs, the affected requirement and tasks are updated before implementation.

## Open Questions

- The slot the foundation shell gives for page header and phone app bar content. Settled when task 1.1 rebases. It doesn't change the specs.
