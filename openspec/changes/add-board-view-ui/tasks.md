# Tasks

Each group ends in its own commit once all five gates pass (`typecheck`, `lint`, `format:check`, `test`, `build`).

**Checking against Figma:**
- Open the board view playground on the preview page at 390 px, 834 px and 1440 px wide, in light and dark system themes.
- Compare it with `get_screenshot` of the matching frame on page `9:6`. Tablet uses the desktop frames (D20).
- Look frames up with `get_metadata 9:6`. Don't use node IDs copied from this file.

## 1. Prerequisites

- [x] 1.1 Rebase onto the merged web foundation and board list changes. Verify that TanStack Router, TanStack Query, the shell layout, the `core/utils` normalize-and-count helper, the board summary type, `useBoards` and the rename/delete board dialogs exist. Check that the shell's top-bar slot, the blank not-found component and the Query defaults (`staleTime: Infinity`, no auto refetch, `retry: false`) match design.md › Context. Check that `BoardsDataAccess`, `BoardsDataAccessProvider`, `createInMemoryBoardsDataAccess`, `BoardSummary`, `useBoards`, `RenameBoardDialog`, `DeleteBoardDialog`, `boardsQueryOptions`, `sampleBoards`, `AppBarSlot`/`AppBarSlotProvider` and the foundation's `checkText` with the board list's mapping to the `common` `nameErrors.*` strings exist as design.md expects. Check that `createInMemoryBoardsDataAccess` can share its store with the board view fake (design.md › Mounting and data source). Verify that the board list mounts nothing in the app either. Verify that all five gates pass before any new code

## 2. Types, in-memory data access, pure logic and translations

- [x] 2.1 Add `features/boards/boardView/types.ts` (`BoardDetail`, `BoardColumn`, `BoardColumnInfo`, `BoardCard`, `BoardViewError`, `BoardViewDataAccess`, `BoardViewDataAccessProvider`) as in design.md, and verify `npm run typecheck` passes
- [x] 2.2 Add `createInMemoryBoardViewDataAccess` in `boardView/testing/`, seeded by default from `sampleBoards` (same IDs, names and keys, card counts matching, "Cardigan v1" with the Figma columns and cards), with dense positions, rejecting with `outOfRange` for out-of-range moves and `notFound` for unknown IDs, and options to fail the next call, apply the next call and then reject with `other`, hang the next call, or change the stored board between calls. It shares one store with a `createInMemoryBoardsDataAccess` instance (design.md › Mounting and data source). Add unit tests:
  - Positions stay 0..n-1 after create, move and delete.
  - Moving to n rejects with `outOfRange`.
  - A forced failure rejects with the given error once.
  - A card added through the board view fake raises `cardCount` in the boards fake's `listBoards`, and a board rename through the boards fake shows in `loadBoard`.
- [x] 2.3 Verify the name checks through `checkText(value, { kind: 'singleLine', max })` and the `nameErrors.*` mapping cover 30/31 and 200/201 code points; add those cases to the tests if missing
- [x] 2.4 Add the `applyChanges` updaters (`addColumn`, `renameColumn`, `applyColumnPositions`, `removeColumn`, `addCard`) with unit tests. They must not mutate the input. Column order must follow the returned positions. A response whose ID set differs from the cache returns the board unchanged and signals a reload. `removeColumn` renumbers the remaining columns 0..n-1. An updater called with no cached board leaves the cache empty (feature test: clear the `QueryClient` while a create is held by the in-memory "hang" option, release it, and check that `getQueryData(boardViewKeys.detail(id))` is `undefined`). Verify they pass
- [x] 2.5 Add `handleBoardViewError` with unit tests for every row of the table in design.md › Error handling, including `notFound` on delete counting as deleted and an unknown field code mapping to the control-character message
- [x] 2.6 Add `boardViewReducer` (quick add, add column, dialogs, moving column) with unit tests:
  - Quick add and add column are never open together.
  - Opening another inline form replaces an empty one, and sets `discardInline` when the open one has text.
  - "Discard" opens the target form empty, and "Keep editing" keeps the first form and its text.
  - Submitted flags drive errors.
  - A column removed by a refetch clears the quick add and dialog state that point to it.
- [x] 2.7 Add the `boardView` namespace (`features/boards/i18n/boardView.json`) and register it in `src/app/i18n.ts`. It holds every string from page `9:6` that this change uses, the proposal copy and plural keys for cards. The name and title error messages come from `common` `nameErrors.*` and are not copied here. Verify each string matches Figma or the proposal character for character, including curly quotes and apostrophes

