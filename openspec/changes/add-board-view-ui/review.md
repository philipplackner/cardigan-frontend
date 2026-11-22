# Artifact review: add-board-view-ui

**Verdict:** Ready
**Reviewed:** 2026-11-21, schema `careful-planning`, repo kind `code`

| Reviewer | Blocker | Major | Minor |
|---|---|---|---|
| Testability | 0 | 6 | 9 |
| Security | 0 | 2 | 1 |
| Hidden assumptions | 0 | 7 | 5 |
| Design contract | 0 | 6 | 8 |

Raw counts per reviewer. After merging 6 duplicates: 0 blockers, 18 majors, 20 minors.

## Conflicts between reviewers

None. Merged findings propose compatible fixes. Some fixes include an alternative that the user has to pick (S2/A1, T4, A11, D2, D10), and those are noted in the findings.

## Findings

### S2 / A1: Retrying a failed create or move from the kept text can create duplicates
**Status:** applied with edits
- Severity: major - a lost response is common on mobile networks and the spec leads straight to duplicate cards and columns; the shared spec forbids this flow.
- Location: specs/web-board-view/spec.md > Requirement: Save failures; design.md > Error handling (`other` row); proposal.md > Shared-spec requirements
- Current text: "When a save fails without a response, with a 5xx or with an unknown error, the dialog or form SHALL stay open with its input and an error toast SHALL show" / "| `other` | Error toast for the action; the form stays open with its input (D15) |"
- Assumption (A1): a failure of kind `other` means the server did not apply the change.
- Problem: `api-conventions` › *Retries after a lost response*: "Clients SHALL NOT automatically repeat a POST after a network failure with an unknown outcome; they SHALL report the failure and reload the affected data before the user tries again." The change keeps the text and invites a retry but never reloads. The board list change handles the same case by invalidating `['boards']`. The proposal does not list this requirement. The in-memory fake only fails before applying, so tests can't show the problem.
- Failure scenario: "Write docs" is created on the server, the connection drops before the response. The toast shows, the text stays, the user presses Enter, and two "Write docs" cards exist. Same for add column; for Move right, a second move shifts the column twice.
- Proposed fix: design.md › Error handling, replace the `other` row with: "| `other` | Error toast for the action; the form or dialog stays open with its input (D15). For create column, create card and move column, the view model also reloads the board in the background (`api-conventions` › *Retries after a lost response*), so a change that did apply shows up before the user tries again. The inline form keeps its text through that reload (F1). |". spec.md › Save failures, append: "After a create or move fails without a response or with a 5xx, the web app SHALL also load the board again in the background, keeping the form's text, so that a change the server applied shows before the user tries again." Add scenario: "**WHEN** adding the card "Write docs" fails without a response but the server created it **THEN** after the reload the card shows in the column, the field still contains "Write docs", and the add-card toast shows." proposal.md › Shared-spec requirements, add "`api-conventions` › *Retries after a lost response*: reload after an unknown-outcome failure." tasks.md 2.2: add an option to "apply the next call, then reject with `other`". Alternative: accept the duplicate risk and record the deviation from the shared spec in decisions.md.
- Upstream: no

### S1: Mutation results can recreate a cleared board cache entry for the next user
**Status:** applied
- Severity: major - it can show one user's board to another user on the same tab; narrow timing window, and in-memory tests can't catch it.
- Location: design.md > Decisions › Server state (D21), and Board menu, export and navigation (`renamed` → `setQueryData`)
- Current text: "On success it writes the response into the cached board with a pure updater from `boardView/utils/applyChanges.ts`"
- Problem: nothing says what happens when the board's cache entry no longer exists when `onSuccess` runs. After the session ends, the app calls `queryClient.clear()`, and a late `setQueryData` recreates the entry with user A's data. With `staleTime: Infinity` it is later served without a request.
- Failure scenario: user A adds a card; before the response arrives, A logs out in another tab and the broadcast ends this tab's session. The cache is cleared, then the create resolves and writes A's board back. User B logs in on the same tab, the login redirect goes to A's `/boards/<id>`, and B sees A's board with no API call.
- Proposed fix: design.md › Server state, after the list of updaters: "Every cache write after a mutation uses `setQueryData(key, (old) => old === undefined ? undefined : update(old))`, so a write never creates a board entry that is missing, for example after `queryClient.clear()` at the end of a session. The same applies to the board rename result." tasks.md 2.4: "An updater called with no cached board leaves the cache empty (feature test: clear the `QueryClient` while a create is held by the in-memory 'hang' option, release it, and check that `getQueryData(boardViewKeys.detail(id))` is `undefined`)."
- Upstream: no

### A2: Deleting a column locally leaves gaps in the cached positions, so later moves go wrong
**Status:** applied
- Severity: major - the user's own action desyncs the cache; the next move silently does nothing or goes to the wrong place.
- Location: design.md > Server state (D21) > Mutations; design.md > Add column and column menu
- Current text: "`removeColumn` drops the column." and "Move left targets `position - 1` and Move right `position + 1`."
- Assumption: cached positions stay dense after local updates.
- Problem: `domain-column` › *Deleting a column removes its cards* and `domain-ordering` require the server to make remaining positions dense after a delete. The local updater only drops the column, and move targets come from cached positions.
- Failure scenario: A(0), B(1), C(2). Delete A: cache holds B(1), C(2), server has B(0), C(1). Move left on C sends 1, a no-op on the server, nothing happens. Move right on B sends 2 → `OUT_OF_RANGE`, and the user is told "The board changed on another device" for their own change.
- Proposed fix: design.md › Mutations: "`removeColumn` drops the column and moves every later column up by one, so positions stay 0..n-1 as on the server (`domain-ordering`)." Column menu bullet, add: "Ends and targets come from the column's index in the shown order, which equals its position while the cache is dense." tasks.md 2.4, add "`removeColumn` renumbers the remaining columns 0..n-1".
- Upstream: no

