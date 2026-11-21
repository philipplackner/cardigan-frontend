# Decisions: add-board-view-ui

Confirmed with Philipp Lackner on 2026-11-21, through the coordinator session (cardiganapp-18). The coordinator merged the questions of six sessions (web + mobile × auth, board list, board view), so decision numbers follow the coordinator's numbering. Decisions marked "local" were confirmed as part of this session's "not asking" list.

## Summary

Build the board view screen for chunk 21 (`web-board-view-ui`): columns with card tiles from phone to desktop, quick add, the column menu (move left/right, rename, delete), add column, the board ⋯ menu, refresh, and the loading, error and empty states. Board data comes through a data-access interface passed in from the app layer and lives in the TanStack Query cache. Everything waits for the server except card moves, which belong to the later drag & drop change. The screen is a route on top of the web foundation change and reuses the board list change's rename and delete board dialogs.

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
- **Decision**: Board list owns the board summary type and the reusable rename and delete board dialogs. Board view reuses those dialogs from its ⋯ menu and keeps its own types, data-access interface, translation namespace and components in separate files. This change rebases onto the board list change.
- **Alternatives**: Two feature folders.
- **Why**: User decision (recommended option).
- **Depends on**: —

### D6 — Data access before endpoints exist
- **Question**: How does the UI get and change board data without board, column or card endpoints?
- **Decision**: The board view receives a data-access interface (load board, create, rename, move and delete a column, create a card) from the app layer. It is only the interface the later data layer plugs into, not a repository layer. Tests and the preview use an in-memory implementation whose results follow the shared specs. The connect chunks (35, 39) add the real API.
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

### WBV-19 — Card count of zero
- **Question**: Figma's new-board frames show "0 cards", but D9 drops zero parts. Which wins?
- **Decision**: D9. With no cards, the desktop header shows name and key only, and the phone subtitle shows only the key.
- **Alternatives**: Always show the count, including "0 cards".
- **Why**: User decision (follow-up, 2026-11-21). Matches the board list.
- **Depends on**: D9

### WBV-20 — Header while loading or after a load error
- **Question**: What does the header show before the board has loaded?
- **Decision**: The name and key from the board list data the shell already has, or no title when the board isn't in it. The refresh button shows and reloads like "Try again". The ⋯ menu is hidden until the board has loaded.
- **Alternatives**: Show a working ⋯ menu from the board-list summary.
- **Why**: User decision (follow-up).
- **Depends on**: D5

### WBV-22 — Add column form after adding
- **Question**: Does the add column form close after a successful add?
- **Decision**: It closes, the new column appears at the end and scrolls into view, and focus moves to its "Add card". In the "This board has no columns" state, "Add column" opens the same form in place of the empty state.
- **Alternatives**: Keep the form open for the next column, like quick add.
- **Why**: User decision (follow-up).
- **Depends on**: —

### WBV-23 — Stale column move copy
- **Question**: The D23 "no longer exists" text is wrong for a stale move of a column that still exists. Which text?
- **Decision**: A missing column keeps D23's "“{name}” no longer exists. The board was reloaded." A stale column move (`OUT_OF_RANGE`) shows "Couldn't move “{name}”. The board changed on another device, so it was reloaded."
- **Alternatives**: D23's text for both.
- **Why**: User decision (follow-up). Shared copy with mobile.
- **Depends on**: D23

### F1 — Inline forms while saving and during refresh
- **Question**: How do quick add and add column behave while saving, on failure and during a refresh?
- **Decision**: While saving, the Add button shows a spinner, the field and Cancel are disabled and Enter is ignored. On failure the text stays and an error toast shows. A refresh runs while an inline form is open and keeps its text. A form whose column disappeared in the refresh closes.
- **Alternatives**: —
- **Why**: User decision (follow-up), aligned with mobile.
- **Depends on**: D15, D16, D22

### F2 — Quick add validation of pasted text
- **Question**: What happens when pasted text makes a title invalid?
- **Decision**: The D13 messages show under the field ("Use at most 200 characters.", "Use a single line without control characters."), first on submit, then live (D12).
- **Alternatives**: —
- **Why**: User decision (follow-up, raised by mobile).
- **Depends on**: D12, D13, D22

### F3 — Deleting the board from the board view
- **Question**: What happens after "Delete board" from the board ⋯ menu?
- **Decision**: The board list opens. No toast.
- **Alternatives**: —
- **Why**: User decision (follow-up). Matches D15 (no success toast).
- **Depends on**: D5, D15

