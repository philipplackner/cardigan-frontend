# Decisions: add-import-export-ui

Confirmed with Philipp Lackner on 2026-11-15, through the orchestrator session (cardiganapp-be). Shared copy aligned with the mobile session (mobile-import-export-ui) on the same day.

## Summary

Build the `transfer` feature's UI for chunk 23 (`web-import-export-ui`): an Export action with a blocking progress dialog and toasts, and an Import flow (dialog with drop zone, client pre-checks, blocking progress, error box, key clash dialog, success toast). The real calls are injected from the app layer and faked in tests; the connect chunk adds the API. The pieces aren't mounted in a real screen yet. They're shown on the dev preview page and wired into the boards screens by the app layer later. This change also adds react-i18next and the screen test stack.

## Decisions

### D1 — Export entry point
- **Question**: Where does Export live?
- **Decision**: Only in the board view's ⋯ menu ("Export as JSON"), as in Figma. Not in the board tile or row menu.
- **Alternatives**: Also in the board list tile/row menu.
- **Why**: Matches Figma. The breakdown chunk is updated by the orchestrator.
- **Depends on**: —

### D2 — After a successful import
- **Question**: What happens after a successful import?
- **Decision**: The user stays on the board list. All dialogs close and a success toast shows "Imported “{name}” with the key {key}.", also when the key didn't change. No navigation to the new board.
- **Alternatives**: Navigate to the new board; navigate and show the toast.
- **Why**: Matches Figma "Imported" frames. The breakdown is updated by the orchestrator.
- **Depends on**: —

### D3 — Import start
- **Question**: When does the upload start?
- **Decision**: As soon as a file is picked or dropped and has passed the client pre-checks. There is no confirm button.
- **Alternatives**: File row plus an Import button first.
- **Why**: Matches Figma.
- **Depends on**: —

### D4 — Client pre-checks
- **Question**: Which checks run before uploading?
- **Decision**: The client checks the size (over 5,242,880 bytes fails). Then it parses the file as JSON and checks `format` = `cardigan.board` and `formatVersion` = `1`. Failures show the Figma messages without uploading. A server 413 maps to the size message, a server 422 to the invalid-file message.
- **Alternatives**: Size only on the client; server only.
- **Why**: Instant feedback, no wasted upload.
- **Depends on**: D3

### D5 — Invalid file copy
- **Question**: Which message for files that fail for other reasons (domain rules, newer version)?
- **Decision**: Every invalid file shows the Figma copy "This file isn't a Cardigan board export. Choose a .json file that was exported from Cardigan."
- **Alternatives**: Separate messages for invalid content and newer versions.
- **Why**: No new copy or design. The server doesn't say what failed.
- **Depends on**: D4

### D6 — File size format
- **Question**: How are file sizes shown?
- **Decision**: Base 1024. Below 1 MB: whole KB. From 1 MB: MB with one decimal. When the file is over the 5 MB limit, the value is rounded up, so 5,242,881 bytes shows "5.1 MB", never "5.0 MB".
- **Alternatives**: Decimal units.
- **Why**: Consistent with the 5,242,880-byte limit. Shared with mobile.
- **Depends on**: —

### D7 — Errors without a design
- **Question**: How are undrawn errors shown?
- **Decision**: Import errors (network, 5xx, 415, unknown codes) show in the error box inside the import dialog, and the board list reloads. Export errors show as an error toast. A 404 on export gets its own message. Copy (shared with mobile):
  - Export failed: "Couldn't export “{boardName}”. Check your connection and try again."
  - Export 404: "“{boardName}” no longer exists, so it can't be exported."
  - Import failed: "Couldn't import the board. Check your connection and try again."
- **Alternatives**: Toasts for both; wait for designs.
- **Why**: Reuses drawn patterns. The user reviews the copy in the proposal.
- **Depends on**: —

### D8 — Key prefill
- **Question**: What does the Key field in "Choose a different key" start with?
- **Decision**: The clashing key (for example `CRD`).
- **Alternatives**: Empty; a suggested free key.
- **Why**: User decision.
- **Depends on**: —

### D9 — Clashing board's name
- **Question**: How does the clash text get the name of the board that uses the key?
- **Decision**: Look the board up by key in the board list data already loaded. If it isn't there, show the fallback sentence: "One of your boards already uses the key {key}. Enter another key for the imported board."
- **Alternatives**: Always fetch the board list first.
- **Why**: No extra request or undrawn loading state.
- **Depends on**: —

