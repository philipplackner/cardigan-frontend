# Decisions: add-board-list-ui

Confirmed with Philipp Lackner on 2026-11-21, through the coordinator session (cardiganapp-18). The coordinator collected the questions from all six client sessions (mobile and web × auth, board list, board view) and asked the user once. This session didn't interview the user directly, so the careful-planning interview was replaced by that exchange. Coordinator IDs are given in brackets, for example [C-D8].

## Summary

Build the `boards` feature's board list UI for chunk 20 (`web-board-list-ui`): the board grid (tablet/desktop) and phone list, loading, empty and error states, refresh, New board, Rename board and Delete board dialogs, the sidebar's board section and the phone ⋯ menu. Data comes through a `BoardsRepository` interface with test doubles; the connect chunk adds the real API. The change builds on the web foundation change, which adds TanStack Router, TanStack Query, the empty shell layout and the text normalize helper.

## Decisions

### D1 — Delete dialog text [C-D8]
- **Question**: Figma's delete text names the column count. Where does that count come from?
- **Decision**: Drop the column count. The body is "Its {n} cards will be deleted too. This can't be undone." The board summary needs `cardCount` only.
- **Alternatives**: `columnCount` in the list response; fetch the board when the dialog opens.
- **Why**: User decision. Keeps the list response small and avoids an undrawn loading state.
- **Depends on**: —

### D2 — Counts and plurals [C-D9]
- **Question**: How do singular and zero counts read?
- **Decision**: "1 card" / "N cards", "1 board" / "N boards", "0 boards". With 0 cards the delete body is only "This can't be undone."
- **Alternatives**: A special "empty board" sentence.
- **Why**: User decision. Shared with mobile.
- **Depends on**: D1

### D3 — Board order [C-D17]
- **Question**: In which order are boards listed?
- **Decision**: The order of `api-conventions` — *Board list order*: `updatedAt` descending, then `createdAt` descending, then `id` ascending. The server sorts; the client keeps the server order. The sidebar uses the same order. (The first answer said "ties by name"; the coordinator withdrew that in its follow-up on 2026-11-21.)
- **Alternatives**: Newest created first; name A–Z; client-side sort.
- **Why**: Matches Figma and the shared spec. One order on every client.
- **Depends on**: —

### D4 — Key prefill [C-D11]
- **Question**: How is the key prefilled from the name?
- **Decision**: The first 4 letters A–Z of the name, uppercased, after removing diacritics; every other character is skipped. If that gives fewer than 2 letters, the key stays empty. Once the user edits the key field, the prefill stops for the rest of the dialog.
- **Alternatives**: Initials of the words; no prefill.
- **Why**: User decision. Shared with mobile.
- **Depends on**: —

### D5 — Validation timing [C-D12]
- **Question**: When do field errors show, and when is the primary button disabled?
- **Decision**: Errors show on the first submit and then update live while typing. The primary button is disabled only while an error is shown or a save is running.
- **Alternatives**: Live after blur, button disabled while invalid; on submit only, never disabled.
- **Why**: User decision. Matches the import clash dialog and Figma's disabled "Create board" next to the key error.
- **Depends on**: —

### D6 — Name error copy [C-D13]
- **Question**: Which messages do name field errors use? Figma has none.
- **Decision**: `REQUIRED` "Enter a name.", `TOO_LONG` "Use at most {n} characters.", `INVALID_CHARACTER` "Use a single line without control characters." Shared by board, column and label names. The client checks the name with the `text-length` rules (normalize, then count code points) before sending.
- **Alternatives**: Feature-specific copy.
- **Why**: User decision.
- **Depends on**: —

### D7 — Key errors and shared key check
- **Question**: Where do the key error strings and the local key check live, now that `boards` and `transfer` both need them?
- **Decision**: Move the check to `core/utils` and the strings to the `common` namespace in `core/i18n` (both folders exist, so no new core module). `transfer` switches to them in the same change. Strings and check order as in the breakdown: `REQUIRED` "Enter a key.", `TOO_SHORT` "Use at least 2 letters.", `TOO_LONG` "Use at most 5 letters.", `INVALID_FORMAT` (and any unknown key code) "Use only the letters A–Z.", `ALREADY_USED` "You already have a board with the key {key}." Lowercase letters become uppercase as the user types.
- **Alternatives**: Copy them into `boards`.
- **Why**: Breakdown decision (one set of key rules and messages in the app).
- **Depends on**: —

### D8 — Local key clash check [C-D18]
- **Question**: Is a used key detected before sending?
- **Decision**: Yes. The key is checked against the boards already loaded and shows the `ALREADY_USED` message without a request. A server 409 with `key`/`ALREADY_USED` shows the same message as a fallback.
- **Alternatives**: Server only.
- **Why**: User decision. Instant feedback.
- **Depends on**: D5, D7

