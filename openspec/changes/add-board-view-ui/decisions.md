# Decisions: add-board-view-ui

Confirmed with Philipp Lackner on 2026-11-21, through the coordinator session (cardiganapp-18). The coordinator merged the questions of six sessions (web + mobile × auth, board list, board view), so decision numbers follow the coordinator's numbering. Decisions marked "local" were confirmed as part of this session's "not asking" list.

## Summary

Build the board view screen for chunk 21 (`web-board-view-ui`): columns with card tiles from phone to desktop, quick add, the column menu (move left/right, rename, delete), add column, the board ⋯ menu, refresh, and the loading, error and empty states. Board data comes through an injected set of board actions and lives in the TanStack Query cache. Everything waits for the server except card moves, which belong to the later drag & drop change. The screen is a route on top of the web foundation change and reuses the board list change's rename and delete board dialogs.

## Decisions

### D1 — Scope and order
- **Question**: One change for chunks 21, 30 and 31, or split?
- **Decision**: Three changes in this order: board view (this change), card drag & drop, search & filter. This change covers the board, quick add, the column menu, add column and the board ⋯ menu.
- **Alternatives**: One change for all three (recommended by this session, not chosen).
- **Why**: User decision. Smaller reviews, same split as mobile.
- **Depends on**: —

### D3 — Shell regions
- **Question**: Which parts of the board screen belong to the board view?
- **Decision**: Board list owns the sidebar board section and the phone menu. The board view renders only its content area: header (or phone app bar content), columns and its dialogs. Highlighting the active board in the sidebar is the board list's or the foundation's concern. The board view exposes what that needs (the board ID in the route).
- **Alternatives**: Board view renders the whole shell.
- **Why**: User decision.
- **Depends on**: D4

### D4 — Router, Query and shell
- **Question**: Which change adds TanStack Router, TanStack Query and the shell?
- **Decision**: A separate web foundation change (session web-foundation) adds TanStack Router, TanStack Query, the empty shell layout and a text normalize-and-count helper in `core/utils`. This change adds only its route and screen on top of it.
- **Alternatives**: The board list change adds them; this change adds them; preview only.
- **Why**: User decision (recommended option).
- **Depends on**: —

### D5 — Sharing `features/boards` with board list
- **Question**: How do board list and board view share the `boards` feature folder?
- **Decision**: Board list owns the board summary type and the reusable rename and delete board dialogs. Board view reuses those dialogs from its ⋯ menu and keeps its own types, board actions, translation namespace and components in separate files. This change rebases onto the board list change.
- **Alternatives**: Two feature folders.
- **Why**: User decision (recommended option).
- **Depends on**: —

### D6 — Data access before endpoints exist
- **Question**: How does the UI get and change board data without board, column or card endpoints?
- **Decision**: The board view receives its board actions (load board, create, rename, move and delete a column, create a card) injected from the app layer. Tests and the preview use an in-memory fake whose results follow the shared specs. The connect chunks (35, 39) add the real API.
- **Alternatives**: API functions and MSW against guessed paths; wait for the backend.
- **Why**: User decision (recommended option). Same approach as `add-import-export-ui` D17.
- **Depends on**: —

### D9 — Plurals
- **Question**: How are counts written?
- **Decision**: Counts use real plurals ("1 card", "12 cards"). Parts with a zero count are dropped.
- **Alternatives**: —
- **Why**: User decision, shared across features.
- **Depends on**: —

### D12 — When validation errors show
- **Question**: When do field errors appear, and when is the submit button disabled?
- **Decision**: Errors show on the first submit, then update live while typing. The submit button is disabled only while an error shows or a save runs.
- **Alternatives**: Live from the first keystroke; button disabled while invalid.
- **Why**: User decision, shared across features.
- **Depends on**: —

### D13 — Name error copy
- **Question**: Which messages show for name and title fields?
- **Decision**: Generic messages, not field-specific: "Enter a name." (empty), "Use at most {n} characters." (too long), "Use a single line without control characters." (control characters or line breaks).
- **Alternatives**: Field-specific messages such as "Enter a column name." (proposed by this session, not chosen).
- **Why**: User decision, shared across features and with mobile.
- **Depends on**: D12