## 3. Board screen and states

- [x] 3.1 Add `BoardViewScreen`, `BoardHeader`, `BoardAppBarContent`, `BoardColumns`, `BoardColumn`, `CardTile` and `BoardSkeleton` from `core/ui` components. Write screen tests:
  - Columns and cards in position order.
  - Tile content with sorted labels.
  - Header and subtitle plurals with 0, 1 and 12 cards.
  - "No cards yet" in empty columns.
  - The no-columns empty state.
  - The loading state with and without a known name.
  - The load error state.
- [x] 3.2 Add `useBoardViewModel` and `BoardViewRoot` with the board query, the `onOpenCard`, `onBack`, `onBoardGone` and `onNotFound` callbacks, "Try again", and the board-gone toast. `BoardViewScreen` renders `BoardAppBarContent` inside `<AppBarSlot>`. Write feature tests with the harness from design.md › Tests (both providers over a shared in-memory store, `AppBarSlotProvider`, a real `QueryClient`) and spy callbacks:
  - Load success and load failure.
  - "Try again".
  - Enter on a tile calls `onOpenCard` with the card ID.
  - A 404 on the first load calls `onNotFound` without a toast.
  - A 404 on refresh shows "This board no longer exists." and calls `onBoardGone`.
  - The phone back button in the app bar slot calls `onBack`.
  - The phone app bar content contains no button named "Refresh".
  - Re-render with another `boardId` while a create is held; release it; the second board's cache and screen are unchanged.
  - The accessible names from spec › Accessible names: "Back", "Board actions", "Actions for column “{name}”", "Add card to “{name}”", "Add column", and tile names with and without labels.
- [x] 3.3 Add a board view playground to the preview page: `BoardViewRoot` in `AppBarSlotProvider`, `BoardsDataAccessProvider` and `BoardViewDataAccessProvider` over one shared in-memory store, a board picker over `sampleBoards`, and callbacks that log navigation. Don't mount anything in the app (F6). Check Board (390, 834, 1440), Loading, Couldn’t load the board and New board with default columns against Figma

## 4. Quick add

- [x] 4.1 Add `QuickAddForm` and wire it into `BoardColumn` and the view model. Write feature tests for every scenario in spec › Opening quick add, Adding a card, Closing quick add, Name and title validation (titles) and Saving state:
  - Two cards in a row.
  - Whitespace only, with Enter and with the "Add card" button.
  - Enter with `isComposing: true` creates nothing.
  - Escape and outside click with and without text, outside click with only spaces, and tabbing out with text.
  - Opening a second form.
  - A 201-character title and a pasted line break.
  - Disabled controls, Escape and a second Enter while saving.
  - The add-card failure toast with the text kept, and a background reload that shows a card the server created before the response was lost.
  - A 404 on create reloading the board with the "no longer exists" toast.
- [x] 4.2 Check Quick add card (390, 1440) against Figma, including the "Enter to add" hint only on desktop and tablet

## 5. Add column, the empty board and discarding started text

- [x] 5.1 Add `AddColumnForm` after the last column and in place of the no-columns empty state. After success, scroll the new column into view and focus its "Add card". Write feature tests:
  - Add from the end and from the empty state.
  - Duplicate names allowed.
  - Empty, 31-character and control-character names with live updates after the first submit.
  - Enter with `isComposing: true` creates nothing.
  - The new column is scrolled into view (recording `scrollIntoView` stub) and its "Add card" has focus.
  - A server field error under the field.
  - The add-column failure toast with the form kept open, and the background reload after the failure.
  - No board reload after success (the in-memory `loadBoard` is called once).
- [x] 5.2 Add an optional `returnFocus?: boolean` prop (default `true`) to `core/ui` `Dialog`. With `false` it prevents `onCloseAutoFocus`. Add a test that `false` leaves focus where the screen put it, and a preview entry
- [x] 5.3 Add `DiscardInlineDialog` ("Discard changes?", the card or column body, "Keep editing", "Discard") following the card detail's "Unsaved changes" pattern, and wire it for quick add → quick add, quick add → add column, and add column → quick add. Write feature tests:
  - Each of the three switches with text asks, with the right body.
  - "Discard" opens the target form empty with focus.
  - "Keep editing", Escape and a backdrop click keep the first form with its text, scrolled into view (recording `scrollIntoView` stub) and focused, and open no new form.
  - An empty first form closes without the dialog.
  - "Add card" in other columns and "Add column" are disabled while a save runs.
  - Cancel and Escape in a form still discard without asking.

  Compare the dialog with Figma "Unsaved changes · Desktop 1440" and "· Phone 390" on page `9:7`.
