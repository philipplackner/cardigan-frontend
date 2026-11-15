# Design

## Context

See proposal.md › Why. Current state that shapes the approach:

- `src/features/transfer/` has only empty folders.
- i18n and the screen test stack are in place (commit 978fd70): `initI18n` in `core/i18n` with a `common` namespace, `src/app/i18n.ts` assembling all namespaces, typed keys in `src/app/i18next.d.ts`, and `src/testSetup.ts`.
- No router, no TanStack Query, no `core/api` (chunk 18), no OpenAPI snapshot.
- `src/core/ui` has what the screens need: `Dialog` (default and progress), `ToastProvider`/`useToast`, `DropZone`, `FileRow`, `Banner`, `Field`, `Input`, `Button`, `Menu`.
- `DropZone` already ignores drags without files, keeps only the first file and resets the input after a pick.
- Vitest runs `*.test.ts` in `node` and `*.test.tsx` in jsdom (through `test.projects`), with `TZ=Europe/Berlin`.
- The repo rules: plain API functions with MSW instead of a repository layer, no `vi.mock` of project modules, features don't import each other, all text through react-i18next.
- Hosts for the entry points belong to other changes: the board list header and phone menu (chunk 20), the board view menu (chunk 21).

## Goals / Non-Goals

**Goals:**
- The complete import and export flows from Figma, with every state from `specs/web-board-transfer`, testable without a backend.
- A small, typed seam that chunk 40 fills with the real API without touching the screens.

**Non-Goals:**
- API functions, DTOs, mappers, MSW handlers, E2E tests, timeouts (chunk 40).
- Mounting the pieces in board list or board view screens (app layer, later).
- A shared key-validation module for `boards` and `transfer` (see Open Questions).

## Decisions

### The seam: `TransferActions` (D17, D18)

`features/transfer/types.ts` defines what the app layer passes in:

```ts
type ExportBoard = (boardId: string) => Promise<ExportResult>
type ImportBoard = (file: File, key?: string) => Promise<ImportResult>

type ExportResult =
  | { ok: true; file: Blob; contentDisposition: string | null }
  | { ok: false; error: 'notFound' | 'other' }

type ImportResult =
  | { ok: true; board: { name: string; key: string } }
  | { ok: false; error:
      | { kind: 'tooLarge' }            // 413
      | { kind: 'invalidFile' }         // 422
      | { kind: 'keyUsed' }             // 409 key/ALREADY_USED
      | { kind: 'keyInvalid'; code: string; min?: number; max?: number } // 400 key field error
      | { kind: 'other' } }             // network, 5xx, 415, unknown
```

The pieces also take `findBoardNameByKey(key): string | undefined` (D9) and an `onBoardsChanged()` callback, which the app layer later points at board list invalidation. It is called after a failed upload (D7) and after a success.

Why a result union and not `DataError`: `core/api` and `DataError` don't exist yet (chunk 18), and the union is the transfer feature's own vocabulary. Chunk 40 writes one mapper from `DataError` to these kinds. That mapper is where `api-errors` › *Clients handle unknown error codes by status* is applied. Alternatives: API functions with MSW now (rejected: needs an invented path); a repository interface (rejected: the repo rules forbid a repository layer).

### Pieces and structure (D18)

All pieces live in `features/transfer` and are exported from its public `index.ts`:

- `useImportFlow({ importBoard, findBoardNameByKey, onBoardsChanged })`: returns `{ open(), dialogs }`. The host renders the "Import" button or the "Import board" menu item and calls `open`, and renders `dialogs` outside any menu, the same way as `useExportBoard`. `core/ui/Menu` is a Radix `DropdownMenu` whose content unmounts when the menu closes, so dialogs rendered inside a menu item would disappear with it.
- `ImportTrigger` (button variant only): a convenience wrapper for the header that renders the "Import" button and the `dialogs`.
- `ImportFlow`: Root. It calls `useImportViewModel` and renders `ImportScreen`, which holds the import dialog, the progress dialog and the key clash dialog. `dialogs` from `useImportFlow` is this Root.
- `useExportBoard({ exportBoard })`: returns `{ start(board: { id, name }), dialog }`. The board view's menu item calls `start`, and `dialog` (the progress dialog) is rendered by the host. Export has no Screen of its own; the hook runs the request, the download and the toasts.