### A3: A move response with a different set of columns than the cache is undefined
**Status:** applied
- Severity: major - `api-conventions` says an in-range stale move succeeds, so this case is expected; left undefined, it corrupts the cached order.
- Location: design.md > Server state (D21) > Mutations; tasks.md > 2.4
- Current text: "`applyColumnPositions` re-sorts all columns by the returned positions." and "Column order must follow the returned positions, and an unknown ID must leave the board unchanged."
- Assumption: the move response contains exactly the cached columns.
- Problem: `api-conventions` › *Clients recover from a stale move* applies an in-range stale position as sent; the response contains all current columns. When another device added or deleted a column, the response has IDs the cache lacks or misses cached IDs. "An unknown ID must leave the board unchanged" is ambiguous (ignore the entry, or discard the response).
- Failure scenario: another device added column X. The user moves the first column right; the server applies it and returns 4 columns, the cache has 3. One implementation leaves a gap; another leaves the board unchanged so the applied move doesn't show.
- Proposed fix: design.md › Mutations, replace the `applyColumnPositions` line with "`applyColumnPositions` re-sorts all columns by the returned positions. If the returned column IDs differ from the cached ones, it changes nothing and the view model reloads the board silently (no toast), because the server applied the move but the board changed elsewhere." tasks.md 2.4: "a response whose ID set differs from the cache returns the board unchanged and signals a reload".
- Upstream: no

### A4: A refresh or stale reload running during a save can overwrite the saved change
**Status:** applied
- Severity: major - a just-added card or column vanishes with no error; F1 allows a refresh while an inline form is open.
- Location: design.md > Server state (D21) > Refresh; spec.md > Requirement: Saves apply the response
- Current text: "**Refresh:** `refetch()` on the board query. The button spins while `isFetching && !isPending`. A refetch error shows the refresh toast."
- Assumption: no board load is in flight when a mutation writes its response into the cache.
- Problem: a load that starts before a create finishes and returns after it replaces the cache with an older snapshot, including the change just applied. No mutation invalidates the board query, so nothing corrects it. Same when one mutation's stale-recovery reload overlaps another mutation.
- Failure scenario: the user presses refresh, then Enter in quick add. The create resolves first and the card appears; the refresh then resolves with the old snapshot and the card disappears until the next refresh.
- Proposed fix: design.md › Server state, add: "If a board load is in flight when a mutation succeeds, the view model applies the response and then calls `invalidateQueries` on the board key (which cancels the running load and starts a new one), so a load that started before the change never overwrites it." spec.md › Saves apply the response, add scenario: "WHEN a refresh is running and a card is added before it finishes / THEN the card is still shown after the refresh ends". Alternative: disable refresh while any save runs (still leaves internal reloads exposed).
- Upstream: no

### A5: The view-model state and pending mutations survive a switch to another board
**Status:** applied
- Severity: major - responses from board A can be written into board B's cache, and toasts or navigation can fire for the wrong board.
- Location: design.md > Screen structure; design.md > Mounting and data source (F6)
- Current text: "`BoardViewRoot({ boardId, onOpenCard, onExport, onBack, onBoardGone, onNotFound })` reads the data access from its provider, calls `useBoardViewModel` and renders `BoardViewScreen`."
- Assumption: `boardId` never changes during the life of a `BoardViewRoot`, or nothing is pending when it changes.
- Problem: TanStack Router keeps the component mounted when only `$boardId` changes; the sidebar stays clickable while an inline form saves. Reducer state and `useMutation` callbacks then see the new `boardId` (Query v5 uses callbacks from the latest render).
- Failure scenario: the user adds column "Review" on board A and clicks board B before the response arrives. The success handler appends "Review" to B's cached board; a `notFound` reload could call `onBoardGone` while on B.
- Proposed fix: design.md › Mounting and data source, add: "Chunk 35's route renders `BoardViewRoot` with `key={boardId}`, so switching boards resets all view-model state. Mutations take `boardId` in their variables and update `boardViewKeys.detail(variables.boardId)`, never the current render's `boardId`. Results that arrive after the switch don't show toasts or navigate." tasks.md 3.2, add a feature test: "re-render with another `boardId` while a create is held; release it; the second board's cache and screen are unchanged".
- Upstream: no

### A6: Enter and Escape during IME composition submit or drop the text
**Status:** applied
- Severity: major - users typing CJK titles can't enter titles reliably; none of the artifacts mention it.
- Location: design.md > Quick add details (D22); design.md > Add column and column menu
- Current text: "Enter submits and Shift+Enter is ignored, because titles are single-line." and "Enter submits and Escape cancels."
- Assumption: every Enter or Escape keydown in the field is a user command.
- Problem: an IME uses Enter to commit a composition and Escape to cancel it. Without an `isComposing` check (or `keyCode 229` on Safari), a card is created from half-composed text or the form closes.
- Failure scenario: a user types "看板" with a Japanese IME and presses Enter to confirm. A card is created with the reading still being composed.
- Proposed fix: design.md › Quick add details, add: "Enter and Escape are ignored while an IME composition is active (`event.isComposing`, or `keyCode === 229` for Safari). This applies to quick add, add column and the rename column field." tasks.md 4.1 and 5.1: "Enter with `isComposing: true` creates nothing".
- Upstream: no

### A7 / D3: The two in-memory fakes don't share state, so task 7.3 and the preview can't behave as specified
**Status:** applied
- Severity: major - task 7.3's feature test can't pass as written; in the preview a refresh brings back a renamed board's old name.
- Location: design.md > Mounting and data source (F6) and Tests > Feature; tasks.md > 2.2, 3.3 and 7.3
- Current text: "`createInMemoryBoardViewDataAccess` builds its default boards from the board list's `sampleBoards` (`features/boards/testing/sampleBoards.ts`)." / "Feature: `BoardViewRoot` with a real `QueryClient`, the in-memory data access in its provider" / task 7.3: "verify in a feature test that the sidebar's count updates after a quick add"
- Problem: two separate stores seeded from the same array. After a quick add, invalidating `['boards']` refetches from the board list store, whose `cardCount` and `updatedAt` didn't change. `RenameBoardDialog`/`DeleteBoardDialog` write to the board list store, so `loadBoard` returns the old name or a deleted board. Task 3.3 wraps the playground only in the board view provider. Also (D3): the sidebar shows no card count at all — board list spec › *Sidebar board section* shows "name and key".
- Failure scenario: task 7.3's test asserts 13 cards and still sees 12 (or nothing, since the sidebar has no count). In the preview, rename to "Cardigan v2", refresh, header shows "Cardigan v1".
- Proposed fix: design.md › Mounting and data source, add: "`createInMemoryBoardViewDataAccess(boardsFake, options)` shares one store with a `createInMemoryBoardsDataAccess` instance. It reads and writes the same boards, so `listBoards` derives `cardCount` and `updatedAt` from the board view's columns and cards, and a rename or delete through `BoardsDataAccess` shows in `loadBoard`. Tests and the preview provide both `BoardsDataAccessProvider` and `BoardViewDataAccessProvider` from that pair." Update tasks.md 2.2 and 3.3 to match. Replace task 7.3's last clause with: "verify in a feature test that the board list's `cardCount` for the board is one higher after a quick add (board list tile), since the sidebar shows no count". Fallback if the board list fake can't expose its store: test only that `listBoards` is called again.
- Upstream: no