- [x] 5.4 Check Add column (1440) and All columns deleted (1440) against Figma, and the phone at 390 px against the desktop pattern (D20)

## 6. Column menu

- [ ] 6.1 Add `ColumnMenu` with Move left/right and their disabled states. Moves wait for the server, apply all returned positions, and disable move items while one runs. Write feature tests:
  - First, last and only column.
  - Move right applies the new order only after the in-memory move resolves.
  - Move right shows the order from the move response when another device reordered the columns in the fake first.
  - A move response with a different set of columns reloads the board without a toast.
  - Move items of every column are disabled while a move runs.
  - Move after deleting a column sends the right target (positions stay dense).
  - Move failure keeps the order, shows the move toast and reloads the board in the background.
  - `outOfRange` reloads the board and shows the stale-move toast.
  - A reload returning 404 opens the board list, and only "This board no longer exists." shows.
- [ ] 6.2 Add `RenameColumnDialog` (prefilled, D12/D13 validation, D19 unchanged close, saving state, field errors, failure toast). Use React Hook Form like the board list's `RenameBoardDialog`. Write feature tests for each, including " Review " closing without a call, Escape while saving, Enter with `isComposing: true`, and the failure toast naming the current name, not the typed one
- [ ] 6.3 Add `DeleteColumnDialog` with the with-cards (plural) and empty copy, saving state, 404 counting as deleted, and the failure toast. Write feature tests for 2 cards, 1 card, 0 cards, a 404 and a 500
- [ ] 6.4 Check Column menu (390, 1440), Rename column (1440) and Delete column with cards (390, 1440) against Figma

## 7. Board menu and refresh

- [ ] 7.1 Add the board menu (Rename board, Export as JSON, Delete board) using `RenameBoardDialog` and `DeleteBoardDialog` and their `onClose` results, and the injected `onExport`. A rename updates the header without a reload, and a delete calls `onBoardGone` without a toast. In the playground, wire `useExportBoard` from `transfer` and render its dialog. Write feature tests for rename, unchanged rename, delete, and a rename that reports `deleted` (`onBoardGone` is called and only the dialog's own toast shows), and a test that "Export as JSON" calls `onExport` with the board
- [ ] 7.2 Add refresh: the spinning button with `aria-busy` on tablet and desktop, none in the phone app bar content, the board kept on failure with the refresh toast, and quick add text kept. Write feature tests for each scenario in spec › Refresh, including `aria-busy` while a refresh runs, a card added during a running refresh still shown after it ends, a card added by "another device" in the fake showing after refresh, an open add column form keeping its text, and a quick add form closing when its column was deleted elsewhere
- [ ] 7.3 Invalidate the query behind `useBoards` after every successful column or card change (each one changes the board's updated time, `domain-board` › *Board timestamps*), and verify in a feature test that the board list's `cardCount` for the board is one higher after a quick add (board list tile), since the sidebar shows no count
- [ ] 7.4 Check Board menu (390, 1440) against Figma

## 8. Preview and integration checks

- [ ] 8.1 Extend the board view playground with controls to make the next call fail (network, 404, `outOfRange`, field error) or hang. Verify every state from task groups 3–7 can be reached there
- [ ] 8.2 Walk through the board with the keyboard only: open a card, quick add, add column, each column menu item, both dialogs, the board menu and refresh. Verify focus returns to the trigger after each dialog closes (the column's menu button for column menu items), except: the discard dialog focuses the kept or newly opened form (WBV-24); after Delete column focus lands on a defined element (the next column's menu button, or "Add column" when none is left); board delete and board-gone navigate away
- [ ] 8.3 Run all five gates on a clean checkout of the branch and verify they pass

## Workflow follow-up

- The card drag & drop change wraps `CardTile` and `BoardColumn`, adds dnd-kit and optimistic card moves with rollback.
- The search & filter change adds the header controls and passes filtered columns to `BoardColumns`.
- Chunks 35 and 39 add the real board, column and card data access, the `DataError` → `BoardViewError` mapper, MSW handlers and E2E tests, provide `BoardViewDataAccessProvider` in the app layer, and add the board route that renders `BoardViewRoot` with `key={boardId}` and maps the callbacks to navigation, `notFound()` and `useExportBoard` (design.md › Mounting and data source). The `DataError` → `BoardViewError` mapper maps only the `NOT_FOUND` code to `notFound`.
- Archive the change after review.
