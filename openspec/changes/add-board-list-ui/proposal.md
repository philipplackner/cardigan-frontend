# Proposal

## Why

The board list is the home screen after login (chunk 20, `web-board-list-ui`), and `src/features/boards/` is still empty. The backend has no board endpoints yet. This change builds the full board list UI against a repository interface now, so `web-boards-connect` only has to plug in the real API, and the board view can reuse the board dialogs.

## What Changes

- **Board list screen** (D3, D13, D18):
  - Tablet and desktop: a grid of board tiles (columns adapt to a ~260 px tile minimum, D20) under a "Boards {n boards}" header with Refresh, Import and New board.
  - Phone: a list of board rows under a large "Boards" title that moves into the pinned app bar on scroll. The app bar has + and ⋯; there is no refresh control on web phones (D12, a deliberate deviation from Figma). The list ends with the board count.
  - Tiles and rows show name, key, card count and the relative last-update time. Boards are listed in server order (most recently updated first).
- **States** (D11): loading skeleton tiles, "No boards yet" empty state with New board and Import, "Couldn't load your boards" with Try again. Refresh keeps the list and spins the icon; a failed refresh keeps the list and shows a toast.
- **New board dialog** (D4–D8, D9, D10, D19): Name and Key. The key is prefilled from the name until the user edits it. Name and key are checked on the client, including a local key clash check. After success the dialog closes and the new board opens through a callback.
- **Rename board dialog** (D6, D10, D14): Name plus the read-only key. An unchanged name closes without a request.
- **Delete board dialog** (D1, D2, D10): "Delete board “{name}”?" with the card count.
- **Reuse by the board view** (D17, D22): Rename and Delete report renamed, deleted or unchanged to the screen that opened them.
- **Tile and row menu**: Rename, Delete board. Icon-only controls get accessible names in the agreed style (D21).
- **Sidebar and phone menu** (D15): "All boards", the sidebar's BOARDS list and "+ New board"; the phone ⋯ menu with "Signed in as {email}", Import board, Labels and Log out. Email and logout come from auth's `useSession()`; the email is hidden while it's unknown.
- **Route** (D23): the board list replaces the foundation's temporary empty `/` route. Until the connect chunk provides the real repository, the app's placeholder repository fails every call, so `/` shows the load error state.
- **Copy without a design** (D6, D10, D11, D13). Shared with the mobile app:
  - Name errors: "Enter a name.", "Use at most {n} characters.", "Use a single line without control characters."
  - Toasts: "Couldn't create the board.", "Couldn't save the board.", "Couldn't delete “{name}”." (each + " Check your connection and try again."), "“{name}” no longer exists.", "Couldn't refresh your boards. Check your connection and try again."
  - Relative time: "Just now", "N minutes ago", "N hours ago", "Yesterday", "Oct 9", "Oct 9, 2025".
- **Shared key check** (D7): the board key check and its error strings move from `transfer` to `core/utils` and the `common` translations; `transfer` uses them.
- **Data access** (D16, D17): a `BoardsRepository` interface and board summary type, with test doubles for tests and the dev preview page.

Not breaking. The import key clash dialog keeps the same behavior and copy after the key check moves.

## Capabilities

### New Capabilities

- `web-board-list`: web-only behavior of the board list: layout per size, phone scrolling, states, refresh, the New board, Rename board and Delete board dialogs, menus, the sidebar board section, the phone menu, and the copy for undrawn states.

### Modified Capabilities

None. `web-board-transfer` keeps its requirements; only the code behind its key field moves.

### Shared-spec requirements

This change implements or depends on these `cardigan-shared-specs` requirements:

- `domain-board` — *Board name*: 1–100 characters, single line, not unique.
- `domain-board` — *Board key format*, *Board key is unique among a user's existing boards*, *Board key never changes*: the key field, local checks and the read-only key in Rename.
- `domain-board` — *Board timestamps*: the "Updated" time.
- `domain-board` — *Deleting a board removes its content*: the delete dialog text.
- `text-length` — *Text is normalized before validation*, *Length is counted in Unicode code points*, *Invalid characters are rejected*, *Clients validate with the same rule*, *Backend stores and returns normalized text*: client-side name checks and showing the returned name.
- `api-errors` — *Error text is for developers only*, *Field error codes*, *One field error per field*, *Uniqueness clashes are conflicts*, *Clients handle unknown error codes by status*, *Other users' data is not found, never forbidden*: error mapping in the dialogs.
- `api-conventions` — *Board list order*: the order the list and sidebar show.
- `api-conventions` — *Deleting a missing resource is not found*, *Retries after a lost response*: delete 404 is treated as deleted; no automatic retry of create; reload after a failed create.

## Impact

- **Code**:
  - `src/features/boards/` (api interface, components, hooks, utils, types, translations).
  - `src/core/utils/` (board key check, key prefill), `src/core/i18n/` (common key error and name error strings).
  - `src/features/transfer/` (switch to the shared key check and strings).
  - `src/preview/` (board list section with an in-memory repository).
  - `src/app/` (the `/` route, the placeholder repository, the sidebar and top-bar slot content).
- **Depends on**: the web foundation change (TanStack Router, TanStack Query, React Hook Form, Zod, shell layout, text normalize helper). It must land first.
- **Other changes**: the web board view change adds files in `src/features/boards/` and reuses the Rename and Delete dialogs and `BoardsRepository`; it rebases onto this change. The web auth change provides `useSession()` with the email and logout action.
- **No new dependencies** beyond what the foundation change adds.
- **Not touched**: the backend, shared specs, real API calls and navigation wiring (`web-boards-connect`).