### D1: Column methods in the seam leave out `boardId`, but the real column endpoints need it
**Status:** applied
- Severity: major - chunk 35 would have to change the seam and every caller, against the goal of plugging in the real API "without touching the screen".
- Location: design.md > Decisions > The seam: `BoardViewDataAccess` (D6)
- Current text: "renameColumn(columnId: string, name: string): Promise<BoardColumn>\n  moveColumn(columnId: string, position: number): …\n  deleteColumn(columnId: string): Promise<void>\n  createCard(columnId: string, title: string): Promise<BoardCard>"
- Problem: the backend snapshot (verified) defines `PATCH`/`DELETE /api/v1/boards/{boardId}/columns/{columnId}` and `POST …/columns/{columnId}/move`. `createColumn`/`updateColumn` return `ColumnDto` with no `cards`, but the seam promises `BoardColumn` with `cards`.
- Failure scenario: chunk 35 can't call the nested path from `renameColumn(columnId, name)` without changing the interface or reading the cache in the data layer; the rename mapper invents `cards: []` and an updater replacing the whole column wipes its cards.
- Proposed fix: design.md, replace with:
  ```ts
  renameColumn(boardId: string, columnId: string, name: string): Promise<BoardColumnInfo>
  moveColumn(boardId: string, columnId: string, position: number): Promise<{ id: string; position: number }[]>
  deleteColumn(boardId: string, columnId: string): Promise<void>
  createCard(boardId: string, columnId: string, title: string): Promise<BoardCard>
  ```
  Change `createColumn` to `Promise<BoardColumnInfo>`, add `type BoardColumnInfo = { id: string; name: string; position: number }`, and add: "Column methods take `boardId` because the API nests columns under `/boards/{boardId}/columns`. `addColumn` creates the column with `cards: []`, and `renameColumn` copies only the name." Update task 2.1.
- Upstream: no

### D2: The board query key is not defined and may sit under `['boards']`
**Status:** applied
- Severity: major - board-list invalidation would reload the whole board, breaking *Saves apply the response* and task 5.1's "`loadBoard` is called once".
- Location: design.md > Decisions > Server state (D21)
- Current text: "after a change that alters the card count or the board's updated time, the view model invalidates the `['boards']` query from the board list's `boardsQueryOptions`"
- Problem: `react-server-state` says keys start with the feature name (`boards`), so `boardViewKeys.detail(id)` would naturally be `['boards', 'detail', id]`. Invalidating `['boards']` matches by prefix and refetches the open board — from the board view and from the board list's own rename/delete mutations.
- Failure scenario: the user adds a card; invalidating `['boards']` also refetches the board detail: a full `loadBoard` after every change, which the spec forbids, and it can race the next change.
- Proposed fix: design.md › Server state, replace "the board is one query, `boardViewKeys.detail(boardId)`" with: "the board is one query with the key `boardViewKeys.detail(boardId)` = `['boardView', 'detail', boardId]`. Its root is deliberately not `['boards']`, so invalidating the board list (here and in the board list's own mutations) never refetches the open board." Alternative: keep it under `['boards']` and use `exact: true` everywhere, including in the board list change.
- Upstream: no

### T2 / D4: The phone app bar is placed by the route, and the feature-test harness lacks the app bar slot and the board list provider
**Status:** applied
- Severity: major - tasks 3.2, 7.1, 7.3 and the "Board known from the list" test can't run as designed, and the route can't own the menu state the bar needs.
- Location: design.md > Screen structure, Tests; tasks.md > 3.2, 7.1, 7.3
- Current text: "`BoardAppBarContent` is the phone app bar. Chunk 35's route puts it into the shell's top-bar slot (D3)."; "Feature: `BoardViewRoot` with a real `QueryClient`, the in-memory data access in its provider and spy callbacks"
- Problem: the foundation's design gives pages `<AppBarSlot>{bar}</AppBarSlot>` rendered by the page and rejects route-owned bars; the board list Screen renders its own bar. The board view bar contains the ⋯ menu (reducer `dialog` state) and Back (`onBack`), which the route can't own. `AppBarSlot` portals into nothing without `AppBarSlotProvider`. `RenameBoardDialog`/`DeleteBoardDialog` need `BoardsDataAccessProvider`; the loading header and invalidation need the `['boards']` query.
- Failure scenario: chunk 35 renders `BoardAppBarContent` in the route and needs a second `useBoardViewModel`; "Rename board" from the phone menu opens no dialog. Or task 3.2's back-button test can't prove `BoardViewRoot` wires `onBack`, and board menu tests fail at render without the board list provider.
- Proposed fix: design.md › Screen structure, replace the sentence with: "`BoardAppBarContent` is the phone app bar. `BoardViewScreen` renders it inside the foundation's `<AppBarSlot>`, like the board list's Screen, so the route adds nothing for it. The phone back button calls `onBack`. The preview playground wraps the playground in `AppBarSlotProvider`." design.md › Tests › Feature, add: "The harness renders `AppBarSlotProvider` with its target, `ToastProvider`, `BoardViewDataAccessProvider` with `createInMemoryBoardViewDataAccess`, and `BoardsDataAccessProvider` with `createInMemoryBoardsDataAccess`. Both are seeded from `sampleBoards`. Loading tests seed or leave empty the `['boards']` query to choose between known and unknown name."
- Test sketch: Feature — render `BoardViewRoot` in the full harness and click "Back" in the slot target; passes when the `onBack` spy is called once.
- Upstream: no

