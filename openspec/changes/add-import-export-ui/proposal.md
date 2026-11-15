# Proposal

## Why

Users need to export a board as JSON and import such a file as a new board (chunk 23, `web-import-export-ui`). The `transfer` feature folder is still empty. The backend endpoints and the OpenAPI snapshot don't exist yet. This change builds the full UI and file handling now, against injected actions, so chunk 40 only has to plug in the real API.

## What Changes

- **Export** (D1, D12–D14):
  - An export action that the board view's "Export as JSON" menu item will call. It shows the blocking "Exporting “{name}”" dialog.
  - Then the browser downloads the file under the `Content-Disposition` name, with a client-built fallback name. A success toast follows: "“{name}” exported."
  - Failures show an error toast.
- **Import** (D2–D11, D15, D16, D22):
  - An import trigger: the "Import" button on tablet/desktop and the "Import board" menu item on phones. It opens the import dialog with the drop zone.
  - Picking or dropping a file runs client pre-checks: size, then JSON + `format` + `formatVersion`. If they pass, the upload starts right away behind the blocking "Importing {file name}" dialog.
  - Errors show in the dialog's error box with the file row.
  - A key clash opens "Choose a different key" with the clashing key prefilled.
  - Success closes everything and shows "Imported “{name}” with the key {key}."
- **Copy without a design** (D7, D9, D13). These strings are shared with the mobile app. Please review them:
  - Exporting dialog body (web): "When the file is ready, the browser downloads it."
  - Export failed toast: "Couldn't export “{boardName}”. Check your connection and try again."
  - Export 404 toast: "“{boardName}” no longer exists, so it can't be exported."
  - Import failed box: "Couldn't import the board. Check your connection and try again."
  - Key clash without a known board name: "One of your boards already uses the key {key}. Enter another key for the imported board."
- **File size text** (D6): base 1024, whole KB below 1 MB, MB with one decimal, rounded up when over the limit.
- **Injected actions** (D17, D18): the pieces take their export, import and board lookup functions as parameters from the app layer. Tests use fakes. They aren't mounted in a real screen yet; the dev preview page shows them.
- **Design system fix** (D23): `DropZone` shows the Figma "Over" content ("Release to import", download icon, no hint line).
- **Tooling** (D19): i18n setup with react-i18next and typed keys, and the screen test stack (jsdom, React Testing Library, user-event, jest-dom).

Not breaking. Nothing changes for users until the app layer mounts the pieces.

## Capabilities

### New Capabilities

- `web-board-transfer`: web-only behavior of board export and import: progress and result feedback, browser download and file name, drop zone and file picker, client pre-checks and size text, error placement and copy, key clash dialog.

### Modified Capabilities

- `web-design-system`: the drop zone's Over state shows the Figma "Release to import" content.

### Shared-spec requirements

This change implements or depends on these `cardigan-shared-specs` requirements:

- `board-export-format` — *Export file identifies its format and version*: the client pre-check reads `format` and `formatVersion`.
- `board-export-format` — *Export download*: the download file name and its fallback.
- `board-export-format` — *Import upload*: one blocking request with the file and an optional key.
- `board-export-format` — *Import size limits*: the 5,242,880-byte client check and the 413 mapping.
- `board-export-format` — *Unreadable or unsupported files*, *Import validates every rule of the domain*: 422 maps to the invalid-file message.
- `board-export-format` — *Imported board key and clashes*: the key clash dialog and retry with a `key`.
- `domain-board` — *Board key format*: the key field rules in the clash dialog.
- `api-errors` — *Error text is for developers only*, *Clients handle unknown error codes by status*, *Uniqueness clashes are conflicts*: messages come from codes and statuses, never from `detail`.

## Impact

- **Code**:
  - `src/features/transfer/` (components, hooks, utils, types, translations).
  - `src/core/ui/DropZone.tsx`, `src/core/i18n/` (setup), `src/preview/sections/ImportExportSection.tsx`.
  - Test setup file, `vitest.config.ts`, `tsconfig.test.json`.
- **New dependencies**: `i18next`, `react-i18next`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`.
- **Other changes**: the wave-3 web UI changes (board list, board view, card detail, labels, auth) also need i18n and the test stack. Whichever lands second must rebase onto this setup (see design.md).
- **Not touched**: the backend, shared specs, routing, data fetching, real API calls (chunk 40).
