# Artifact review: add-board-list-ui

**Verdict:** Ready
**Reviewed:** 2026-11-21, schema `careful-planning`, repo kind `code`

No blockers. All 13 majors (two of them conflicts between reviewers) and 19 minors were applied on 2026-11-22. The new wording itself has not been reviewed; a re-run in a fresh session is recommended.

| Reviewer | Blocker | Major | Minor |
|---|---|---|---|
| Testability | 0 | 7 | 6 |
| Security | 0 | 0 | 0 |
| Hidden assumptions | 0 | 7 | 8 |
| Design contract | 0 | 6 | 7 |

Counts are per reviewer before merging. Merged: T1/D5/A2, T6/D4/A5, D2/A1, D6/A3, A4/T8, T10/A15.

## Conflicts between reviewers

### C1: How the screen switches between phone and tablet/desktop (T1, D5, A2) — major
- **T1 and A2:** Mount both trees, as `AppLayout` does, and hide one with the theme's `phone` variant. No JS media query. Tests scope queries with `within(...)` to the phone app bar region or the header/grid region. Visible region per size, column count and phone dialog layout are checked on the preview page (7.1). T1 also rewrites the spec THENs so they can be tested in jsdom: "the phone app bar contains no Refresh button", "uses the same layout as on desktop, next to the 224 px sidebar".
- **D5:** `BoardListScreen` takes `layout: 'phone' | 'wide'`. The Root reads it from a new `usePhoneCondition()` hook in `core/ui`, which uses `matchMedia` with the query generated from the same theme variable as the `phone` variant. Screen tests pass `layout` directly.
- **Why both can't apply:** one mounts both trees and relies on CSS, the other mounts one tree and needs a JS hook. Each reviewer lists the other's approach as its alternative.
- **User's decision:** CSS, mount both (T1/A2). Applied.