### D10 — Key validation
- **Question**: How is the new key validated in the clash dialog?
- **Decision**: The same as the New board key field (Figma Board list page): lowercase letters become uppercase, the client checks 2–5 letters A–Z, and server field errors show under the field. The dialog stays open on a key error.
- **Alternatives**: Server-only validation.
- **Why**: One set of key rules and messages in the app.
- **Depends on**: D8

### D11 — Cancel import
- **Question**: What does "Cancel import" do?
- **Decision**: Closes all import dialogs. Nothing is imported.
- **Alternatives**: Back to the drop zone.
- **Why**: Matches the label.
- **Depends on**: —

### D12 — Export file name
- **Question**: Which file name does the download use?
- **Decision**: The `Content-Disposition` file name from the response. If that is missing or unreadable, `<board.key>-<yyyy-MM-dd>.json` built from the file's `board.key` and the UTC date of its `exportedAt`.
- **Alternatives**: Always build it on the client.
- **Why**: The shared spec stays the source.
- **Depends on**: —

### D13 — Exporting dialog copy
- **Question**: Keep the Figma text that mentions both platforms?
- **Decision**: Platform-specific. Web shows only the browser sentence: "When the file is ready, the browser downloads it."
- **Alternatives**: Keep the Figma text on both platforms.
- **Why**: User decision. The user reviews the copy in the proposal.
- **Depends on**: —

### D14 — Export success toast
- **Question**: Does web show the export success toast?
- **Decision**: Yes, "“{name}” exported." as in Figma. This string is web-only; the app uses the share sheet as confirmation.
- **Alternatives**: —
- **Why**: Figma "Export done" frame. Mobile confirmed the difference.
- **Depends on**: —

### D15 — Drops outside the drop zone
- **Question**: What happens when a file is dropped outside the drop zone?
- **Decision**: While the import dialog is open, drops anywhere outside the drop zone are blocked, so the browser doesn't open the file. Nothing visual changes.
- **Alternatives**: Whole page as a drop target; no guard.
- **Why**: Keeps the user in the app.
- **Depends on**: —

### D16 — Several files
- **Question**: What if several files are dropped?
- **Decision**: Use the first and ignore the rest.
- **Alternatives**: Show an error.
- **Why**: The current DropZone already does this.
- **Depends on**: —

### D17 — Calls before the contract exists
- **Question**: How is the UI built and tested without import/export endpoints in an OpenAPI spec?
- **Decision**: The transfer UI receives its actions (export a board, import a file with an optional key) as injected functions from the app layer. Tests use in-test fakes whose results follow the shared spec. The connect chunk (40) adds the real API functions and MSW.
- **Alternatives**: API functions and MSW now with placeholder paths; wait for the backend.
- **Why**: No invented endpoints, no repository layer.
- **Depends on**: —

### D18 — Hosting
- **Question**: How is the transfer UI mounted while board list and board view are built in parallel?
- **Decision**: `transfer` exports self-contained pieces (import trigger and dialog flow, export action with its progress dialog). The app layer wires them into the boards screens later, in chunk 40 at the latest. In this change they appear on the dev preview page and in tests only.
- **Alternatives**: Build minimal host screens here.
- **Why**: Features don't import each other. No waiting on chunks 20/21.
- **Depends on**: D17

### D19 — New dependencies
- **Question**: Who adds i18n and the screen test stack?
- **Decision**: This change adds `react-i18next` (with `i18next`) and `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`. No TanStack Query. The merge-conflict risk with the other wave-3 web changes is recorded in design.md.
- **Alternatives**: A separate foundation change first (recommended by this session, not chosen).
- **Why**: User decision.
- **Depends on**: —

### D20 — Tablet layout
- **Question**: Figma has no tablet frames for this page. What does tablet show?
- **Decision**: The desktop dialog layout.
- **Alternatives**: Ask for tablet frames.
- **Why**: Default accepted.
- **Depends on**: —

### D21 — Test scope
- **Question**: Which tests does this change write?
- **Decision**: Unit tests (pre-checks, size format, file name), Screen tests per state, feature tests through the injected fakes. No E2E until chunk 40.
- **Alternatives**: E2E now.
- **Why**: Default accepted. No backend endpoint exists.
- **Depends on**: D17

### D22 — File picker filter
- **Question**: Does the file picker filter file types?
- **Decision**: `accept=".json,application/json"`. The content is still checked (D4).
- **Alternatives**: No filter.
- **Why**: Default accepted.
- **Depends on**: D4

