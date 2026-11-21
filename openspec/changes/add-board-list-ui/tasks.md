# Tasks

Commit after each logical chunk once all five gates pass (AGENTS.md › Git Workflow).

## 1. Prerequisites

- [ ] 1.1 Verify the web foundation change has landed on this branch's base: TanStack Router, TanStack Query, React Hook Form and Zod are installed, the app `QueryClient` has the defaults from design.md, the shell layout with its top-bar slot and the temporary `/` route exist, and the text normalize-and-count helper is in `core/utils`. If not, stop and tell the coordinator (cardiganapp-18)
- [ ] 1.2 Verify auth's `useSession()` with `email: string | null` and a logout action exists. If not, build against the `account` prop only; the app-layer wiring belongs to `web-boards-connect` (D23)

## 2. Shared key and name checks

- [ ] 2.1 Move the board key check to `core/utils/boardKey.ts` (`normalizeKeyInput`, `checkBoardKey`) and the key error strings to the `common` namespace (`keyErrors.*`). Switch `transfer`'s `ClashDialog` and `useImportViewModel` to them and remove the old copies. Verify all existing `transfer` tests pass unchanged and `npm run lint` shows no boundary violations
- [ ] 2.2 Add adversarial unit tests for `checkBoardKey`: empty, `C`, `CR`, `CRDBX`, `CRDBXY`, `CR1`, `ÄB`, `C D`, lowercase input after `normalizeKeyInput`, a 6-character key with a digit (expects `TOO_LONG` first). Verify they pass
- [ ] 2.3 Add `core/utils/textField.ts` `checkSingleLineText(value, { max })` on the foundation's normalize helper, and the `nameErrors.*` strings in `common` ("Enter a name.", "Use at most {{n}} characters.", "Use a single line without control characters."). Unit tests: whitespace only, 100 letters with surrounding spaces, 101 code points, `"👨‍👩‍👧"` counted as 5, tab, LF, CR, NUL, unpaired surrogate, decomposed `é` at the limit. Verify they pass

## 3. Boards types, data-access seam and utils

- [ ] 3.1 Add `features/boards/types.ts` (`BoardSummary`, `BoardFieldError`, `BoardsErrorKind`, `BoardsError`, `BoardsDataAccess`) and `BoardsDataAccessProvider` as in design.md, and verify `npm run typecheck` passes
- [ ] 3.2 Add `createInMemoryBoardsDataAccess` (order of `api-conventions` › *Board list order*: `updatedAt` desc, `createdAt` desc, `id` asc; key rules, `ALREADY_USED` clash, fail-next and hold-next controls) with unit tests for order, an `updatedAt` tie broken by `createdAt`, a full tie broken by `id`, clash, rename keeping the key and updating `updatedAt`, and delete of a missing board rejecting with `notFound`. Verify they pass
- [ ] 3.3 Add `keyFromName` with unit tests: "Garden irrigation" → `GARD`, "Ärger v2" → `ARGE`, "Q3 2026" → empty, "A" → empty, "ab" → `AB`, "Cardigan v1" → `CARD`, emoji and CJK skipped, "Ølsted" (Ø has no decomposition) → `LSTE`. Verify they pass
- [ ] 3.4 Add `formatRelativeTime` with unit tests under `TZ=Europe/Berlin` with a fixed `now`: 30 s in the future, 59 s, 1 min, 59 min, 23:50 → 00:10 (minutes), 12:40 → 15:00 (hours), 23:10 → 00:30 (Yesterday), two days ago, same year, previous year, and across a DST change. Verify they pass
- [ ] 3.5 Add the `boards` namespace (`features/boards/i18n/en.json`) registered in `src/app/i18n.ts`, with every string from Figma page 9:5 and the copy from proposal.md › What Changes (plurals for cards, boards, minutes, hours). Verify each string matches Figma or the proposal character for character, including curly quotes and the en dash in "2–5"

## 4. Board list screen and states