Import view-model state is a reducer with a discriminated union:

```
idle → choosing { file?, error? } → checking → uploading { file, key? }
     → clash { file, key, existingName?, fieldError? } → uploading …
     → done (closes, toast)
```

The reducer is pure and unit-tested. The async work (pre-check, upload) lives in the hook. Each pre-check carries the file it started for; a check that resolves after cancel, or after a newer file was chosen, is ignored. A non-key failure on a retry from `clash` returns to `choosing` with the error. Only the current step's dialog is open, so the import dialog and the clash dialog never stack.

### Pre-checks (D4, D5)

`utils/checkExportFile.ts`: `async (file: File) => { ok: true } | { ok: false, reason: 'tooLarge' | 'invalidFile' }`.

- The size check uses `file.size > 5_242_880` before reading anything, so a 50 MB file is never read into memory.
- Then `file.text()` (UTF-8; a UTF-8 BOM is stripped, and files in other encodings fail as not JSON), `JSON.parse` in a try/catch, and a check that the root is an object with `format === 'cardigan.board'` and `formatVersion === 1` (strict number check, so `"1"` fails).
- Nothing else is validated (domain rules stay on the backend).
- The parsed object is dropped. The original `File` is uploaded unchanged.

### Size text (D6)

`utils/formatFileSize.ts` takes `(bytes, { roundUp })`. The caller sets `roundUp` when `bytes > 5_242_880`.

- Below 1,048,576 bytes it shows whole KB, otherwise MB with one decimal.
- Rounding is half up, or ceiling when `roundUp` is set (D6). It works on integers: tenths of a MB are `bytes * 10 / 1_048_576`, rounded with an integer remainder check rather than `Math.round` on a float, so exact halves like 1,310,720 bytes never tip the wrong way.
- Numbers are formatted with `Intl.NumberFormat('en', …)`, so the decimal point stays fixed while only English exists.

Unit tests cover 0, 1, 1023, 1024, 1,536, 14,336, 1,048,575, 1,048,576, 1,310,720, 5,242,880, 5,242,881 and 7,549,747.

### Download (D12)

`utils/downloadFile.ts` creates an object URL for the `Blob` and clicks a temporary `<a download="name">`, then revokes the URL after 60 seconds (`setTimeout`), long enough for every supported browser to have read it. Revoking on the next tick can cancel the download in some browsers. An `<a href>` straight to the API can't be used: the access token lives in memory and goes in the `Authorization` header (AGENTS.md › Authentication).

`utils/exportFileName.ts`:

1. Parse `filename*=UTF-8''…` (RFC 5987), then `filename="…"`, from `contentDisposition`.
2. If neither gives a non-empty name, read the blob as JSON and build `${board.key}-${utcDate(exportedAt)}.json`. `utcDate` uses the `getUTC*` getters, never the local date.
3. If the file has no readable `board.key` or `exportedAt` either, use `board-export.json` (D26).

The name is sanitized: path separators and control characters are removed. Unit tests run under `TZ=Europe/Berlin` with an `exportedAt` near midnight UTC.

### Drops outside the drop zone (D15)

While the import dialog (default type) is open, `ImportScreen` adds `dragover` and `drop` listeners on `window` that call `preventDefault()` for drags carrying files. The drop zone's own handlers run first and still get the file. The listeners are added in an effect and removed when the dialog closes.

Alternative: a full-screen invisible drop target. Rejected: it would sit above the Radix portal and need its own focus and pointer handling.

### Key clash dialog (D8–D11)