### D5: "Keep editing" focus needs a `core/ui` Dialog change and an exception to a main-spec requirement
**Status:** applied
- Severity: major - can't be built as written without touching `core/ui` and `web-design-system`, which the proposal says stay unchanged.
- Location: design.md > Quick add details (D22) and Risks › Focus after "Keep editing"; proposal.md > Capabilities › Modified Capabilities and Impact › Not touched
- Current text: "`onCloseAutoFocus` is prevented for this dialog and the view model focuses the field." / "Modified Capabilities: None." / "Not touched: … `core/ui` …"
- Problem: `src/core/ui/Dialog.tsx` always spreads `useReturnFocus()` (verified), whose `onCloseAutoFocus` focuses the opener; no prop overrides it. Features may not import `radix-ui`. `web-design-system` requires dialogs to return focus to their opener; WBV-24 deliberately breaks that.
- Failure scenario: the view model focuses the first quick add field, then `useReturnFocus` moves focus to "Add card" in "Done". Scenario *Keep editing* ("has focus") fails and needs an unplanned `core/ui` edit.
- Proposed fix: design.md › Quick add details, replace "so Radix's return-focus to the trigger is turned off for this dialog" with: "so `core/ui` `Dialog` gets an optional `returnFocus?: boolean` prop (default `true`). With `false` it prevents `onCloseAutoFocus`, and the screen sets focus itself." proposal.md: Modified Capabilities → "`web-design-system`: dialogs may opt out of returning focus to their opener when the screen moves focus elsewhere (the discard dialog)." Add a MODIFIED requirement delta in `specs/web-design-system/spec.md`, and remove `core/ui` from "Not touched". tasks.md, before 5.2: "Add `returnFocus` to `core/ui` `Dialog` with a test that `false` leaves focus where the screen put it."
- Upstream: no

### D6: `validateName` duplicates the planned shared check and strings, with a different code name
**Status:** applied
- Severity: major - board list and board view would show different messages for the same input, and two test sets would cover one rule.
- Location: design.md > Validation (D12, D13); tasks.md > 2.3, 2.7
- Current text: "`boardView/utils/validateName.ts` returns `null | { code: 'REQUIRED' | 'TOO_LONG' | 'INVALID_CHARACTERS'; max?: number }` … It uses the foundation's normalize-and-count helper from `core/utils`."
- Problem: the foundation adds `core/utils/text.ts` `checkText` (invalid characters first) and the board list adds `core/utils/textField.ts` `checkSingleLineText` with `common` `nameErrors.*`, saying "Column and label names will reuse it." `validateName` sets no check order, and `INVALID_CHARACTERS` differs from the shared `api-errors` code `INVALID_CHARACTER`. Task 2.7 would copy the messages into `boardView`.
- Failure scenario: a 31-character name with a tab shows "Use at most 30 characters." in the column form but "Use a single line without control characters." in the board rename dialog.
- Proposed fix: design.md › Validation, replace the first paragraph with: "Column names (max 30) and card titles (max 200) use the board list's `checkSingleLineText` from `core/utils/textField.ts` and the `common` `nameErrors.*` strings. Server field codes map through the same codes (`REQUIRED`, `TOO_LONG`, `INVALID_CHARACTER`)." Drop the `validateName` test list. tasks.md 2.3 → "Verify `checkSingleLineText` covers 30/31 and 200/201 code points; add those cases to its tests if missing." Remove the name error messages from task 2.7.
- Upstream: no

### T1: Phone, tablet and desktop differences can't be observed at any test level this change allows
**Status:** applied
- Severity: major - several SHALL statements get tests that pass whatever the implementation does, and task 7.2 asks for a feature test that can't be written.
- Location: spec.md > Board content area (Scenario: Tablet), Board header on tablet and desktop, Board app bar on phones, Columns layout (Scenario: Phone swipe), Opening quick add (hint), Refresh
- Current text: "WHEN the viewport is 834 px wide THEN every board view state uses the desktop layout"; "There SHALL be no refresh control on a phone."; "Desktop and tablet SHALL also show the hint "Enter to add"."
- Problem: phone vs desktop is a `phone:` CSS media query (`width < 640px` or `height < 480px`); Tailwind isn't loaded in jsdom, so both header and app bar render. Width, snapping and "834 px wide" are invisible in jsdom; E2E is out of scope. The 834 px scenario omits height (834×400 is a phone).
- Failure scenario: an implementer puts refresh in the phone app bar; a whole-screen `queryByRole('button', { name: 'Refresh' })` finds the header's button either way.
- Proposed fix: spec.md › Board app bar on phones: "The phone app bar content SHALL contain the back button, the name, the subtitle and the board menu button, and SHALL NOT contain a refresh control." New scenario: "WHEN the phone app bar content is rendered for "Cardigan v1" with 12 cards THEN it contains "Back", "Cardigan v1", "CRD · 12 cards" and "Board actions", and no button named "Refresh"". Opening quick add: "The hint "Enter to add" SHALL be hidden under the `phone` condition from `web-design-system`." Scenario Tablet: "WHEN the viewport is 834 × 1194 px". Scenario Phone swipe: "THEN the column row scrolls horizontally and has no scroll snapping". design.md › Tests, add: "Size-dependent visibility, the 300 px column width, the lack of snapping and the tablet layout can't be seen in jsdom. Screen tests check structure only (the app bar content has no Refresh button; the hint carries the phone-hidden class). The preview page checks at 390, 834 and 1440 px (task groups 3–7) are the verification for these."
- Test sketch: Screen — render `BoardAppBarContent` alone with 12 cards; passes when there is no "Refresh" button inside it.
- Upstream: no