### D9 — After Create board [C-D14]
- **Question**: What happens after a board is created?
- **Decision**: The dialog closes and the new board opens. This change calls an `onBoardCreated(board)` callback; navigation is wired once the board view route exists. No success toast.
- **Alternatives**: Stay on the list with or without a toast.
- **Why**: User decision.
- **Depends on**: —

### D10 — Saving state and errors in dialogs [C-D15]
- **Question**: How do the dialogs behave while saving, and how are failures shown? None of this is drawn.
- **Decision**:
  - While saving: the primary button shows its spinner, the fields and Cancel are disabled, and Escape or an outside click don't close the dialog.
  - Network failure or 5xx: the dialog stays open and an error toast shows "Couldn't create the board." / "Couldn't save the board." / "Couldn't delete “{name}”.", each followed by " Check your connection and try again."
  - Server field errors show under their field.
  - Rename 404: the dialog closes, the board disappears from the list and the toast "“{name}” no longer exists." shows.
  - Delete 404: treated as deleted (`api-conventions` — *Retries after a lost response*).
  - No success toasts.
- **Alternatives**: The error inside the dialog instead of a toast.
- **Why**: User decision. Shared with mobile.
- **Depends on**: —

### D11 — Refresh [C-D16]
- **Question**: How does the refresh button behave?
- **Decision**: The list stays visible and the refresh icon spins while loading. If the refresh fails, the old list stays and the toast "Couldn't refresh your boards. Check your connection and try again." shows.
- **Alternatives**: Skeleton and full error state on refresh.
- **Why**: User decision.
- **Depends on**: —

### D12 — Refresh on phones
- **Question**: Every Figma phone frame shows a refresh icon button in the app bar, and the "pull to refresh" note is app-only. Does the web phone keep the button?
- **Decision**: No. Web phones have no refresh control; the app bar has only + and ⋯. The load error state keeps Try again.
- **Alternatives**: Keep the button as drawn in Figma.
- **Why**: User decision, confirmed through the coordinator after the Figma conflict was raised. A deliberate deviation from Figma.
- **Depends on**: D11

### D13 — Relative "Updated" time [C-D10]
- **Question**: How is the last update shown?
- **Decision**: In the device's local time zone, with English month names:
  - under 1 minute (or in the future): "Just now"
  - under 1 hour: "1 minute ago" / "N minutes ago"
  - same calendar day: "1 hour ago" / "N hours ago"
  - previous calendar day: "Yesterday"
  - same year: "Oct 9"
  - other year: "Oct 9, 2025"
  The text doesn't update on its own. It changes on the next render or refresh. Tiles show "Updated {time}", phone rows show "{time}" only, as in Figma.
- **Alternatives**: —
- **Why**: User decision. Likely reused by board view and card detail.
- **Depends on**: —

### D14 — Rename with an unchanged name [C-D19]
- **Question**: What does Save do when the name didn't change?
- **Decision**: It closes the dialog without a request. "Unchanged" compares the normalized name.
- **Alternatives**: Disable Save; always send.
- **Why**: User decision.
- **Depends on**: D6

### D15 — Sidebar board section and phone menu [C-D3, C-D34]
- **Question**: Who owns the sidebar's board section and the phone ⋯ menu?
- **Decision**: The foundation renders only the sidebar frame and brand. This change adds "All boards", the sidebar's BOARDS section (name and key per board, same order as the list, "+ New board"), the board list header actions and the phone ⋯ menu ("Signed in as {email}", "Import board", "Labels", "Log out"). Loading: no rows. Empty or error: only "+ New board". Auth provides the email and the logout action through `useSession()`, whose `email` is `string | null` (null while `/users/me` loads after a reload). While it is null, "Signed in as" and the sidebar email are hidden. Logout has no confirmation [C-D28].
- **Alternatives**: A separate app-shell change owns the whole sidebar.
- **Why**: User decision.
- **Depends on**: D16

### D16 — Foundation and data access [C-D4, C-D6]
- **Question**: Does this change add the router and server state?
- **Decision**: No. A separate web foundation change (session web-foundation) adds TanStack Router, TanStack Query, React Hook Form and Zod, the empty shell layout (sidebar frame with the brand, main area, and a top-bar slot where pages put their `AppBar`), a temporary empty `/` index route, and the text normalize-and-count helper in `core/utils`. Query defaults: `staleTime: Infinity`, no refetch on focus, reconnect or mount, `retry: false`. This change builds on it. Data goes through a `BoardsRepository` interface, with test doubles in tests and on the dev preview page. No fake API layer.
- **Alternatives**: Add router and Query here; plain callbacks without Query.
- **Why**: User decision. One owner for shared setup across the web sessions.
- **Depends on**: —