- Built from `Dialog`, `Field` and `Input`.
- The field starts with the clashing key and uppercases a–z on input. The local check is `/^[A-Z]{2,5}$/`.
- A server `keyInvalid` or `keyUsed` result shows under the field through `Field`'s error slot and keeps the dialog open.
- The `clash` state keeps `usedKeys`: the original clashing key plus every key that came back `keyUsed` in this flow (spec › Key clash dialog). While the field's value is in `usedKeys`, the field shows "You already have a board with the key {key}." and Import is disabled (D25). That includes the moment the dialog opens. The error is derived from the value, not stored, so typing a used key again brings it back.
- "You already have a board with the key {key}." comes from Figma's New board frame. The REQUIRED, TOO_SHORT, TOO_LONG and INVALID_FORMAT texts are defined here (D24), in the `transfer` namespace, with INVALID_FORMAT as the fallback for unknown key codes. Chunk 20 reuses them for the New board key field; they move to `core` together with key validation (see Open Questions).
- The local check follows `api-errors`: empty is REQUIRED, under 2 letters TOO_SHORT, over 5 TOO_LONG, anything else that isn't A–Z INVALID_FORMAT.
- The field shows Figma's help text "2–5 uppercase letters. Can’t be changed later." (frame "Key already used").

### DropZone Over variant (D23)

`DropZone` gets an `overTitle` prop. In the Over state it shows `DownloadIcon`, `overTitle` and no hint line. The browse button stays mounted but hidden, so focus isn't lost while dragging. The preview section is updated.

### i18n (D19)

The setup landed in commit 978fd70 (task group 1). This change uses it as follows:

- `core/i18n/i18n.ts` (`initI18n`) initializes i18next with English only and resources bundled at build time (no HTTP backend, CSP-safe), with `interpolation.escapeValue: false`. Interpolated values are never rendered as HTML (no `Trans` with markup for user data).
- `transfer` owns a `transfer` namespace in `features/transfer/i18n/en.json`. It is added to `resources` in `src/app/i18n.ts`, which also gives it typed keys through `src/app/i18next.d.ts`. "Cancel" and "Close" come from the existing `common` namespace.
- `main.tsx`, the preview entry and `src/testSetup.ts` already import `src/app/i18n.ts`, so tests see the `transfer` strings without extra setup.

### Test stack (D19, D21)

- In place since commit 978fd70: `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`, `@testing-library/jest-dom`. `vitest.config.ts` uses `test.projects`: `*.test.ts` in `node`, `*.test.tsx` in jsdom with `src/testSetup.ts` (jest-dom matchers, i18n, RTL `cleanup`).
- Test kinds:
  - **Unit**: reducer, `checkExportFile`, `formatFileSize`, `exportFileName`.
  - **Screen**: `ImportScreen` per state, rendered with props.
  - **Feature**: `ImportFlow` and `useExportBoard` with fake `ImportBoard` and `ExportBoard` functions, driven with user-event.
- Drops are tested with `fireEvent.drop` and a `DataTransfer`-like object, since jsdom has no real drag and drop.
- No `vi.mock`. The only fakes are the injected functions.

## Risks / Trade-offs

- **[Merge conflicts with other wave-3 web changes]** (resolved): board list, board view, card detail, labels and auth UI also need i18n and RTL. The setup landed once as its own commit (978fd70), and the orchestrator told the other sessions to build on it instead of re-adding it. What's left: each feature adds its namespace to `src/app/i18n.ts`, so parallel changes touch that one file. Those are one-line additions that merge easily.
- **[Seam drifts from the real API]**: the result union is written before the OpenAPI spec exists. → It only uses codes from `board-export-format` and `api-errors`. Chunk 40 adds the mapper and its tests.
- **[Reading files on the main thread]**: `file.text()` and `JSON.parse` on a 5 MB file can block for tens of milliseconds. → Acceptable for a one-off action. The size check runs first, so nothing over 5 MB is read.
- **[Key error copy shared with chunk 20]**: this change defines the key error strings (D24) and chunk 20 must reuse them. → The orchestrator records this in the chunk 20 breakdown. When `boards` needs them, they and the key check move to `core`.
- **[Hung request keeps the progress dialog open]**: there is no timeout in this change. → Accepted; chunk 40 decides timeouts.

## Open Questions

- Where key validation lives once `boards` and `transfer` both need it (`core/utils` or a new `core` module; a new `core` folder needs the user's approval). Until then, `transfer` keeps its own 2-line check.