### C2: What an unknown `name` field error code shows (T6 vs D4, A5) — major
- **T6:** Align the spec with design.md: an unknown `name` code shows no field error and the generic failure toast ("Couldn’t create the board. Check your connection and try again.").
- **D4 and A5:** Follow `api-errors` › *Clients handle unknown error codes by status* › "New field code" ("shows its general invalid-value message on that field"). D4 proposes "Use a single line without control characters." under Name, as add-board-view-ui does for column names. A5 proposes new general copy for the user to confirm, or else recording the toast in decisions.md as a deliberate deviation.
- **Agreed by all three:** a 4xx with no field error the dialog can show (for example 400 without fields, 409 with an unknown code) is handled like `other` (toast, dialog stays open). T6 also adds a scenario for an unknown `key` code under *Create board result*.
- **Why both can't apply:** toast vs field message for the same response.
- **User's decision:** field message "Use a single line without control characters." (D4/A5). T6's other parts (any error that can't go under a field → toast, unknown key code scenario) were applied too.

## Findings

### C1 (T1, D5, A2): Viewport-dependent behavior has no test input and no defined switching mechanism
**Status:** applied

**T1 — Testability**
- Severity: major. The phone and non-phone scenarios can't be written as automated tests. A test written from the spec either can't pass or can't fail.
- Location: specs/web-board-list/spec.md > *Board list layout per size* (all 3 scenarios), *Refresh* > Scenario: Phone, *Sidebar board section*, *Sizes without their own frame* (both scenarios); design.md > Tests
- Current text: "**WHEN** the board list loads 6 boards on a phone / **THEN** 6 board rows show in one list, the app bar has + and ⋯, and there is no refresh button"; "**THEN** the empty state looks like the desktop frame next to the tablet sidebar"
- Problem: the phone condition is CSS only (`@custom-variant phone` in theme.css; `AppLayout` renders both `appBar` and `sidebar` and hides one with `hidden phone:block`). jsdom loads no CSS, so screen and feature tests always see both variants. "There is no refresh button" fails in jsdom because the desktop header's Refresh is in the DOM. "Grid of 4 columns" and "2 columns" need real layout. "Looks like the desktop frame" is not measurable. The only fakes are data access, IntersectionObserver and time, so nothing controls the viewport.
- Failure scenario: an implementer writes `expect(queryByRole('button',{name:'Refresh'})).toBeNull()` for the phone scenario. It fails in jsdom. They drop the check, and a Refresh button leaking into the phone bar goes uncaught.
- Proposed fix: in spec.md, Phone scenario THEN → "6 board rows show in one list, the phone app bar contains the "New board" and "Menu" buttons, and it contains no "Refresh" button". Refresh > Phone THEN → "the phone app bar has no "Refresh" button". Empty state on tablet THEN → "the empty state uses the same layout as on desktop, next to the 224 px sidebar". Add to design.md > Tests: "Which variant shows at a size is decided only by the theme's `phone` variant in CSS. jsdom applies no CSS, so screen and feature tests render both variants and scope queries to the phone app bar region or the header and sidebar region. Which region is visible at 390, 834 and 1440 px, the grid's column count and the phone dialog layout are checked on the preview page in 7.1."
- Test sketch: screen (jsdom) plus preview. Render `BoardListScreen` ready with 6 boards, query within the phone app bar. Passes when it holds "New board" and "Menu" and no "Refresh". Fails when the Screen renders `IconButton name="Refresh"` inside the phone `AppBar`.

**D5 — Design contract**
- Severity: major. It decides the Screen's structure and whether the per-size screen tests in 4.2 and 6.2 can be written at all.
- Location: design.md > Pieces and structure; tasks.md > 4.2, 6.2
- Current text: "The Screen renders the header (tablet/desktop) or the phone app bar content, the grid or list, the states, and the dialogs."
- Problem: the phone condition exists only as the `phone` custom variant in theme.css. "Renders … or …" implies a JS decision for which no hook exists. If both variants are rendered and hidden with CSS, both the grid and the list exist in jsdom and the DOM is doubled.
- Failure scenario: one implementer adds a `matchMedia('(max-width: 639px), (max-height: 479px)')` hook, duplicating the breakpoint. Another renders both trees, and screen tests find duplicate "Cardigan v1" elements.
- Proposed fix: add to design.md: "`BoardListScreen` takes `layout: 'phone' | 'wide'`. The Root reads it from a `usePhoneCondition()` hook in `core/ui`, which uses `matchMedia` with the media query generated from the same theme variable as the `phone` variant (one source). Screen tests pass `layout` directly." Alternative: render both with CSS and scope tests to a `data-layout` container. Either way, state the choice.

**A2 — Hidden assumptions**
- Severity: major.
- Location: design.md > Pieces and structure; spec > Board list layout per size; tasks.md 4.2
- Assumption: "or" implies only one tree is mounted, while `AppLayout` mounts both and `web-design-system` › *Phone condition* requires a single definition of the phone condition.
- Failure scenario: Implementer A mounts both; `getByRole('button', { name: 'Actions for board “Cardigan v1”' })` finds two elements. Implementer B repeats the 640/480 px query in JS.
- Proposed fix: add to design.md, under "Phone vs. tablet/desktop": "Like `AppLayout`, the Screen mounts both the tablet/desktop header and grid and the phone app bar and list, and hides one with the theme's `phone` variant. No JavaScript media query. Screen tests check each region by scoping queries with `within(...)`. The phone app bar has no Refresh button in its markup." Alternative: a single `useIsPhone()` hook in `core/ui` reading the same tokens, which requires changing `AppLayout` too.

### C2 (T6, D4, A5): Server errors the dialog can't place under a field
**Status:** applied

**T6 — Testability**
- Severity: major. Spec and design disagree, and some responses have no defined outcome.
- Location: spec > *Create board result*, *Board dialog failures*; design.md > Forms
- Current text: spec: "Server field errors SHALL show under their fields and keep the dialog open; an unknown `key` error code SHALL show "Use only the letters A–Z."" and "fails without a response or with a 5xx"; design: "an unknown `name` code to the generic save failure toast"
- Problem: the spec says every server field error shows under its field, so an unknown `name` code would show under the field with no text defined. The design sends it to a toast. A non-404 4xx with no usable field error is covered by neither.
- Failure scenario: a rename fails with 400 and `name`/`SOME_NEW_CODE`. Spec readers expect an inline error, design readers the toast.
- Proposed fix: spec > *Board dialog failures* first sentence → "When a create, rename or delete request fails without a response, with a 5xx, or with any other error that can't be shown under a field (including an unknown `name` error code), the dialog SHALL stay open with the user's input, and an error toast SHALL show:". Add "Scenario: Unknown name code / WHEN the create request fails with 400 and `name`/`NEW_CODE` / THEN the dialog stays open, no error shows under Name, and the toast "Couldn’t create the board. Check your connection and try again." shows". Add a scenario for the unknown `key` code under *Create board result*.
- Test sketch: feature. In-memory data access fails the next create with `invalid` and `[{field:'name', code:'NEW_CODE'}]`. Passes when the toast shows and Name has no error.

**D4 — Design contract**
- Severity: major. It breaks a shared requirement this change lists as implemented, and gives the same app two behaviors.
- Location: design.md > Forms
- Current text: "An unknown `key` code maps to `INVALID_FORMAT` (D7), and an unknown `name` code to the generic save failure toast."
- Problem: `api-errors` › *Clients handle unknown error codes by status* › "New field code" requires "its general invalid-value message on that field". add-board-view-ui/design.md maps "Any other code → the control-character message".
- Failure scenario: the backend adds a new name rule. Renaming a board shows a connection toast; renaming a column with the same input shows a field error.
- Proposed fix: design.md > Forms → "an unknown `name` code shows "Use a single line without control characters." under the Name field, as in the board view change." Spec > Create board result: add the same. Add a test to task 5.1. Alternative: new generic copy (user decision).

**A5 — Hidden assumptions**
- Severity: major.
- Location: design.md > Forms
- Assumption: the set of `name` codes is closed. Also unspecified: `kind: 'invalid'` with no field error for a shown field (for example 400 `MALFORMED_REQUEST` with empty `fieldErrors`).
- Failure scenario: backend adds `name`/`INVALID_VALUE`; the user sees a misleading connection toast and retrying gives the same result. With `invalid` and `fields: []`, one implementer shows nothing, another the toast.
- Proposed fix: design.md > Forms → "An unknown `key` code maps to `INVALID_FORMAT` (D7). An unknown `name` code shows [general name message, copy to be confirmed by the user] under the Name field. An `invalid` result with no error for `name` or `key` is handled like `other`." Add a matching spec scenario. Alternative: keep the toast and record it in decisions.md as a deliberate deviation from `api-errors`.

### D1: Nobody can deliver the sidebar account footer as written, and three changes disagree on who owns it
**Status:** applied · Related: A14
- Severity: major. Two sessions could each assume the other builds the footer, or both could build it. The null-email case also needs a `core/ui` change that no task covers.
- Location: spec > Sidebar board section; design.md > Context and > Pieces and structure; tasks.md > 6.1
- Current text: "The footer SHALL show the user's email, hidden while unknown, and a log out button." (spec), and "`core/ui` already has every component the screens need: … `Sidebar` (with `boards`, `boardsAction` and `account` slots)" (design)
- Problem:
  - The footer is `Sidebar`'s `account` prop. `Sidebar` is rendered by `AppShell` in `src/app`, and D23 says this change touches nothing there. `BoardsSidebarSection` fills only the `boards` slot, so it cannot render the footer.
  - `Sidebar.account` requires `email: string` and `initial: string` (src/core/ui/Sidebar.tsx). "Email hidden while unknown" needs a `Sidebar` change, and no task has one. What the avatar initial shows while the email is null is not decided.
  - add-web-foundation/decisions.md D4 says "Auth adds the account footer (email + log out)". This change's spec claims the footer.
- Failure scenario: task 6.1 tests "the footer email hidden while `account.email` is `null`" inside `BoardsSidebarSection`, which has no footer. Either a second footer appears inside the boards slot, or nobody builds one and connect finds `Sidebar` cannot accept `null`.
- Proposed fix:
  - design.md > Pieces and structure: "`BoardsSidebarAccount` (or a `sidebarAccount(account)` helper) returns the props for `Sidebar`'s `account` slot. This change makes `Sidebar.account.email` accept `null`: the email text and avatar initial are hidden while it is `null`. `AppShell` passes it in `web-boards-connect`."
  - tasks.md 6.1: "Change `core/ui` `Sidebar` so `account.email` may be `null` (no email text, no avatar initial), with a `Sidebar` test and a preview state."
  - Ask the coordinator to correct add-web-foundation D4 to "Board list adds the account footer; auth provides the email and log out."
  - Alternative: move the footer requirement to auth's change and remove it from this spec.

### M1 (D2, A1): The sidebar section has no defined host, slots, callbacks or route context outside the board list
**Status:** applied
- Severity: major (both). The sidebar is mounted in `AppShell` on every authenticated route, so on some routes "+ New board" could do nothing, and connect would have to redesign this.
- Location: design.md > Pieces and structure (`BoardsSidebarSection`, `NewBoardDialogProvider`); spec > Sidebar board section, New board entry points
- Current text: "`BoardsSidebarSection`: "All boards" (current on `/`) for the sidebar's main nav, and the rows and "+ New board" for `Sidebar`'s `boards` slot. … opens the same New board dialog through a small `NewBoardDialogProvider` context, so the sidebar and the screen share one dialog instance." and "The Screen renders … the dialogs."
- Problem (D2): `Sidebar` takes `mainNav`, `boards` and `boardsAction` as separate props; one component can't fill all three. The dialog is rendered by `BoardListScreen`, but the sidebar is also visible on the board view route, where "+ New board" would set context state nothing renders. The provider has to wrap `AppLayout` in `AppShell`, which the design doesn't say. Nothing specifies what a sidebar board row does or the current-board highlight, though add-board-view-ui's spec assumes the rows open boards. "Current on `/`" needs a route check or a prop.
- Assumption (A1): the section only lives next to `BoardListRoot`. Unstated: where the dialog renders without `BoardListRoot`, where the sidebar gets `onBoardCreated`/`onOpenBoard`, how "All boards" knows it's current, which providers sit above `AppShell`. The preview page has no router, so router hooks would crash it.
- Failure scenario: on `/boards/{id}`, "+ New board" in the sidebar opens nothing; board rows have no handler; the preview throws without a router.
- Proposed fix (combined):
  - D2: replace the `BoardsSidebarSection` bullet with "`BoardsNavItem({ isCurrent })` for `mainNav`, `BoardsNavList({ currentBoardId, onOpenBoard })` for `boards` (rows marked current with `isSelected`), and `NewBoardNavItem` for `boardsAction`. `NewBoardDialogProvider({ onBoardCreated, children })` renders the single `NewBoardDialog` itself. The app layer mounts it around `AppLayout`, so the header, the empty state, the phone + and the sidebar open the same dialog on every route. `BoardListScreen` does not render the New board dialog."
  - A1: the app layer mounts `BoardsDataAccessProvider` and `NewBoardDialogProvider` above `AppShell`; the sidebar pieces use no router hooks (current state and links come in as props), so the preview can mount them without a router.
  - Spec > Sidebar board section: "Activating a board row SHALL open that board. The row of the open board SHALL be marked current." Spec > New board entry points: "The sidebar's '+ New board' SHALL work on every page that shows the sidebar." Add a scenario and a test in 6.1.
  - Links: use the same `renderBoardLink` as M2 if that is accepted.

### M2 (D6, A3): `onOpenBoard(boardId)` doesn't fit `BoardTile`/`BoardRow`, which take a link element
**Status:** applied
- Severity: major (both). Connect would have to change the screens to get real links. Until then, tiles lose link behavior (new tab, middle-click), and screen readers announce a button.
- Location: design.md > Pieces and structure; spec > Board tile and row content
- Current text: "`onOpenBoard(boardId)` and `onBoardCreated(board)`: navigation (D9). Until the board view route exists, the preview logs them."
- Problem: `BoardTile` and `BoardRow` take `link: ReactElement` ("The link that opens the board, without children, for example a router `Link`"), and `NavItem` uses `asChild` the same way. A callback forces a `<button>` or an `<a>` without `href`. The auth change already uses render props for links (`renderRegisterLink(label)`).
- Failure scenario: `web-boards-connect` wants `<Link to="/boards/$boardId">` and has to edit `BoardListScreen` and the sidebar rows. Until then Ctrl-click on a tile does nothing.
- Proposed fix: replace the bullet with "`renderBoardLink(boardId): ReactElement` returns the element passed to `BoardTile`/`BoardRow`/`NavItem` as their link. Connect passes a router `Link` to `/boards/$boardId`. The preview and the tests pass a `<button>` that logs or records the id." Keep `onBoardCreated(board)` as a callback (D9). tasks.md 4.2: "activating a tile activates the element from `renderBoardLink`".

### M3 (A4, T8): Local key clash check with no list loaded, or a stale list
**Status:** applied
- Severity: major (A4; T8 rated the unloaded case minor).
- Location: spec > Local key clash; design.md > Forms
- Current text: "On submit, the key SHALL be compared with the keys of the boards already loaded." / "Local clash (D8): the key validator also checks the keys from `useBoards()` data."
- Assumption: loaded data always exists and is current. New board can be used during the first load (*Loading state*) and in the error state (sidebar). With `staleTime: Infinity`, a board deleted on another device keeps its key "used" locally until Refresh or reload, and web phones have no Refresh (D12).
- Failure scenario: (1) Submit during loading or error: one implementer blocks, another sends unchecked. (2) The user deleted `GARD` on the phone app; on the web phone, creating `GARD` keeps showing "You already have a board with the key GARD." with no request and no refresh control.
- Proposed fix: add to spec > Local key clash and design.md > Forms: "While the boards haven't loaded (loading or load error), the local comparison SHALL be skipped and the server's 409 decides. The comparison uses the list as last loaded; a key freed on another device is accepted after Refresh, Try again or a page reload." T8's scenario: "Boards not loaded yet / WHEN the first load is still running and the user submits a new board with `CRD` / THEN the create request is sent". Alternative (changes D8, user decision): on a local match, send anyway and rely on the 409.

### T2: The "Pasted line break" scenario can't happen in a single-line input
**Status:** applied
- Severity: major. The scenario can never pass as written.
- Location: spec > *Name checks* > Scenario: Pasted line break
- Current text: "**WHEN** the user pastes "Road\nmap" into the name / **THEN** "Use a single line without control characters." shows on submit"
- Problem: `core/ui/Input` renders `<input>`. Browsers and jsdom strip LF and CR from a text input's value, so it becomes "Roadmap" and no error shows.
- Failure scenario: the feature test gets no error; an implementer switches the field to a textarea, which changes the design.
- Proposed fix: replace with "Scenario: Pasted tab / WHEN the user pastes "Road\tmap" into the name / THEN "Use a single line without control characters." shows on submit and nothing is sent". Add "Scenario: Pasted line break / WHEN the user pastes "Road\nmap" into the name / THEN the field shows "Roadmap"". Keep LF and CR in the unit tests (2.3).
- Test sketch: feature. Paste "Road\tmap", submit. Passes when the error shows and `createBoard` isn't called. Fails when the check only tests `/[\r\n]/`.

### T3: Spec copy uses straight apostrophes where Figma and the app use ’
**Status:** applied
- Severity: major. Every exact-text assertion with an apostrophe has two valid expected values, and task 3.5 requires a character-for-character match.
- Location: spec > *New board dialog*, *Load error state*, *Refresh*, *Board dialog failures*, *Rename board dialog*, *Delete board dialog* (12 occurrences); proposal.md > What Changes > Copy without a design
- Current text: "The key can't be changed later.", "Couldn't load your boards", "This can't be undone.", "Couldn't create the board."
- Problem: the Figma export (`cardigan-shared-specs/docs/design/board-list.html`) has "can’t" and "Couldn’t load your boards". `transfer/i18n/en.json` also uses ’. The undrawn toast copy exists only in the proposal and spec, with straight quotes.
- Failure scenario: the implementer takes "This can’t be undone." from Figma; a test from the spec asserts "This can't be undone." and fails. Or toasts ship with ' while drawn strings use ’.
- Proposed fix: replace every `'` inside quoted UI copy with `’` in spec.md and proposal.md > Copy without a design. The copy is shared with mobile, so confirm with the user. Alternative: keep ' for undrawn strings only. Note: decisions.md D1, D2, D10, D11 also use straight apostrophes; the decision is the wording, not the glyph, so this finding doesn't challenge it.
- Test sketch: screen. Delete dialog for a board with 0 cards. Passes when `getByText('This can’t be undone.')` matches.

### T4: The key hint's text for an empty key is undefined, and the dialog opens in that state
**Status:** applied
- Severity: major. The first thing every New board dialog shows has no specified text.
- Location: spec > *New board dialog* > Scenario: Hint follows the key
- Current text: "a Key field with the hint "2–5 uppercase letters. Card IDs will look like {key}-1. The key can't be changed later.""
- Problem: the dialog opens with an empty key, and the key also stays empty for names like "Q3 2026". Filling `{key}` literally gives "Card IDs will look like -1.". Figma only shows the hint with `GARD`.
- Failure scenario: one implementer renders "…look like -1.", another hides the sentence, a third shows a placeholder.
- Proposed fix (user's choice): "While the Key field is empty, the hint SHALL read "2–5 uppercase letters. The key can’t be changed later."" plus "Scenario: Hint with an empty key / WHEN the New board dialog opens / THEN the hint reads "2–5 uppercase letters. The key can’t be changed later."". Alternative: a placeholder key such as `KEY-1`.

### T5: Relative time doesn't say how minutes and hours are rounded
**Status:** applied
- Severity: major. The scenarios pass for both floor and round, and the format is shared with mobile.
- Location: spec > *Relative update time*
- Current text: ""1 minute ago" / "{n} minutes ago" (under 1 hour), "1 hour ago" / "{n} hours ago" (same calendar day)"; Scenario: 12:40 → 15:00 gives "2 hours ago"
- Problem: 2 h 20 min gives 2 under both. 2 h 40 min gives 2 or 3; 90 s gives 1 or 2 minutes.
- Failure scenario: web uses `Math.round`, mobile floors. At 2 h 40 min they differ, and every scenario still passes.
- Proposed fix: "(under 1 hour, whole minutes rounded down)" and "(same calendar day, whole hours rounded down)". Add "Scenario: Rounded down / WHEN it is 15:00 and the board was updated at 12:21 the same day / THEN the time reads "2 hours ago"" and "Scenario: Minutes rounded down / WHEN the board was updated 119 seconds ago / THEN the time reads "1 minute ago"". Add the same cases to task 3.4.

### T7: The reusable dialogs' result contract has no scenarios, and the outcome of a rename 404 is set only in the design
**Status:** applied
- Severity: major. The board view depends on these results.
- Location: spec > *Rename result*
- Current text: "The Rename and Delete board dialogs SHALL report to the screen that opened them whether the board was renamed (with the new board), deleted, or neither."
- Problem: no scenario checks the reported result. Rename 404 → `deleted` and Cancel → neither are stated only in design.md.
- Failure scenario: an implementer reports `unchanged` after a rename 404; the board view stays on a board that no longer exists, and every spec scenario passes.
- Proposed fix: add "A rename that fails with 404 SHALL report deleted. Cancel SHALL report neither." Add scenarios "Result after rename" (reports renamed with "Cardigan v2"), "Result after a rename 404" (reports deleted), "Result after Cancel" (reports neither), and a "reports deleted" scenario under *Delete result*.

### D3: `checkSingleLineText` duplicates the foundation's `checkText`, and design.md calls a `normalize` function that doesn't exist
**Status:** applied
- Severity: major. A second core API for the same shared rule, with different error names, while board view and labels pick one.
- Location: design.md > Shared checks and strings; design.md > Forms; tasks.md > 2.3
- Current text: "`core/utils/textField.ts`: `checkSingleLineText(value, { max })` returning `REQUIRED | INVALID_CHARACTER | TOO_LONG | null`, built on the foundation's normalize-and-count helper." and "if `normalize(name) === board.name`"
- Problem: add-web-foundation/design.md > Text helper already provides `checkText(value, { kind: 'singleLine', max })` returning `{ value, error: 'EMPTY' | 'TOO_SHORT' | 'TOO_LONG' | 'INVALID_CHARACTER' | null }`. The wrapper only renames `EMPTY` to `REQUIRED`. The normalize function is `normalizeText(value, 'singleLine')`.
- Failure scenario: board view's column names use `checkText` while board and label names use `checkSingleLineText`; `EMPTY` and `REQUIRED` both map to "Enter a name." in two places and drift.
- Proposed fix: replace the `textField.ts` bullet with "Name checks call the foundation's `checkText(value, { kind: 'singleLine', max: 100 })` and send its returned `value`. `EMPTY` maps to `nameErrors.required`, `INVALID_CHARACTER` to `nameErrors.invalidCharacter`, and `TOO_LONG` to `nameErrors.tooLong`. No new `core/utils` file." In > Forms, `normalize(name)` → `normalizeText(name, 'singleLine')`. In tasks.md 2.3, drop the helper and keep the `nameErrors.*` strings plus a test that the mapping covers every `checkText` error a name can produce. Also update design.md > Tests, which lists `checkSingleLineText`.

### A6: Focus return after a delete (or a rename 404) targets a trigger that no longer exists
**Status:** applied
- Severity: major. Task 7.2 can't pass as written.
- Location: tasks.md 4.4 and 7.2; spec > Delete result, Rename result
- Current text: "focus returns to the menu button after the dialog closes" / "verify focus lands on the name field when a dialog opens and returns to its trigger when it closes"
- Assumption: the tile whose menu opened the dialog still exists when it closes. After a delete or rename 404 it's removed, so focus falls to `body`.
- Failure scenario: a keyboard user deletes "Cardigan v1"; focus lands on `body` and the next Tab starts from the top.
- Proposed fix: add to spec > Delete result: "When the board's tile or row is gone, focus SHALL move to the next board's menu button, or the previous one if it was the last, or the New board button if no boards are left." Same for the rename 404 case. Task 7.2: "…or as in *Delete result* when the trigger is gone".

### A7: Create and rename responses are assumed to carry `cardCount`
**Status:** applied
- Severity: major. Limited to connect, but a wrong guess shows "0 cards" right after a rename.
- Location: design.md > The seam; design.md > Server state
- Current text: "`renameBoard(id: string, name: string): Promise<BoardSummary>`" and "Rename and delete also update the cache right away (replace or remove the board)"
- Assumption: rename and create responses include every `BoardSummary` field. design.md's own risk note says `cardCount` belongs to the list item and comes from be-cards, so PATCH/POST may not return it.
- Failure scenario: connect sets `cardCount: 0` for the missing field; the tile shows "0 cards" until the refetch, and the Delete dialog says only "This can’t be undone." for a board with 12 cards if the refetch fails.
- Proposed fix: design.md > Server state: "Rename updates the cached summary by merging `name` and `updatedAt` from the result into the existing entry. `cardCount` stays from the cache. The create result is only passed to `onBoardCreated`; the list gets the new board from the refetch." The seam: "`renameBoard` and `createBoard` results are only trusted for `id`, `name`, `key` and `updatedAt`."

### T9: "The board opens" and "Labels opens the labels page" can't be observed in this change
**Status:** applied
- Severity: minor.
- Location: spec > *Board tile and row content* > Open a board; *Create board result* > Created; *Phone menu*
- Current text: "**THEN** the board "Cardigan v1" opens"; ""Labels" SHALL open the labels page"
- Problem: D23 mounts nothing and D9 says creation only calls `onBoardCreated`, so a test has nothing to check for "opens".
- Proposed fix: THENs → "the board list asks the app to open the board "Cardigan v1"" and "the dialog closes and the board list asks the app to open the new board "Garden irrigation"". Phone menu → ""Labels" SHALL ask the app to open the labels page".

### M4 (T10, A15): The point where the phone title collapses is undefined
**Status:** applied
- Severity: minor.
- Location: spec > *Phone title on scroll*; design.md > Phone app bar title
- Current text: "Once it has scrolled under the bar, the bar SHALL show "Boards" in place of the brand and a divider below the bar." / "When the title isn't visible, the app bar gets `isRaised`…"
- Problem: "scrolled under" / "isn't visible" could mean partly or fully hidden (threshold 1 vs 0). The stub test passes with both.
- Proposed fix: spec → "Once the large title is completely hidden under the bar, …", plus "Scenario: Partly hidden / WHEN half of the large title is under the bar / THEN the bar still shows the brand". design.md: "The title counts as collapsed when it is fully hidden (`threshold: 0`, `isIntersecting === false`)." Or threshold 1 if Figma's "Scrolled" note means "starts to go under".

### T11: The reload after a failed create can't show why it exists
**Status:** applied
- Severity: minor.
- Location: spec > *Board dialog failures* > Create fails offline; design.md > The seam
- Problem: the in-memory data access's "fail the next call" doesn't say whether the create is applied before the failure, so the D19 case (board created despite a lost response) can't be set up.
- Proposed fix: design.md: the in-memory data access "can be told to apply the next create and then reject it with `other` (a lost response)". Spec: "Scenario: Board created despite a lost response / WHEN the create of `GARD` reaches the server but its response is lost, and the user submits `GARD` again / THEN "You already have a board with the key GARD." shows and nothing is sent".

### T12: Some requirement promises have no scenario
**Status:** applied
- Severity: minor.
- Location: spec > *Board count*, *Load error state*, *Refresh*, *Board menu*, *New board entry points*, *Saving in board dialogs*
- Problem: no scenario for: no count in empty and error states, Try again showing loading, Refresh in the error state, Rename opening its dialog and staying open, phone + and empty-state entry points, no automatic repeat.
- Proposed fix: add scenarios "Empty state has no count", "Refresh in the error state" (skeletons show), "Rename from the menu" (dialog opens and stays open after the menu closes), "Phone +" (New board opens), "No automatic repeat" (sent exactly once).

### T13: "Lowercase letters become uppercase" is ambiguous for non-ASCII letters
**Status:** applied
- Severity: minor.
- Location: spec > *Key input*
- Current text: "Lowercase letters typed into the Key field SHALL show as uppercase."
- Problem: `normalizeKeyInput` uppercases ASCII only; `ä` stays `ä`, while a spec reader expects `Ä`.
- Proposed fix: "Lowercase letters a–z typed into the Key field SHALL show as uppercase A–Z; other characters SHALL stay as typed." Add "Scenario: Non-ASCII letter / WHEN the user types `cä` / THEN the field shows `Cä`".

### D7: The key rules and messages are defined in a circle with `web-board-transfer`
**Status:** applied
- Severity: minor.
- Location: spec > Key input
- Current text: "The key SHALL be checked on the client with the rules and messages of the import key clash field (`web-board-transfer` — *Key field in the clash dialog*) before anything is sent."
- Problem: `web-board-transfer` › *Key field in the clash dialog* says "The Key field SHALL follow the New board key field, with its error messages". Neither states the messages.
- Proposed fix: "The key SHALL be checked on the client before anything is sent, in this order: empty "Enter a key.", fewer than 2 characters "Use at least 2 letters.", more than 5 "Use at most 5 letters.", any character other than A–Z "Use only the letters A–Z.". The import key clash field uses the same check."

### D8: `interface BoardsDataAccess` fails the project's lint rule
**Status:** applied
- Severity: minor.
- Location: design.md > The seam
- Current text: "interface BoardsDataAccess {"
- Problem: `.oxlintrc.json` sets `typescript/consistent-type-definitions: ["error", "type"]`.
- Proposed fix: `type BoardsDataAccess = { listBoards(): Promise<BoardSummary[]>; … }`.

### D9: The move of the key strings leaves out the `ALREADY_USED` message
**Status:** applied
- Severity: minor.
- Location: design.md > Shared checks and strings
- Current text: "`common` namespace: `keyErrors.*` (moved from `transfer`'s `clash.keyErrors`) and `nameErrors.*`."
- Problem: "You already have a board with the key {{key}}." lives in `transfer`'s `clash.keyUsed`, not under `clash.keyErrors`. D7 lists `ALREADY_USED` among the moved strings.
- Proposed fix: "`keyErrors.*` (moved from `transfer`'s `clash.keyErrors`, plus `keyErrors.alreadyUsed` moved from `clash.keyUsed`)", and mention it in task 2.1.

### D10: The list of stable public names is missing names the board view change depends on
**Status:** applied
- Severity: minor.
- Location: design.md > Risks / Trade-offs
- Current text: "This change keeps the public names stable: `BoardsDataAccess`, `BoardSummary`, `useBoards`, `RenameBoardDialog`, `DeleteBoardDialog`."
- Problem: add-board-view-ui tasks 1.1 also expects `BoardsDataAccessProvider`, `createInMemoryBoardsDataAccess`, `boardsQueryOptions`, `sampleBoards` and the `onClose` result union.
- Proposed fix: "`BoardsDataAccess`, `BoardsDataAccessProvider`, `BoardSummary`, `BoardsError`, `useBoards`, `boardsQueryOptions`, `createInMemoryBoardsDataAccess`, `sampleBoards`, `RenameBoardDialog`, `DeleteBoardDialog` and their `onClose` result type."

### D11: After a lost create response, the user can retry before the reload finishes
**Status:** applied
- Severity: minor. Note: the hidden-assumptions reviewer listed the same situation as safe to leave implicit (key uniqueness prevents a duplicate board).
- Location: design.md > Server state; spec > Board dialog failures
- Current text: "Create failure of kind `other`: invalidate `['boards']` (D19)."
- Problem: `api-conventions` › *Retries after a lost response* says clients "reload the affected data before the user tries again". "Create board" stays enabled during the refetch.
- Failure scenario: the board was created; the user submits again at once and gets a 409 "You already have a board with the key GARD." for their own new board.
- Proposed fix: design.md: "While that reload runs, "Create board" stays disabled (`isFetching` on `['boards']`)". Spec: "Create board SHALL stay disabled until that reload finishes."

### D12: The existing `ImportTrigger` and its labels are left without a clear role
**Status:** applied
- Severity: minor.
- Location: design.md > Pieces and structure (`importAction`)
- Current text: "The board list renders the header Import button, the empty state Import button and the phone "Import board" item from it, without importing `transfer`."
- Problem: `transfer` exports `ImportTrigger` and owns "Import" / "Import board" (`import.button`, `import.menuItem`). With this design `ImportTrigger` goes unused and `boards` needs its own label copies. decisions.md › Facts still says the app layer mounts `ImportTrigger`.
- Proposed fix: "`boards` adds `importButton` "Import" and `importMenuItem` "Import board" to its namespace, and `transfer`'s `ImportTrigger`, `import.button` and `import.menuItem` are removed in task 2.1's commit." Alternative: `importAction` also carries `buttonLabel` and `menuItemLabel` from `transfer`.

### D13: Server field errors on rename are not specified or tested
**Status:** applied
- Severity: minor.
- Location: spec > Rename result; tasks.md > 5.2
- Problem: rename can return 400 `name`/`TOO_LONG` or `INVALID_CHARACTER`; the spec covers 404 and network/5xx only.
- Proposed fix: spec > Rename result: "Server field errors SHALL show under the Name field and keep the dialog open." Add a scenario (400 `name`/`TOO_LONG` with `max` 100 → "Use at most 100 characters.") and the test in 5.2.

### A8: The key prefill algorithm is ambiguous for compatibility characters and case mapping
**Status:** applied
- Severity: minor. Shared with mobile.
- Location: spec > Key prefill; decisions.md D4
- Current text: "the first 4 letters A–Z of the name, uppercased, after removing diacritics, skipping every other character"
- Failure scenario: "ﬁx" gives empty with NFD and `FIX` with NFKD. "ılık" gives `LK` or `ILIK` depending on whether `toUpperCase()` runs first.
- Proposed fix: "Removing diacritics means NFD decomposition followed by removing combining marks (\p{M}). No compatibility decomposition. Only ASCII `a–z` and `A–Z` count as letters before case mapping. `a–z` become `A–Z` without locale rules." Add "ﬁx" → empty and "ılık" → `LK` to 3.3, and send the wording to the coordinator for mobile. (Clarifies D4, doesn't change it.)

### A9: A server 409 on create doesn't reload the list
**Status:** applied
- Severity: minor.
- Location: design.md > Server state (Mutations)
- Current text: "Create failure of kind `other`: invalidate `['boards']` (D19)."
- Problem: a 409 `key`/`ALREADY_USED` proves the list is stale, but nothing reloads it; the user can resend the same failing request and the sidebar lacks the board.
- Proposed fix: "Create failure of kind `other`, or `invalid` with `key`/`ALREADY_USED`: invalidate `['boards']`."

### A10: Counts have no number format
**Status:** applied
- Severity: minor.
- Location: spec > Board tile and row content, Board count, Delete board dialog
- Current text: "the card count ("1 card", "{n} cards")"
- Failure scenario: "1234 cards" on web and "1,234 cards" on mobile.
- Proposed fix: "{n} SHALL be formatted with `en-US` digit grouping ("1,234 cards")." Alternative: without grouping. Tell the coordinator either way.

### A11: The Refresh icon also spins on background refetches, and repeated Refresh is undefined
**Status:** applied
- Severity: minor.
- Location: design.md > Server state
- Current text: "`ready`: data, with `isRefreshing = isFetching`"
- Problem: every mutation and import success invalidates `['boards']`, so the icon spins and gets `aria-busy` then too. A double click on Refresh is unspecified.
- Proposed fix: "`ready`: data, with `isRefreshing` true only while a refetch started by Refresh runs (tracked in the view model, not `isFetching`). Refresh is ignored while `isRefreshing`." Spec > Refresh: "Selecting Refresh while a refresh runs SHALL do nothing."

### A12: A session that ends during a request is mapped to `other` and shows a connection toast
**Status:** applied
- Severity: minor.
- Location: design.md > The seam (`BoardsErrorKind`)
- Current text: "| { kind: 'other' } // network, 5xx, anything else"
- Failure scenario: after idle, the refresh token is rejected, the create rejects, a connection toast shows and D19's reload fires, then the app goes to login.
- Proposed fix: "When a request fails because the session ended, the connect data access rejects with `{ kind: 'sessionEnded' }`. The board list shows no toast and starts no reload for it; `core/auth` handles the redirect." Add the kind to `BoardsErrorKind`.

### A13: It's undefined what makes `now` change "on the next render or refresh"
**Status:** applied
- Severity: minor.
- Location: design.md > Relative time
- Current text: "`now` comes from a `useNow()` hook read once per render, so tests pass a fixed time."
- Problem: with the React Compiler and structural sharing, a refetch with identical data doesn't re-render memoized tiles. Reading `Date.now()` in render is also impure.
- Failure scenario: loaded at 10:00, Refresh at 10:30 with no server change; tiles still say "Just now".
- Proposed fix: "`useNow()` returns a time taken when the screen mounts and updated whenever the boards query's `dataUpdatedAt` changes. Tests inject a fixed time through the same hook's provider."

### A14: The sidebar avatar's initial isn't defined
**Status:** applied · Related: D1
- Severity: minor.
- Location: spec > Sidebar board section; design.md > Pieces and structure (`account`)
- Current text: "The footer SHALL show the user's email, hidden while unknown, and a log out button."
- Problem: `Sidebar` requires `account.initial` for its `Avatar`; no artifact says how it's derived or what it shows while `email` is `null`.
- Proposed fix (design choice, confirm with the user): "The avatar SHALL show the first character of the email, uppercased; while the email is unknown the avatar SHALL be empty." Alternative: hide the avatar while unknown.

## Security analysis

The security reviewer found no gaps. The change has no HTTP, tokens, routes or storage of its own.

### Trust boundaries
- **Server-supplied board data rendered as text** (names in tiles, dialog titles, toasts, aria-labels). i18n has `escapeValue: false`, but every interpolated string is a React text child or attribute; no `dangerouslySetInnerHTML` or `<Trans>` in `src`. Task 5.3 tests `R&D <x>`. Stopped.
- **Bidi/format characters in imported names.** `text-length` allows U+202E, so labels can be visually confusing, but every action targets the board by id and only the user's own boards. No gain.
- **Server error responses mapped to `BoardsErrorKind`.** Unknown codes fall back to fixed copy; `max` is placed into text. No gain.
- **Rename/delete by another user's id.** Server returns 404 (`api-errors` › *Other users' data is not found, never forbidden*); the client only drops a cache entry. The local key clash check is UX only.
- **Session end and the `['boards']` cache.** Covered by AGENTS.md › Authentication (clear the Query cache on logout); this change adds no other storage. Enforcement belongs to auth-connect.
- **Dev preview page and in-memory data access.** `preview.html` is not a build input and `dist/` has only `index.html`; D23 keeps in-memory data out of the app.
- **Import flow callbacks.** Clash dialog shows the victim's own board name as text. No gain.

### Test versus production
- "The request SHALL NOT be repeated automatically": test `QueryClient` is separate from the app's, but TanStack Query v5 mutations default to `retry: 0`, and duplicate creates hit `ALREADY_USED`. No gap.
- "Delete 404 treated as deleted": same handling for a missing board and another user's board; reveals nothing.
- Local key clash with a stale cache: can only miss a clash; server 409 is the fallback. Not a security control.
- Names render as text: same React path in tests and production.
- Log out without confirmation: the board list only calls the callback; session clearing is auth-connect's.

## Assumptions safe to leave implicit
| Assumption | Where it is implied | Why it is safe |
|---|---|---|
| Browsers support `IntersectionObserver`, `String.prototype.isWellFormed`, CSS `auto-fill` grids | design.md > Phone app bar title, Grid; foundation text helper | AGENTS.md > Browser support lists only current and previous majors of Chrome, Edge, Firefox and Safari. |
| Requests eventually finish (no timeout) | design.md > Non-Goals | Deferred explicitly to connect; no real requests in this change. |
| A user may select Create again before the background reload after a lost response finishes | spec > Board dialog failures; D19 | Key uniqueness makes a duplicate create fail with 409. Rename and delete are safe to repeat. (The design-contract reviewer raised this as minor finding D11.) |
| The board key isn't trimmed or NFC-normalized on the client | spec > Key input; transfer's key check | The client is only stricter than the backend; matches the import clash field. |
| Board lists render without virtualization | spec > Sidebar board section, Board list layout | `api-conventions` › *Lists are complete and unpaginated* uses 300 boards as the example. |
| The delete dialog's card count may be stale | spec > Delete board dialog; D1 | D1 settled that the count comes from the list; it's informative only. |
| Relative time uses the device clock and time zone | spec > Relative update time | D13 settles it; future times read "Just now". |
| English only, `en-US` month names | design.md > Risks | AGENTS.md > i18n: English only. |
| `transfer` keeps its behavior after the key check moves | design.md > Shared checks and strings | Existing transfer tests must pass unchanged (2.1). |
| A renamed board jumps to the top after refetch | design.md > Server state | `api-conventions` › *Board list order*; D3 keeps server order. |

## New abstractions
- `BoardsDataAccess`, `BoardsError`, `BoardsErrorKind`, `BoardFieldError`: fine as is (D16). Fix the `interface` keyword (D8).
- `BoardsDataAccessProvider`: fine as is.
- `createInMemoryBoardsDataAccess` and `sampleBoards` in `features/boards/testing/`: fine; outside the AGENTS.md feature layout but used consistently with the board view.
- `boardsQueryOptions`, `useBoards`, `useCreateBoard`, `useRenameBoard`, `useDeleteBoard`: fine.
- `BoardListRoot` → `useBoardListViewModel` → `BoardListScreen`: fine; layout switch unspecified (C1), link prop should change (M2).
- `BoardsSidebarSection`: challenge; split per slot (M1).
- `NewBoardDialogProvider`: keep, but document where it's mounted and that it renders the dialog (M1).
- `NewBoardDialog`, `RenameBoardDialog`, `DeleteBoardDialog` with the `onClose(result)` union: fine (D17, D22).
- `core/utils/boardKey.ts`: keep (D7).
- `core/utils/textField.ts` (`checkSingleLineText`): challenge; use the foundation's `checkText` (D3).
- `common` `keyErrors.*` and `nameErrors.*`: keep; include `keyUsed` (D9).
- `formatRelativeTime`, `useNow`: fine (see A13 for `useNow`).
- `useLargeTitleCollapsed`: fine (D24).
- `useBoardsChanged`, `useFindBoardNameByKey`: fine.
- `account` and `importAction` props: fine as a boundary; `importAction` leaves `ImportTrigger` unused (D12).

## Coverage
- Artifacts reviewed: proposal.md, specs/web-board-list/spec.md, design.md, tasks.md, decisions.md (settled decisions)
- Missing artifacts: none
- Testability: all 29 requirements and 63 scenarios checked; findings touch 21 requirements and 15 scenarios. The live Figma file wasn't opened; the hint and apostrophe findings rely on the committed HTML export.
- Security: 7 trust boundaries and 5 invariants examined. `api-errors` and `api-conventions` were relied on through the change's citations; no backend board contract exists yet.
- Hidden assumptions: not applicable: resources (disk, battery, quotas), rate limits, process lifetime beyond lost responses, rollout beyond the noted dependencies. Figma not checked for A14 and A15.
- Design contract: code mode. Checked `core/ui` (Sidebar, AppBar, AppLayout, BoardTile, BoardRow, NavItem, PageHeader, Dialog, Menu, Button), `transfer`, i18n, `.oxlintrc.json`, `vitest.config.ts`, lint boundary test, preview; cross-checked add-web-foundation, add-auth-ui and add-board-view-ui.
- Reviewers that did not complete: none
- Findings dropped because their evidence did not exist: 0
- Findings dropped because they challenged decisions.md: 0

## Applied changes
- Files changed: `specs/web-board-list/spec.md`, `design.md`, `tasks.md`, `proposal.md` (no task checkbox changed)
- Where a finding offered alternatives, the reviewer's primary proposal was applied: T3 ’ in all UI copy; T4 empty-key hint without the "Card IDs" sentence; A10 `en-US` digit grouping; A14 avatar initial = first character of the email, uppercased, hidden while unknown; M3 skip the local check until boards load (D8 unchanged); D12 move the Import labels to `boards` and remove `transfer`'s `ImportTrigger` (with its test, and `TransferPlayground` switched to `useImportFlow`); D1 this change builds the account footer and makes `Sidebar.account` nullable.
- To meet `openspec validate --strict` (500-character limit), these new requirements were split out: *Refresh indicator*, *Key hint*, *Key prefill letters*, *Local key clash without current boards*, *Rename field errors*, *Dialog results*, *Sidebar account footer*.
- Coordinator follow-ups added to tasks.md: correct add-web-foundation D4 (footer owner), and send mobile the prefill, rounding and digit-grouping details.
- Stale non-standard artifacts the user chose not to update: none (there are none)
- Contradictions with decisions.md (not edited):
  - D1, D2, D10, D11 quote the copy with straight apostrophes; the artifacts now use ’ (T3).
  - Facts: "`transfer` exports `ImportTrigger` … which the app layer mounts into the board list header and phone menu" no longer holds; `ImportTrigger` is removed (D12).
- Accepted risks: none