### F4 — Accessible names
- **Question**: Which accessible names do icon-only and composite controls get?
- **Decision**: "Back", "Board actions", "Actions for column “{name}”", "Add card to “{name}”", "Add column". A card tile reads "{displayId}, {title}, labels {a}, {b}" (without the labels part when it has none). Other controls follow the same style.
- **Alternatives**: —
- **Why**: User decision (follow-up).
- **Depends on**: —

### F5 — Refresh on web phones
- **Question**: Figma's phone frames show a refresh button. Does the web phone layout get one?
- **Decision**: No. Web phones have no refresh control; the browser reload covers it. Desktop and tablet keep the button.
- **Alternatives**: Follow Figma's phone button.
- **Why**: User decision (follow-up), confirms D16 over Figma.
- **Depends on**: D16

### WBV-24 — Switching inline forms with started text
- **Question**: What happens when the user opens another inline form while the open one has text?
- **Decision**: Quick add and add column form one slot. Switching from a form with text (quick add → quick add, quick add → add column, add column → quick add) asks first:
  - Title: "Discard changes?"
  - Body: "The card you started in “{column}” hasn’t been added." or "The column you started hasn’t been added."
  - Buttons: "Keep editing" (secondary) and "Discard" (danger).

  The dialog behaves as follows:
  - "Discard" drops the text, closes the form and opens the new one with focus.
  - "Keep editing", Escape and a backdrop click close the dialog. The new form doesn't open, and the first one keeps its text, scrolls into view and gets focus.
  - Empty forms close silently.
  - Cancel and Escape in a field still discard without asking (D22).
  - While an inline form saves, "Add card" in other columns and "Add column" are disabled.
- **Alternatives**: Drop the text silently (rejected by the user); body naming the typed title; card detail's text unchanged.
- **Why**: User decision (follow-up, 2026-11-21). Reuses the card detail's "Unsaved changes" pattern from Figma `9:7`. The extension to add column came from mobile and was accepted. Same for mobile.
- **Depends on**: D22, WBV-22

### F6 — No in-memory data in the app
- **Question**: Does the running app show in-memory sample data until the connect chunk?
- **Decision**: No. In-memory data access exists only in tests and on the preview page. The app layer provides `BoardViewDataAccessProvider` (and `BoardsDataAccessProvider`) when chunk 35 brings the real data layer. Until then this change mounts nothing in the app, the same as the board list: no route renders board view components without a provider. Chunk 35 adds the board route together with the providers. This replaces the "add your route" part of D4 for this change.
- **Alternatives**: Wire the in-memory data access into the app until chunk 35.
- **Why**: User decision, recorded as D23 in `add-board-list-ui` and relayed by web-boardlist.
- **Depends on**: D6

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
- The web foundation shell puts a page's app bar into a shell top-bar slot — source: coordinator, from the web foundation session.
- The foundation's router not-found and pending components are blank for now. An unknown board ID on first load shows that blank not-found until a design exists — source: coordinator, from the web foundation session.
- The board list exports `sampleBoards` (`features/boards/testing/sampleBoards.ts`): the 14 Figma boards with fixed IDs, keys, card counts and times. `createInMemoryBoardsDataAccess` uses it by default — source: web-boardlist, commit 34dcef6.
- `RenameBoardDialog` shows "“{name}” no longer exists." itself before it reports `deleted` for a rename 404 — source: web-boardlist, `add-board-list-ui` › *Rename result*.
- The board list query key is `['boards']`, exported with `boardsQueryOptions` — source: web-boardlist.
- The foundation's Query client uses `staleTime: Infinity`, no automatic refetch and `retry: false` — source: coordinator, from the web foundation session.
- Figma Card detail (`9:7`) has an "Unsaved changes" dialog: "Discard changes?", "Your changes to CRD-109 haven’t been saved.", "Keep editing", "Discard" — source: Plugin API read of page `9:7`.

## Out of scope

- Card drag & drop, keyboard moves and their announcements, the Move failed toast, dnd-kit (card drag & drop change).
- Search, label filter, their URL state and header controls (search & filter change).
- Card detail (cards feature).
- The sidebar board list, the phone menu, the rename and delete board dialogs themselves (board list change).
- The router, Query client, shell layout and text helper (web foundation change).
- Real API functions, MSW handlers and E2E tests (chunks 35 and 39).