- [ ] 4.1 Add `useBoards`, `boardsQueryOptions` and `useBoardListViewModel` (state derivation, refresh with the failure toast, dialog union). Feature tests with the in-memory data access: first load shows skeletons then boards, empty, load error and Try again, refresh keeps the list and marks the button busy, failed refresh keeps the list and shows "Couldn't refresh your boards. Check your connection and try again."
- [ ] 4.2 Add `BoardListScreen` for tablet/desktop (header with count, Refresh, Import, New board; `auto-fill` grid with the 260 px tile minimum; `BoardTile`s with "Updated …" and plural card counts) and phone (`AppBar` in the shell's top-bar slot with + and ⋯, no Refresh; `BoardRow` list; end-of-list count). Screen tests per state: count hidden while loading, empty and in error; "1 board"; tile and row texts; activating a tile calls `onOpenBoard` and the menu button doesn't; the accessible names from D21 (including "Actions for board “Cardigan v1”"). Check against the Figma frames Board list, Loading, No boards yet and Couldn't load boards at 390, 834 (2 columns) and 1440 px (4 columns), ignoring the phone refresh icon
- [ ] 4.3 Add `useLargeTitleCollapsed` (`IntersectionObserver`, viewport root, no shell scroll API, D24) and a screen test using a controllable stub: at the top the bar shows the brand, scrolled it shows "Boards" and is raised. Check At the top, Scrolled and End of the list against Figma at 390 px on the preview page
- [ ] 4.4 Add the tile and row menu (Rename, divider, Delete board) opening dialogs outside the menu, and a screen test that the dialog stays open after the menu closes and focus returns to the menu button after the dialog closes

## 5. Dialogs

- [ ] 5.1 Add `NewBoardDialog` (Root, view model, Screen) with React Hook Form: prefill until the key is edited, uppercase key input, the dynamic hint, the default columns note, name and key checks, local clash, D5 timing and disabled button, saving state (spinner, disabled fields and Cancel, no Escape or outside close), server field errors, unknown key code → "Use only the letters A–Z.", failure toast plus list reload, success → close and `onBoardCreated`. Feature tests cover each of these. Check New board and key already used against Figma at 390 and 1440 px
- [ ] 5.2 Add `RenameBoardDialog`: prefilled and focused name, disabled key with "The key can't be changed.", unchanged normalized name closes without a call, success updates the tile, 404 closes, removes the board and shows "“{name}” no longer exists.", failure keeps the dialog with "Couldn't save the board. Check your connection and try again.". Feature tests for each. Check Rename board against Figma at 1440 px and the phone layout at 390 px
- [ ] 5.3 Add `DeleteBoardDialog`: title, body for 0, 1 and 12 cards, destructive button, success and 404 remove the board from list and sidebar without a toast, failure keeps the dialog with "Couldn't delete “{name}”. Check your connection and try again.". Feature tests for each, including a name with `R&D <x>` checked exactly. Check Delete board against Figma at 390 and 1440 px
- [ ] 5.4 Export `RenameBoardDialog` and `DeleteBoardDialog` from `features/boards/index.ts` with props that need only a `BoardSummary` and `onClose(result)`. Feature tests render each on its own outside the board list and check the result: `renamed` with the new board, `unchanged` for Cancel and an unchanged name, `deleted` for a delete, a delete 404 and a rename 404

## 6. Sidebar section, phone menu and app-layer hooks

- [ ] 6.1 Add `BoardsSidebarSection` and `NewBoardDialogProvider`: "All boards" marked current on `/`, rows with name and key in list order, the footer email hidden while `account.email` is `null`, "+ New board" opening the shared dialog, no rows while loading, only "+ New board" when empty or in error. Feature tests for each state and for one dialog instance shared with the header button. Check against the sidebar in the Board list · Desktop 1440 and Tablet 834 frames
- [ ] 6.2 Add the phone ⋯ menu ("Signed in as {email}", Import board, Labels, divider, Log out) wired to `account`, `importAction` and `onOpenLabels`. Screen tests: items and order, no "Signed in as" line while the email is `null`, Import board opens `importAction.dialogs` and it stays open after the menu closes, Log out calls `onLogOut` without a confirmation. Check against Phone menu · Phone 390
- [ ] 6.3 Add `useBoardsChanged` and `useFindBoardNameByKey` for `transfer`'s import flow, with a feature test that an import success through a fake `importBoard` reloads the list and that a key clash finds the loaded board's name. Verify with `npm run lint` that `boards` imports no other feature and only `src/app` and `src/preview` import `boards`
## 7. Preview and integration checks

- [ ] 7.1 Add `src/preview/sections/BoardListSection.tsx` with the in-memory data access, seed and failure controls, and the import flow fake. Walk through every Figma frame on page 9:5 at 390, 834 and 1440 px in light and dark mode and note any difference
- [ ] 7.2 Walk through the board list with the keyboard only (open a board, open a menu, rename, delete, create, refresh, Try again, phone menu) and verify focus lands on the name field when a dialog opens and returns to its trigger when it closes
- [ ] 7.3 Run all five gates on a clean checkout of the branch and verify they pass

## Workflow follow-up

- Send the coordinator (cardiganapp-18) the commit that moved the key check and the public `boards` exports, so the board view session can rebase.
- Archive the change after review.