### T3 / D12: "Board no longer exists" contradicts the delete-column 404 rule, and its trigger can't be observed
**Status:** applied
- Severity: major - two valid tests of the same situation would expect opposite outcomes.
- Location: spec.md > Board no longer exists; Deleting a column; Stale data recovery > Board gone during recovery
- Current text: "When a refresh, a reload after a stale change, or any change made in the board view to a board that was already shown ends in a 404 for the board itself, the web app SHALL go to the board list"; "A 404 on delete SHALL count as deleted."
- Problem: design.md says a change's 404 can't tell column from board, and the fake returns only `notFound`. For delete column on a deleted board, one requirement says go to the board list, the other says remove the column locally with no reload. "Board gone during recovery" doesn't say whether the column toast also shows.
- Failure scenario: one tester expects the board list after deleting a column on a board removed elsewhere; another expects the column to disappear in place. Both cite the spec.
- Proposed fix: spec.md › Board no longer exists, replace the first sentence with: "When a refresh, or the reload that follows a 404 or `OUT_OF_RANGE` from a change, returns 404, the web app SHALL go to the board list and show the error toast "This board no longer exists." A 404 on deleting a column SHALL NOT trigger a reload (see *Deleting a column*)." Scenario Board gone during recovery, THEN: "the board list opens, the toast "This board no longer exists." shows, and the "no longer exists. The board was reloaded." toast does not show".
- Test sketch: Feature — `createCard` rejects with `notFound`, next `loadBoard` rejects with `notFound`; passes when `onBoardGone` is called, the board toast shows and the column toast is absent.
- Upstream: no

### T4: The "Add card" button with an empty title has two expected outcomes
**Status:** applied
- Severity: major - validation and quick add disagree, so opposite behavior can be built and tested.
- Location: spec.md > Adding a card; Name and title validation
- Current text: "Enter on an empty or whitespace-only title SHALL do nothing."; "Errors SHALL show under the field on the first submit … Messages: "Enter a name." (empty)"
- Problem: only Enter is exempted. Pressing the form's "Add card" with an empty title is a submit, so validation says "Enter a name." shows.
- Failure scenario: the implementer shows "Enter a name." on button click; the tester expects nothing.
- Proposed fix (recommended): spec.md › Adding a card, change the last sentence to: "Enter or the form's "Add card" button on an empty or whitespace-only title SHALL do nothing and show no error. "Enter a name." applies to column names only." Add scenario: "WHEN the title field is empty and the user presses the form's "Add card" button THEN no card is created and no error shows". Alternative (needs user confirmation, since D22 names only Enter): the button shows "Enter a name." and only Enter is silent.
- Upstream: no

### T5: The promise that moves apply all returned positions can't fail against the in-memory fake
**Status:** applied
- Severity: major - the test would pass for a wrong implementation; the defect would only show with concurrent edits.
- Location: spec.md > Saves apply the response; Moving a column > Move right; design.md > in-memory implementation; tasks.md > 2.2, 6.1
- Current text: "A column move SHALL apply the positions of all columns from its response."; "Options let a test make the next call fail with a given error or hang until released."
- Problem: the fake returns the same order a local neighbor swap produces, so an implementation that ignores the response passes.
- Failure scenario: the implementer swaps locally; another device had reordered columns; the web shows an order that doesn't match the server, uncaught.
- Proposed fix: design.md, extend the fake's options: "…fail with a given error, hang until released, or change the stored board between calls (to act as another device)." spec.md › Saves apply the response, add scenario: "WHEN the board shows "To do", "In progress", "Done", another device moved "Done" to the first position, and the user moves "To do" right THEN the columns are shown in the order of the move response: "Done", "In progress", "To do"". Add the matching case to task 6.1.
- Upstream: no

### T6: "Scrolled into view" can't be seen in jsdom, and jsdom has no `scrollIntoView`
**Status:** applied
- Severity: major - feature tests either throw or skip the promise.
- Location: spec.md > Keeping started text; Adding a column; design.md > Tests
- Current text: "The first form SHALL keep its text, scroll into view and get focus."; "the new column SHALL scroll into view"
- Problem: jsdom doesn't implement `Element.prototype.scrollIntoView`; calling it throws. The design doesn't say how tests observe it.
- Failure scenario: the implementer drops the scroll call because tests crash; on a wide board the kept form or new column stays off screen.
- Proposed fix: design.md › Tests, add: "jsdom has no `scrollIntoView`. Feature tests install a recording stub on `Element.prototype.scrollIntoView` (a browser global, so the no-`vi.mock` rule holds) and assert it was called on the kept form, or on the new column with `{ inline: 'nearest' }`. The real scrolling is checked on the preview page."
- Upstream: no

### S3: Any 404 on delete counts as deleted, including `ROUTE_NOT_FOUND`
**Status:** applied
- Severity: minor - the column is hidden locally but stays on the server; only on a misconfigured chunk 35 or deployment.
- Location: design.md > Decisions › The seam (`notFound // 404`) and Error handling
- Current text: "| { kind: 'notFound' }                                         // 404"
- Problem: `api-errors` uses 404 for both `NOT_FOUND` and `ROUTE_NOT_FOUND`. Defined by status only, chunk 35's mapper will likely map both to `notFound`.
- Failure scenario: a wrong DELETE path or a proxy 404 page; the user deletes "Review" with 5 cards, the dialog closes as if it worked, and the column returns on the next load.
- Proposed fix: design.md › The seam, change the comment to `// 404 with code NOT_FOUND; ROUTE_NOT_FOUND and other 404s map to 'other'`. Add to the "Why its own error" bullet: "The chunk 35 mapper maps only `NOT_FOUND` to `notFound`, so a route error never counts as deleted."
- Upstream: no

### T7: "Empty" in Closing quick add isn't defined, and focus moving out has no scenario
**Status:** applied
- Severity: minor - edge case that two tests could disagree on.
- Location: spec.md > Closing quick add
- Current text: "A click or focus move outside the form SHALL close it when the field is empty and SHALL keep it open with its text otherwise."
- Problem: design.md uses "empty after normalization"; the spec says "empty". Focus move (Tab) has no scenario.
- Proposed fix: spec.md, "when the field is empty" → "when the field is empty after normalization". Add scenarios: "WHEN the title field contains only spaces and the user clicks elsewhere on the board THEN the form closes", and "WHEN the title field contains "Write docs" and the user tabs out of the form THEN the form stays open with "Write docs"".
- Upstream: no

