# Proposal

## Why

Users need to open a board and work with its columns and cards (chunk 21, `web-board-view-ui`). The `boards` feature has no board view yet, and the backend has no board, column or card endpoints. This change builds the board screen against a data-access interface, so chunks 35 and 39 only plug in the real API. Drag & drop and search & filter follow as their own changes (D1).

## What Changes

- **Board screen** (D3, D20, D24): the content area of the shell for one board. It is shown on the preview page in this change; chunk 35 adds its route with the real data (F6).
  - Desktop and tablet: a header with name, key, card count, refresh and ⋯ menu.
  - Phone: app bar content with back, name and "key · count".
  - Columns are side by side and scroll horizontally. Phone columns are 300 px wide with free scrolling.
  - Card tiles show display ID, title and labels sorted by name. A click calls an injected "open card" callback (L1).
- **States**: loading skeleton, "Couldn’t load this board" with "Try again", empty columns with "No cards yet", and "This board has no columns" with "Add column". A board deleted while it's open goes to the board list with "This board no longer exists." (D23). An unknown board ID on first load shows the app's not-found page.
- **Quick add** (D22): title only. Enter adds and keeps the field open. Escape or Cancel closes. Outside clicks keep non-empty text. One inline form (quick add or add column) at a time. Switching away from one with text asks with a discard dialog (WBV-24).
- **Columns**:
  - Add column: an inline form at the end of the columns.
  - Column ⋯ menu: Move left, Move right (disabled at the ends), Rename (dialog), Delete column.
  - Delete always asks first. With cards, the dialog names the count. Without cards: "Delete column “{name}”?" / "This can’t be undone." / "Delete column" (D23).
- **Board ⋯ menu**: Rename board and Delete board reuse the board list change's dialogs (D5). "Export as JSON" calls the injected export action (L2).
- **Refresh** (D16): the button spins, and the board and quick add text stay. On failure the board stays and a toast shows. No refresh control on phones.
- **Saving and errors** (D12, D13, D15, D21, D23):
  - Every change waits for the server and applies the response to the cached board.
  - Name and title errors use the shared generic copy.
  - Network or 5xx failures keep the form open and show an error toast.
  - A missing column or a stale move reloads the board and shows a toast.
- **Copy without a design**. These strings are shared with mobile. Please review them:
  - "Couldn't add the card. Check your connection and try again."
  - "Couldn't add the column. Check your connection and try again."
  - "Couldn't rename “{name}”. Check your connection and try again."
  - "Couldn't move “{name}”. Check your connection and try again."
  - "Couldn't delete “{name}”. Check your connection and try again."
  - "Couldn't refresh the board. Check your connection and try again."
  - "“{name}” no longer exists. The board was reloaded."
  - "Couldn't move “{name}”. The board changed on another device, so it was reloaded." (WBV-23)
  - "This board no longer exists."
  - Discard dialog (WBV-24): "Discard changes?", "The card you started in “{column}” hasn’t been added." or "The column you started hasn’t been added.", "Keep editing", "Discard".
  - Empty column delete: "Delete column “{name}”?", "This can’t be undone.", "Delete column".
- **Board data access** (D6): an interface (load board, create/rename/move/delete column, create card) that the data layer from chunk 35 plugs into. It is not a repository layer. Tests and the preview use an in-memory implementation. The app gets the real one in chunk 35, together with the board route.

Not breaking. This change builds on the web foundation change (router, Query, shell, text helper) and the board list change (board summary type, rename/delete board dialogs). Both must land first.

## Capabilities

### New Capabilities

- `web-board-view`: web-only behavior of the board screen: layout per size, header and states, quick add, add column, column menu, column and board dialogs, refresh, waiting saves, error placement and copy, and stale-data recovery.

### Modified Capabilities

None. The `core/ui` components already cover the screen's parts.

### Shared-spec requirements

This change implements or depends on these `cardigan-shared-specs` requirements:

- `domain-board` › *Board name*: the name in the header.
- `domain-board` › *Board key format*: the key in the header and display IDs.
- `domain-column` › *Column name*: 1–30 characters for add and rename. Duplicates are allowed.
- `domain-column` › *A column belongs to exactly one board*: a board can have zero columns (empty state).
- `domain-column` › *Deleting a column removes its cards*: the delete dialog names the card count.
- `domain-card` › *Card title*: 1–200 characters in quick add.
- `domain-card` › *Card display ID*: the ID on each tile.
- `domain-card` › *Card labels are a set sorted by name*: label order on tiles.
- `domain-ordering` › *Columns have dense positions in their board*, *Cards have dense positions in their column*, *Order is defined only by positions*: render order and move targets.
- `text-length` › *Text is normalized before validation*, *Length is counted in Unicode code points*, *Invalid characters are rejected*: client checks for names and titles.
- `api-conventions` › *Move target is the final position*, *Move responses contain all affected items*, *Clients recover from a stale move*: column moves.
- `api-conventions` › *Deleting a missing resource is not found*: a 404 on delete counts as deleted.
- `api-errors` › *Error text is for developers only*, *Clients handle unknown error codes by status*, *Field errors identify the field and rule*, *Limit errors carry the limit*: messages come from codes, never from `detail`.

## Impact

- **Code**:
  - `src/features/boards/` (board view components, hooks, utils, types, `boardView` translations; separate files from the board list).
  - `src/app/i18n.ts` (namespace registration). No route is added (F6).
  - `src/preview/` (board view playground with the in-memory data access).
- **Depends on**: the web foundation change (TanStack Router, TanStack Query, shell, `core/utils` text helper) and the board list change (board summary type, rename/delete board dialogs, sidebar).
- **New dependencies**: none beyond those the foundation change adds.
- **Not touched**: the backend, shared specs, `core/ui`, the `transfer` feature, card detail, real API calls.