### D15 — Saving and failures in dialogs and forms
- **Question**: What happens while a dialog or form saves, and when it fails?
- **Decision**: While saving, the submit button shows a spinner, fields and Cancel are disabled, and Escape or an outside click doesn't close it. On a network error or 5xx, the dialog or form stays open with the input and an error toast shows. Server field errors show under the field. There is no success toast. A 404 on delete counts as deleted. Error toast copy:
  - Add card: "Couldn't add the card. Check your connection and try again."
  - Add column: "Couldn't add the column. Check your connection and try again."
  - Rename column: "Couldn't rename “{name}”. Check your connection and try again."
  - Move column: "Couldn't move “{name}”. Check your connection and try again."
  - Delete column: "Couldn't delete “{name}”. Check your connection and try again."
- **Alternatives**: Error boxes inside dialogs.
- **Why**: User decision (recommended option), copy shared with mobile.
- **Depends on**: D21

### D16 — Refresh
- **Question**: How does refresh behave, and is there one on phones?
- **Decision**: The refresh button spins while the board reloads. The board stays visible, and quick add text stays. On failure the board stays and the toast "Couldn't refresh the board. Check your connection and try again." shows. The web phone layout has no refresh control; the browser reload covers it.
- **Alternatives**: Refresh in the phone ⋯ menu; pull to refresh on web.
- **Why**: User decision (recommended option).
- **Depends on**: —

### D19 — Unchanged rename
- **Question**: What happens when the rename dialog is saved without a change?
- **Decision**: It closes without a request.
- **Alternatives**: —
- **Why**: User decision, shared across features.
- **Depends on**: —

### D20 — Sizes without their own frames
- **Question**: What do tablet and phone show where Figma has no frame?
- **Decision**: Tablet reuses the desktop variants of every state. On phones, add column and rename column reuse the desktop pattern.
- **Alternatives**: Ask for more frames.
- **Why**: User decision.
- **Depends on**: —

### D21 — Optimistic updates
- **Question**: Which changes show before the server answers?
- **Decision**: Only card moves are optimistic (later drag & drop change). Column moves, creates, renames and deletes, and card creation, wait for the server. Responses are applied to the cached board locally, without a full refetch.
- **Alternatives**: Everything optimistic; nothing optimistic with a refetch after each change.
- **Why**: User decision (recommended option).
- **Depends on**: —

### D22 — Quick add
- **Question**: How does quick add behave?
- **Decision**: Enter or "Add card" creates the card, and the field stays open, empty and focused. Enter on an empty or whitespace-only title does nothing. Escape or Cancel closes the field and drops the text. Clicking outside closes the field if it's empty and keeps it open if it has text. Only one quick add is open at a time. The title is limited to 200 characters as counted by `text-length`.
- **Alternatives**: Close after adding.
- **Why**: User decision (recommended option). Confirms the Figma "(proposal)" annotation.
- **Depends on**: D12, D13

### D23 — Deletion confirmation and stale data
- **Question**: How are empty columns deleted, and what happens with stale data?
- **Decision**:
  - Deleting an empty column also confirms: "Delete column “{name}”?", "This can’t be undone.", "Delete column".
  - A stale move (`OUT_OF_RANGE`) or a missing column reloads the board and shows "“{name}” no longer exists. The board was reloaded."
  - A 404 for the board itself goes to the board list with the toast "This board no longer exists."
- **Alternatives**: Delete empty columns without asking; show the load error state for a missing board.
- **Why**: User decision.
- **Depends on**: —

### D24 — Phone scrolling
- **Question**: Do phone columns snap?
- **Decision**: Free horizontal scroll, no snapping.
- **Alternatives**: Snap to each column.
- **Why**: User decision.
- **Depends on**: —

### L1 — Opening a card (local)
- **Question**: What does a click on a card tile do in this change?
- **Decision**: Card tiles are buttons that call an injected "open card" callback with the card ID. Card detail is a separate change.
- **Alternatives**: —
- **Why**: Confirmed through the coordinator.
- **Depends on**: D6

### L2 — Export from the board menu (local)
- **Question**: How is "Export as JSON" wired?
- **Decision**: The app layer passes the `transfer` feature's export action in. The board view only renders the menu item and calls it.
- **Alternatives**: —
- **Why**: Confirmed through the coordinator. `transfer` already provides `useExportBoard` (`add-import-export-ui` D18).
- **Depends on**: —