### T8: Loading and load-error header promises have no checks, and the error-state header is missing
**Status:** applied
- Severity: minor - negatives that are easy to break unnoticed.
- Location: spec.md > Loading state; Load error state
- Current text: "The refresh button SHALL show; the board menu and card count SHALL NOT."; ""Try again" and the refresh button SHALL load the board again."
- Problem: no scenario asserts the menu and count are absent while loading, or that refresh works in the error state. WBV-20 covers the header after a load error, but the Load error requirement says nothing about it.
- Proposed fix: spec.md › Loading state › Board known from the list, THEN: "the header shows "Cardigan v1", `CRD` and the refresh button, no board menu button and no card count, and the content area shows skeleton columns". Load error state, add: "The header SHALL be the same as in the loading state." Add scenario: "WHEN the load error state shows and the user presses refresh and the load succeeds THEN the board's columns are shown".
- Upstream: no

### T9: Refresh "spin" can't be seen, and "stays in place" is vague
**Status:** applied
- Severity: minor - low risk, but the scenario can't fail as worded.
- Location: spec.md > Refresh
- Current text: "the refresh button SHALL load the board again and spin while it loads"; "THEN the new card appears and the rest of the board stays in place"
- Proposed fix: "spin while it loads" → "spin and set `aria-busy` while it loads". Add scenario "WHEN a refresh is running THEN the refresh button has `aria-busy="true"` and the columns stay visible". First scenario's THEN → "the new card appears at the end of its column and all other columns and cards are unchanged".
- Upstream: no

### T10: The stale-move scenario has a placeholder in its expected text and an underspecified setup
**Status:** applied
- Severity: minor - the exact toast can't be asserted, and some setups give a 404 instead.
- Location: spec.md > Stale data recovery > Stale column move
- Current text: "WHEN the board shows 4 columns, another device deleted one, and "Move right" on the third column returns `OUT_OF_RANGE` THEN … "Couldn't move “{name}”. …" shows"
- Proposed fix: replace with: "WHEN the board shows "To do", "In progress", "Review", "Done", another device deleted "To do", and the user chooses "Move right" on "Review", which returns `OUT_OF_RANGE` THEN the board loads again without "To do" and the toast "Couldn't move “Review”. The board changed on another device, so it was reloaded." shows".
- Upstream: no

### T11: No scenario covers move items being disabled during a move
**Status:** applied
- Severity: minor - promised guard without a scenario.
- Location: spec.md > Moving a column
- Current text: "While a column move runs, the move items of every column menu on the board SHALL be disabled."
- Proposed fix: add scenario: "WHEN the move of "To do" is still running and the user opens the menu of "Done" THEN "Move left" and "Move right" are disabled and "Rename" and "Delete column" are enabled".
- Upstream: no

### T12: "Saves apply the response" is checked for one change type out of five
**Status:** applied
- Severity: minor - a refetch-after-save in rename, delete or add card would go unnoticed.
- Location: spec.md > Saves apply the response
- Current text: "Every successful change SHALL update the shown board from the change's response, without loading the whole board again." (one scenario: Column added)
- Proposed fix: replace the scenario with: "WHEN a card is added, a column is added, renamed, moved and deleted, each successfully THEN each change is shown and the board was loaded only once in total".
- Upstream: no

### T13 / D13: A temporary mounting rule goes into the permanent spec
**Status:** applied
- Severity: minor - after archive the main spec holds an interim delivery constraint that chunk 35 must remove; the board list spec doesn't do this.
- Location: spec.md > Board content area ("The web app SHALL NOT show the board view before real board data is available.") and Scenario: Before real data exists
- Problem: F6 is a delivery phase, not lasting behavior; a route test written now breaks when chunk 35 adds the route.
- Proposed fix: delete that sentence and the scenario from spec.md; F6, design.md › Mounting and data source and task 3.3 already cover it. Alternative (T13): keep as "The board view SHALL render only inside a `BoardViewDataAccessProvider`".
- Upstream: no

### T14: "Export as JSON" has no scenario
**Status:** applied
- Severity: minor - promise without a check.
- Location: spec.md > Board menu
- Current text: ""Export as JSON" SHALL start the board export."
- Proposed fix: add scenario: "WHEN the user chooses "Export as JSON" in the board menu of "Cardigan v1" THEN the app layer is asked to export "Cardigan v1"".
- Upstream: no

### T15: Scenarios use HTTP statuses that this change's tests can't produce
**Status:** applied
- Severity: minor - the test oracle is split across two changes without saying so.
- Location: spec.md > Save failures ("fails with 500"), Server field errors ("returns 400"); design.md > Tests
- Current text: "WHEN deleting the column "Review" fails with 500"
- Proposed fix: design.md › Tests, add: "The fake rejects with `BoardViewError` kinds. A scenario's status maps to a kind as in design.md › The seam: no response, 5xx and unknown → `other`; 400/409 with field errors → `invalid`; 404 → `notFound`; `OUT_OF_RANGE` → `outOfRange`. Chunk 35's mapper tests cover status→kind."
- Upstream: no

### A8 / D8: Which changes invalidate the board list is stated two different ways
**Status:** applied
- Severity: minor - sidebar order and "Updated …" go stale until a refresh.
- Location: design.md > Server state (D21) > Board list cache; tasks.md > 7.3
- Current text: "after a change that alters the card count or the board's updated time" (design) vs "after changes that alter the card count" (tasks)
- Problem: `domain-board` › *Board timestamps* updates the board's updated time on every column or card create, change, move or delete; the board list is sorted by it.
- Proposed fix: design.md: "after every successful column or card change (each one updates the board's updated time, `domain-board` › *Board timestamps*)". tasks.md 7.3: "after changes that alter the card count" → "after every successful column or card change". (Test target: see A7/D3.)
- Upstream: no

### A9: Cached data for a deleted board stays and is shown again without a request
**Status:** applied
- Severity: minor - only through history or a stale link; the next change hits the board-gone path.
- Location: design.md > Server state (D21) > Query; Board menu, export and navigation
- Current text: "Returning to a board already in the cache shows the cached board without a request; the refresh button is the way to get changes from other devices."
- Proposed fix: design.md › Board menu, export and navigation, add: "Before calling `onBoardGone` (after a delete, a rename that reports `deleted`, or a board 404 on a later load), the view model calls `removeQueries` for `boardViewKeys.detail(boardId)`."
- Upstream: no