### D23 — Drop zone Over variant
- **Question**: Fix the DropZone "Over" variant in this change?
- **Decision**: Yes. While a file is over it, the drop zone shows the Figma Over content ("Release to import", download icon, no hint line).
- **Alternatives**: —
- **Why**: User approved.
- **Depends on**: —

### D24 — Key error copy
- **Question**: Which messages show for TOO_SHORT, TOO_LONG and INVALID_FORMAT on the clash dialog's key field?
- **Decision**: The strings the board list chunks define for the New board key field (web chunk 20). Import reuses them and defines none of its own.
- **Alternatives**: Define them in this change.
- **Why**: One set of key messages app-wide.
- **Depends on**: D10

### D25 — Clash dialog initial state
- **Question**: With the clashing key prefilled, how does the clash dialog start?
- **Decision**: It opens with the "You already have a board with the key {key}." error under the field, and Import is disabled until the key differs from the clashing key. The same applies after a retry clashes again with the new key.
- **Alternatives**: No error at first and a local failure on submit (recommended by this session, not chosen); send the unchanged key to the server.
- **Why**: User decision. Matches New board, which disables Create board while the key is used.
- **Depends on**: D8, D10

### D26 — Last-resort download name
- **Question**: Which name does the download use when neither `Content-Disposition` nor the file gives a key and date?
- **Decision**: `board-export.json`.
- **Alternatives**: Show the export error toast instead.
- **Why**: User decision. Only happens with a broken backend.
- **Depends on**: D12

## Facts

- Import accepts one blocking `multipart/form-data` request with a `file` part and an optional `key` part. It returns 201 with the created board — source: `board-export-format` › *Import upload*.
- A `file` part over 5,242,880 bytes gets 413 `PAYLOAD_TOO_LARGE` — source: `board-export-format` › *Import size limits*.
- Invalid files get 422 `INVALID_EXPORT_FILE` with empty `fieldErrors`, and the response doesn't say what failed — source: `board-export-format` › *Import validates every rule of the domain*.
- A key clash gets 409 `CONFLICT` with field error `key`/`ALREADY_USED`. An invalid `key` part gets 400 `VALIDATION_FAILED` with a field error for `key` — source: `board-export-format` › *Imported board key and clashes*.
- Export returns the complete file with `Content-Disposition` file name `<KEY>-<yyyy-MM-dd>.json` (UTC date of `exportedAt`) — source: `board-export-format` › *Export download*.
- Clients pick messages by `code` and field error code only, and fall back to the HTTP status for unknown codes — source: `api-errors` › *Error text is for developers only*, *Clients handle unknown error codes by status*.
- Board keys are 2–5 letters A–Z. Lowercase a–z is uppercased before validation — source: `domain-board` › *Board key format*.
- Figma Import & export page `9:9` has desktop 1440 and phone 390 frames only, and no annotations. Frames: Export from the board menu, Exporting, Export done, Import dialog, Dragging a file over, Import from the phone menu, Importing, Not a Cardigan export, File larger than 5 MB, Key already used, Imported — source: Figma `get_metadata 9:9`.
- Figma Board list page draws only one key error: "You already have a board with the key CRD." — source: Figma frame "New board · key already used · Desktop 1440".
- The design system has a progress Dialog that can't be closed, Toast (success/error), DropZone (first file only) and FileRow — source: `src/core/ui`.
- The repo has no OpenAPI snapshot, router, TanStack Query, i18n or RTL yet — source: `package.json`, AGENTS.md › Open Items.
- Request timeouts are settled in the connect chunk — source: orchestrator answer 14.

## Out of scope

- Real import/export calls, API functions, MSW handlers, E2E tests (chunk 40, `web-import-export-connect`).
- Mounting the pieces into the board list and board view screens (app layer, chunks 20/21/35/40).
- Request timeouts and slow-network handling (chunk 40).
- Navigating to the imported board (D2).
- Export from the board list (D1).
- TanStack Query (D19).

## Deferred

- The exact key error strings (D24) exist only once chunk 20 (`web-board-list-ui`) defines them — settle before: implementation of task group 6.
- The copy review of D7, D9 and D13 is still open with the user — settle before: implementation of task group 3.
- Where the shared key validation lives once both `boards` and `transfer` need it (`core/utils` or a new `core` module) — settle before: implementation.