### L3 — Not in this change (local)
- **Question**: Which parts of the Figma page stay out?
- **Decision**: Drag & drop (incl. keyboard drag, announcements, the Move failed toast and the new dependency dnd-kit) goes to the card drag & drop change. Search, the label filter and their URL state go to the search & filter change. Their header controls are not rendered in this change.
- **Alternatives**: —
- **Why**: Follows from D1.
- **Depends on**: D1

## Facts

- Figma page `9:6` has frames for: board (phone, tablet, desktop), loading, couldn't load, new board with default columns, all columns deleted, column menu, add column, rename column, delete column with cards, quick add, dragging, move failed, search + label filter, label filter popover and sheet, no results, board menu — source: `get_metadata 9:6`.
- Figma annotations: "Columns are 300px wide; swipe sideways. Search and label filter open from the top bar." (phone board); "Move left is disabled on the first column, Move right on the last." (column menu); "Title only. Enter adds the card and keeps the field open for the next one (proposal)." (quick add) — source: Plugin API read of page `9:6`.
- Tablet has a frame only for the default board — source: `get_metadata 9:6`.
- The board menu has "Rename board", "Export as JSON" and "Delete board" — source: Figma frame "Board menu · Desktop 1440".
- The backend OpenAPI snapshot has only `/api/v1/labels` and `/api/v1/users/me`. No board, column or card endpoints — source: `/Users/philipplackner/IdeaProjects/cardigan/app/src/test/resources/openapi/openapi.json`.
- Column names are 1 to 30 characters and need not be unique — source: `domain-column` › *Column name*.
- Card titles are 1 to 200 characters — source: `domain-card` › *Card title*.
- Display ID is the board key, a hyphen and the card number — source: `domain-card` › *Card display ID*.
- Card labels show sorted by case-folded name — source: `domain-card` › *Card labels are a set sorted by name*.
- Deleting a column deletes its cards — source: `domain-column` › *Deleting a column removes its cards*.
- Columns and cards are shown in ascending position order — source: `domain-ordering` › *Order is defined only by positions*.
- A column move gives the final position, and its response contains all columns — source: `api-conventions` › *Move target is the final position*, *Move responses contain all affected items*.
- A client that gets `OUT_OF_RANGE` on a move reloads the board and tells the user — source: `api-conventions` › *Clients recover from a stale move*.
- Text is normalized (CRLF to LF, NFC, trim) and counted in code points; single-line fields reject control characters — source: `text-length`.
- `core/ui` already has `Column`, `Card`, `AddCardButton`, `AddColumnButton`, `AppBar`, `Menu`, `Dialog`, `Field`, `Input`, `TextArea`, `EmptyState`, `Skeleton`, `IconButton`, `Button`, `Toast` and `AppLayout` — source: `src/core/ui/index.ts`.
- The app has no router, no TanStack Query and no `core/utils` yet; `App.tsx` returns `null` — source: `src/app/App.tsx`, `package.json`.

## Out of scope

- Card drag & drop, keyboard moves and their announcements, the Move failed toast, dnd-kit (card drag & drop change).
- Search, label filter, their URL state and header controls (search & filter change).
- Card detail (cards feature).
- The sidebar board list, the phone menu, the rename and delete board dialogs themselves (board list change).
- The router, Query client, shell layout and text helper (web foundation change).
- Real API functions, MSW handlers and E2E tests (chunks 35 and 39).

## Deferred

- WBV-19: whether the header shows "0 cards" (Figma new-board frames) or drops it (D9) — settle before: implementation. This change assumes D9 (dropped).
- WBV-20: header content and ⋯ menu while loading or after a load error — settle before: implementation. This change assumes the name and key from the board list data, refresh shown, ⋯ menu hidden until loaded.
- WBV-22: whether the add column form closes after adding — settle before: implementation. This change assumes it closes, scrolls the new column into view and moves focus to its "Add card".
- WBV-23: copy for a stale column move — settle before: implementation. This change assumes "Couldn't move “{name}”. The board changed on another device, so it was reloaded."