### A10: Which name the rename failure toast uses is not specified
**Status:** applied
- Severity: minor - shared copy could differ between web and mobile.
- Location: spec.md > Save failures
- Current text: "\"Couldn't rename “{name}”.\""
- Proposed fix: spec.md › Save failures, append: "In every toast, `{name}` is the column's name as currently shown on the board, not the text typed in the form." Add scenario: "WHEN renaming 'Review' to 'In review' fails without a response / THEN the toast reads 'Couldn't rename “Review”. Check your connection and try again.'"
- Upstream: no

### A11: Leaving the board with started text in an inline form is not specified
**Status:** applied with edits
- Severity: minor - text is lost or kept by accident; implementers could add a router blocker.
- Location: spec.md > Discarding started text
- Current text: "When the user opens another inline form while the open one has text, the web app SHALL ask with \"Discard changes?\"…"
- Proposed fix (recommended): add: "Leaving the board (back, another board, browser navigation) SHALL drop the text of an open inline form without asking." Alternative (user choice): show the same discard dialog through a router blocker.
- Upstream: no

### A12: Board size is assumed small enough to render every tile
**Status:** applied
- Severity: minor - performance only, on very large boards.
- Location: spec.md > Columns layout; design.md > Screen structure
- Current text: "Columns SHALL be shown side by side in ascending position order, each with its name, its card count and a column menu button."
- Problem: `board-export-format` › *Import item limits* allows 200 columns and 20,000 cards.
- Proposed fix: design.md › Screen structure, add: "All columns and cards render without virtualization. Boards up to the import limits are expected to work but may be slow. Virtualization, if needed, comes with the drag & drop change, because it constrains dnd-kit." Alternative: virtualize now.
- Upstream: no

### D7: The forms use reducer state, not React Hook Form, and the design doesn't say why
**Status:** applied
- Severity: minor - works, but departs from the project stack and the sibling change without a stated reason.
- Location: design.md > Screen structure; Add column and column menu › Rename
- Current text: "`submitted` drives D12: an error shows after the first submit, then is derived live from the text."
- Proposed fix: design.md › Screen structure, add: "Inline form text lives in the reducer and not in React Hook Form, because the view model must read it to decide on the discard dialog (WBV-24) and to keep one form slot. `RenameColumnDialog` uses React Hook Form like the board list's `RenameBoardDialog` (`mode: 'onSubmit'`, `reValidateMode: 'onChange'`, server errors through `setError`)."
- Upstream: no

### D9: The proposal, design and decision facts still say board and column endpoints don't exist
**Status:** applied
- Severity: minor - misleading, and design.md contradicts itself ("Backend split" says be-boards covers them).
- Location: proposal.md > Why; design.md > Context; decisions.md > Facts
- Current text: proposal: "the backend has no board, column or card endpoints"; design: "There are no board, column or card endpoints in the OpenAPI snapshot, so no `core/api` code can be written for them."
- Proposed fix: proposal.md: "the backend has board and column endpoints (be-boards) but no card endpoints yet, and the web app has no data layer for any of them". design.md: "The backend snapshot has board and column endpoints but no card endpoints. This change still uses the data-access seam (D6), and chunk 35 adds `core/api` code once it syncs the spec." The decisions.md Fact is outdated, but decisions.md is not edited by this review.
- Upstream: no

### D10: The nested `features/boards/boardView/` folder isn't the project layout, and the artifacts describe it differently
**Status:** applied
- Severity: minor - implementers will guess where hooks and the reducer go.
- Location: design.md > The seam, Server state, Error handling, Screen structure; proposal.md > Impact
- Current text: "`features/boards/boardView/types.ts`" / proposal: "`src/features/boards/` (board view components, hooks, utils, types, …)"
- Proposed fix: design.md › Screen structure, add: "Board view files live in `features/boards/boardView/` with the standard subfolders (`components/`, `hooks/` for `useBoardViewModel` and `boardViewReducer`, `utils/`, `testing/`, `types.ts`). This deviates from `react-project-structure` on purpose, to keep the shared `boards` folder free of merge clashes (D5). The namespace file stays in `features/boards/i18n/`." proposal.md Impact → "`src/features/boards/boardView/` (…)". Alternative: flatten with a `boardView` file prefix.
- Upstream: no

### D11: The `onNotFound` callback skips the router's loader pattern and has no rule for when it can be called
**Status:** applied
- Severity: minor - matters only in chunk 35.
- Location: design.md > Error handling and Mounting and data source
- Current text: "If the first load returns `notFound` (no cached board), the view model calls `onNotFound`. In the app, chunk 35's route throws the router's `notFound()`"
- Proposed fix: design.md › Error handling, append: "The view model calls `onNotFound` during render when the query error is `notFound` and no data exists, so a thrown `notFound()` reaches the router's not-found boundary. The route uses no loader prefetch, on purpose: the board view shows its own skeleton with the board list's name (WBV-20), while a loader would show the blank pending page."
- Upstream: no

### D14: Task 8.2's focus check contradicts WBV-24 and the delete flows
**Status:** applied
- Severity: minor - a wrong check the implementer would have to ignore.
- Location: tasks.md > 8.2
- Current text: "Verify focus returns to the trigger after each dialog closes, or to the column's menu button for menu items"
- Proposed fix: replace with: "Verify focus returns to the trigger after each dialog closes (the column's menu button for column menu items), except: the discard dialog focuses the kept or newly opened form (WBV-24); after Delete column focus lands on a defined element (the next column's menu button, or "Add column" when none is left); board delete and board-gone navigate away."
- Upstream: no

## Security analysis