### D17 — Shared board pieces for the board view [C-D5]
- **Question**: Who owns the board summary type and the rename/delete dialogs?
- **Decision**: The board list owns `BoardsRepository`, the board summary type and reusable Rename board and Delete board dialogs. The board view reuses them from its ⋯ menu, adds its own files in the same `boards` folder and rebases onto this change.
- **Alternatives**: Each screen builds its own.
- **Why**: User decision.
- **Depends on**: D16

### D18 — Undrawn sizes [C-D20]
- **Question**: Some frames exist only for one size (Rename and Delete on desktop, New board on phone and desktop, loading/empty/error on phone and desktop).
- **Decision**: Undrawn sizes reuse the nearest drawn variant: phone dialogs follow "New board · Phone 390", tablet follows desktop.
- **Alternatives**: Wait for designs.
- **Why**: User decision.
- **Depends on**: —

### D19 — Retry after a failed create
- **Question**: What happens to the list after a create fails without a response?
- **Decision**: The board list reloads in the background after a failed create, so a board that was created despite the lost response shows up and the local key check sees its key. The request is never repeated automatically.
- **Alternatives**: —
- **Why**: Required by `api-conventions` — *Retries after a lost response*. Not a product choice.
- **Depends on**: D8, D10

### D20 — Grid columns
- **Question**: How many tile columns does the grid have?
- **Decision**: Adaptive by a tile minimum width of about 260 px, which gives 2 columns at 834 px and 4 at 1440 px.
- **Alternatives**: Fixed columns per breakpoint.
- **Why**: User decision, matches the Figma frames.
- **Depends on**: —

### D21 — Accessible names
- **Question**: Which accessible names do the icon-only controls get?
- **Decision**: The style agreed across web sessions ("Back", "Board actions", "Actions for column “{name}”", "Add card to “{name}”", "Add column"). For this change: "Actions for board “{name}”" (tile and row menu), "Menu" (phone ⋯), "New board" (phone +), "Refresh", "Log out".
- **Alternatives**: —
- **Why**: User accepted the style; the names here follow it.
- **Depends on**: —

### D22 — Dialog results for the caller
- **Question**: How does the board view know what the Rename and Delete dialogs did?
- **Decision**: Both dialogs report their outcome to the caller: renamed (with the updated board), deleted, or closed without a change. After a delete from the board view ⋯ menu, the board view goes back to the list without a toast (board view's change).
- **Alternatives**: The caller watches the cache.
- **Why**: Coordinator follow-up, user confirmed.
- **Depends on**: D17

### D23 — Index route
- **Question**: Does this change mount the board list in the app?
- **Decision**: Yes. It replaces the foundation's temporary empty `/` index route with the board list, as the coordinator asked. Until `web-boards-connect` provides the real repository, the app layer provides one whose calls all fail with `other`, so the route shows "Couldn't load your boards". No fake data in the app. The preview page keeps the in-memory repository.
- **Alternatives**: Leave `/` empty until connect.
- **Why**: The coordinator assigned the route to this change. The "no fake API layer" decision rules out serving in-memory data in the app. The failing placeholder is this session's choice; reported to the coordinator.
- **Depends on**: D16

## Facts

- Figma "Board list" page (9:5) has frames for: board list (phone, tablet, desktop); loading, empty and error (desktop and phone); pull to refresh (app only); phone scrolling (at the top, scrolled, end of list); phone menu; tile and row menus; New board (desktop, phone); key already used; Rename board; Delete board (desktop, phone) — source: `get_metadata` on 9:5.
- The phone menu's account line is marked "Proposal" in Figma; the user accepted it [C-D34] — source: `cardigan-shared-specs/docs/design/board-list.html`.
- The backend's OpenAPI snapshot has no board endpoints yet (only labels and users/me) — source: `/Users/philipplackner/IdeaProjects/cardigan/app/src/test/resources/openapi/openapi.json`.
- `core/ui` already has `BoardTile`, `BoardRow`, `Sidebar`, `AppBar`, `PageHeader`, `EmptyState`, `Skeleton`, `Menu`, `Dialog`, `Field`, `Input`, `Button` (with a loading state) and toasts — source: `src/core/ui/index.ts`.
- `transfer` exports `ImportTrigger` and `useImportFlow`, which the app layer mounts into the board list header and phone menu — source: `src/features/transfer/index.ts`, `web-board-transfer` — *Import entry point*.
- The key check and key error strings currently live in `transfer` (`useImportViewModel.ts`, `i18n/en.json` `clash.keyErrors`) — source: code.

## Out of scope

- Board contents and the board view (`web-board-view-ui`).
- Import and export flows themselves (`web-import-export-ui`, already built); this change only provides the places where the app layer mounts them.
- Router, TanStack Query, React Hook Form, Zod, shell layout, the text normalize helper (web foundation change).
- Real API calls, DTO mapping and navigation wiring (`web-boards-connect`).
- Labels page and the auth session itself.

## Deferred

None.