### Trust boundaries
- **Server data rendered in the board** (names, labels, display IDs): React text rendering, escaped `aria-label`, ban on `dangerouslySetInnerHTML`, label colors via a fixed class table. No finding.
- **Board ID from the URL**: path building is chunk 35's job; a crafted ID only causes a same-origin GET of the victim's own data. No finding.
- **Error responses → `BoardViewError` → UI copy**: `BoardViewError` has no `detail` field, so injected text can't reach the UI. A non-`NOT_FOUND` 404 counts as deleted → S3.
- **Query cache across sessions in one tab**: a late mutation `onSuccess` can recreate a cleared entry → S1.
- **Create/move with unknown outcome**: duplicates on retry → S2/A1.
- **Injected callbacks and providers**: set only by app-layer code; in-memory data access only in tests and preview. No finding.

### Test versus production
- *Saves apply the response*: tests never end the session mid-mutation; production does → S1.
- *Save failures keep the input*: the fake rejects before applying; production can apply then fail → S2/A1.
- *A 404 on delete counts as deleted*: the fake only uses `notFound` for unknown IDs; production also has `ROUTE_NOT_FOUND` → S3.
- *Board no longer exists / unknown board ID*: foreign boards return the same 404; no gap.
- *Messages come from codes*: no gap.

## Assumptions safe to leave implicit
| Assumption | Where it is implied | Why it is safe |
|---|---|---|
| "Phone" is decided by viewport at the theme breakpoints | spec › Board header / app bar on phones | Breakpoints are fixed in one place in the theme; D20 sets tablet to desktop |
| `Intl.PluralRules`, `scrollIntoView({ inline })`, pointer events and `focusout.relatedTarget` exist | design › Quick add details, Add column | All supported browsers have them |
| Requests eventually settle | spec › Saving state | Timeouts belong to chunk 35's HTTP client; only the fake hangs, on purpose |
| Delete dialog card count from a possibly stale cache | spec › Deleting a column | `domain-ordering` accepts last-write-wins; refresh is the way to see other devices |
| Label order on tiles is locale-independent | spec › Card tiles | `domain-card` and `api-conventions` define it exactly |
| Counts above 999 without a thousands separator | spec › Board header | No correctness impact in an English-only UI |
| A 401 is handled outside the board view | design › Error handling | `core/auth` refreshes or logs out; mapping is chunk 35's |
| Header card count is the sum of loaded cards | spec › Board header | `BoardDetail` has no count field; loading uses the board list summary (WBV-20) |

## New abstractions
- **`BoardViewDataAccess` + provider:** keep; signature needs `boardId` (D1).
- **`BoardViewError`:** keep.
- **`createInMemoryBoardViewDataAccess`:** keep; must share state with the boards fake (A7/D3).
- **`boardViewKeys`:** keep; root must be outside `['boards']` (D2).
- **`applyChanges` updaters:** fine as is (but see A2, A3, S1).
- **`handleBoardViewError`:** fine as is.
- **`boardViewReducer`:** keep; document why inline text lives there (D7).
- **`validateName`:** challenge; shared `checkSingleLineText` covers it (D6).
- **`useBoardViewModel`, `BoardViewRoot`/`BoardViewScreen`, child components:** fine as is.
- **`BoardAppBarContent`:** keep; Screen renders it via `AppBarSlot` (T2/D4).
- **`DiscardInlineDialog`:** keep; needs a `core/ui` Dialog opt-out (D5).
- **`boardView` namespace:** fine as is.
- **`features/boards/boardView/` subfolder:** document or flatten (D10).

## Coverage
- Artifacts reviewed: proposal.md, specs/web-board-view/spec.md, design.md, tasks.md, decisions.md
- Missing artifacts: none
- Testability: all 31 requirements and 72 scenarios; 15 findings touching 19 requirements
- Security: 6 trust boundaries, 5 invariants; `api-errors` and `api-conventions` checked
- Hidden assumptions: not applicable — time, resources, permissions/environment, rollout
- Design contract: code mode; checked `core/ui` (Dialog, useReturnFocus, Column, Card, etc.), `transfer`, i18n, `.oxlintrc.json`, the backend OpenAPI snapshot, `add-board-list-ui` and `add-web-foundation`, and the relevant project skills
- Reviewers that did not complete: none
- Findings dropped because their evidence did not exist: 0 (spot-checked: the OpenAPI paths for D1/D9 and `useReturnFocus` in `Dialog.tsx` for D5 both exist)
- Findings dropped because they challenged decisions.md: 0
- Duplicates merged: S2+A1, A7+D3, T2+D4, T3+D12, T13+D13, A8+D8
- Side note from the design-contract reviewer: `add-web-foundation` still lists `routes/_authenticated/boards/$boardId.tsx` as a board view file, which F6 moved to chunk 35. That belongs to the foundation change and is not a finding here.

## Applied changes
- Applied 2026-11-22: all 38 findings, using the recommended option wherever a finding offered alternatives (T4: the button behaves like Enter; A11: leaving drops the text silently; D2: separate `['boardView', …]` root; D10: document the subfolder; T13/D13: remove the sentence and scenario).
- Applied with edits:
  - S2/A1: the reload rule went into a new requirement, *Reload after an unknown outcome*, with the lost-response scenario, because appending it to *Save failures* exceeded the validator's length limit.
  - A11: the rule went into a new requirement, *Leaving the board with started text*, with a scenario, for the same reason.
- Files changed:
  - specs/web-board-view/spec.md
  - specs/web-design-system/spec.md (new: MODIFIED *Modal overlays and keyboard*, for D5)
  - design.md
  - proposal.md
  - tasks.md (task 5.2 added for the `Dialog` `returnFocus` prop; former 5.2 and 5.3 are now 5.3 and 5.4; no checkbox states changed)
- Stale non-standard artifacts the user chose not to update: none (the change has no non-standard artifacts)
- Contradictions with decisions.md:
  - Facts: "The backend OpenAPI snapshot has only `/api/v1/labels` and `/api/v1/users/me`. No board, column or card endpoints" is outdated. The snapshot now has board and column endpoints (D9). decisions.md was not edited.
  - Possible tension: WBV-24 lists "Drop the text silently" as rejected by the user. That was about switching inline forms. The A11 fix drops text silently when the user leaves the board, which is a different case, but worth confirming.
- Accepted risks: none
- `openspec validate add-board-view-ui --strict`: valid before and after the edits.
- The new wording itself has not been reviewed. Re-run this review in a fresh session.
