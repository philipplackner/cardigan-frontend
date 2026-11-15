# Artifact review (light): add-import-export-ui

**Verdict:** Ready
**Reviewed:** 2026-11-15, schema `careful-planning`, repo kind `code`

| Pass | Blocker | Major | Minor |
|---|---|---|---|
| Testability | 0 | 1 | 2 |
| Security | 0 | 0 | 0 |
| Hidden assumptions | 0 | 2 | 2 |
| Design contract | 1 | 1 | 0 |

## Findings

### D1: Import menu item owning the flow unmounts the dialog
**Severity:** blocker · **Status:** applied
**Location:** design.md > Pieces and structure (D18); tasks.md > 5.4, 7.2
**Current text:** "`ImportTrigger`: renders the "Import" button or, with `variant="menuItem"`, the "Import board" menu item. It owns the import flow."
**Failure scenario:** `core/ui/Menu` is a Radix `DropdownMenu` whose `Content` unmounts when the menu closes. Selecting "Import board" closes the phone menu, so an `ImportFlow` rendered inside the menu item unmounts with it and the import dialog disappears at once. The app layer (chunks 20/35) builds against this public API, so fixing it later changes the contract across chunks.
**Fix:** Replace the `ImportTrigger` bullet in design.md with: "`useImportFlow({ importBoard, findBoardNameByKey, onBoardsChanged })`: returns `{ open(), dialogs }`. The host renders the "Import" button or the "Import board" menu item and calls `open`, and renders `dialogs` outside any menu, the same way as `useExportBoard`. `ImportTrigger` (button variant only) is a convenience wrapper for the header." Update tasks 5.4 and 6.5 to export `useImportFlow`, add to 5.4: "The preview demo opens import from a `Menu` item and verifies the dialog stays open after the menu closes." In 7.2 replace "focus returns to the trigger" with "focus returns to the trigger, or for menu items to the menu's button".

### D2: Requirements describe host screens this change doesn't build
**Severity:** major · **Status:** applied
**Location:** specs/web-board-transfer/spec.md > Export entry point, Import entry point, Import errors in the dialog, Import success
**Current text:** "Export SHALL be offered only as "Export as JSON" in the board view's board menu … It SHALL NOT be offered in the board list." / "the board list header SHALL offer an "Import" button" / "After a failed upload, the board list SHALL reload." / "the user SHALL stay on the board list, the board list SHALL reload"
**Failure scenario:** Per D18 nothing is mounted in the board list or board view in this change, and no task tests these scenarios. On archive, the main spec claims behavior that doesn't exist, and nobody owns writing the tests when chunks 20/21/35 mount the pieces. The "Board tile menu" scenario is about chunk 20's screen.
**Fix:** Keep the requirements (D1 is settled) and add to each, after the first sentence: "The `transfer` feature provides this piece; the app layer mounts it (D18), and its tests are written with the mounting change." Replace "the board list SHALL reload" with "the flow SHALL call `onBoardsChanged`, which the app layer points at the board list reload". Add to tasks.md › Workflow follow-up: "The mounting change writes the entry-point and reload tests from `web-board-transfer` › Export entry point, Import entry point, Import success."

### A1: Cancel or a new file during the pre-check isn't defined
**Severity:** major · **Status:** applied
**Location:** specs/web-board-transfer/spec.md > Import pre-checks; design.md > Pieces and structure (reducer)
**Current text:** "idle → choosing { file?, error? } → checking → uploading { file, key? }"
**Failure scenario:** Reading and parsing a 5 MB file takes a moment. If the user presses Cancel (or drops a second file) during `checking`, the pending check still resolves and starts the upload behind a progress dialog after the user cancelled, or uploads the older file.
**Fix:** Add to Import pre-checks: "If the import dialog is closed or another file is chosen while a file is being checked, the result of that check SHALL be discarded and that file SHALL NOT be uploaded." Add scenario: "**WHEN** the user picks a 5 MB file and presses Cancel before the check finishes **THEN** no dialog is open and nothing is uploaded." Add to task 5.1/5.3: "a check that resolves after cancel or after a newer file is ignored."

### A2: i18next escaping not settled, names get double-escaped
**Severity:** major · **Status:** applied
**Location:** design.md > i18n (D19)
**Current text:** "`core/i18n/i18n.ts` initializes i18next with English only and resources bundled at build time"
**Failure scenario:** i18next escapes interpolated values by default and React escapes again, so a board named "R&D" shows "Imported “R&amp;D” with the key RD." and a file named `a<b>.json` shows entities. Tests with ASCII-only names pass.
**Fix:** Add: "i18next runs with `interpolation.escapeValue: false`, since React escapes text. Interpolated values are never rendered as HTML (no `Trans` with markup for user data). A screen test imports a board named `R&D <x>` and checks the toast text exactly."

### T1: File size outputs for edge sizes are not stated
**Severity:** major · **Status:** applied
**Location:** specs/web-board-transfer/spec.md > File size text; tasks.md > 3.3
**Current text:** "adversarial unit tests (0, 1, 1023, 1024, 1,536 → "2 KB", 14,336, 1,048,575, 1,048,576, …)"
**Failure scenario:** Half-up rounding gives "0 KB" for a 1-byte file and "1024 KB" for 1,048,575 bytes. One implementer writes those, another clamps to "1 KB" or switches to "1.0 MB", and both tests pass their own code.
**Fix (values need the user's confirmation):** Add scenarios: "0 bytes → "0 KB""; "1 byte → "0 KB""; "1,023 bytes → "1 KB""; "1,048,575 bytes → "1024 KB""; "1,048,576 bytes → "1.0 MB""; "5,242,880 bytes → "5.0 MB"". Put the same expected values in task 3.3. Catches: an implementation that switches to MB at 1,048,064 bytes because the KB value rounds to 1024.

### T2: "the clashing key" vs. every used key
**Severity:** minor · **Status:** applied
**Location:** specs/web-board-transfer/spec.md > Key clash dialog
**Current text:** "Import SHALL be disabled while the field holds the clashing key."
**Failure scenario:** After `CRD` and then `CRDB` clash, typing `CRD` again. The spec allows enabling Import (only the latest clash counts); design.md's `usedKeys` disables it.
**Fix:** "Import SHALL be disabled, and the "already used" error SHALL show, while the field holds any key that came back as already used during this import." Add scenario: "**WHEN** `CRD` and then `CRDB` clashed and the user types `CRD` **THEN** the error shows and Import is disabled." Catches: storing only the last clashing key.

### T3: No scenario for a non-key failure on retry
**Severity:** minor · **Status:** applied
**Location:** specs/web-board-transfer/spec.md > Retry with a new key
**Current text:** ""Import" in the clash dialog SHALL upload the same file again with the entered key, behind the import progress dialog."
**Failure scenario:** The retry fails with a network error or 500. An implementer keeps the clash dialog open with no message, or shows nothing.
**Fix:** Add scenario: "**WHEN** the retry with `CRDB` fails without a response **THEN** the clash dialog is replaced by the import dialog with the file row and "Couldn't import the board. Check your connection and try again.", and `onBoardsChanged` is called." Catches: a reducer that only handles `keyUsed`/`keyInvalid` from the `clash` step.

### A3: BOM and encoding outcome left open
**Severity:** minor · **Status:** applied
**Location:** tasks.md > 3.4
**Current text:** "BOM-prefixed valid file"
**Failure scenario:** The task lists the case without an expected result. `Blob.text()` strips a UTF-8 BOM, so the client accepts it; whether the backend accepts it is unknown.
**Fix:** "BOM-prefixed valid file passes the pre-check (the backend decides with 422 if it rejects it)". Add to design.md › Pre-checks: "The file is decoded as UTF-8. Files in other encodings fail as not JSON."

### A4: Object URL revoked right after the click
**Severity:** minor · **Status:** applied
**Location:** design.md > Download (D12)
**Current text:** "then revokes the URL in a `setTimeout(…, 0)` so Safari has started the download"
**Failure scenario:** Some browsers start reading the blob URL after the current task; revoking on the next tick can cancel the download. The jsdom test with fake timers passes regardless.
**Fix:** "then revokes the URL after 60 seconds (`setTimeout`), long enough for every supported browser to have read it. Task 7.2 checks a real download in Safari and Firefox."

## Trust boundaries

- **Imported file (user input):** a huge or hostile file could hang the tab; the size check runs before any read, and `JSON.parse` doesn't pollute prototypes. Stopped.
- **File name and board name in UI text:** script injection through interpolation; React escapes text, so no injection. Display bug covered by A2.
- **Export response (`Content-Disposition`, blob):** a crafted name with path parts; design.md strips separators and control characters, and `<a download>` never navigates. Stopped.
- **Drag and drop from other apps/pages:** a drop outside the zone navigating the page to the file; the window guard (D15) stops it.
- **Auth:** an `<a href>` download would need the token in the URL; design.md rules it out and keeps the token in the header. Stopped.
- **Local storage:** none used.

## Coverage

All requirements and scenarios in both delta specs checked; decisions.md, proposal.md, design.md and tasks.md read. Shared spec `board-export-format` read; `domain-board` and `api-errors` not opened (decisions.md › Facts quotes them). Code read: `DropZone.tsx`, `Menu.tsx`, `Dialog.tsx` (grep), `vitest.config.ts`, `package.json`. Not read: Figma, the other wave-3 changes (not in this repo), `Toast`, `Field`. No artifacts missing.

## Applied changes

All nine findings applied as recommended (the user accepted the recommendations, including the T1 size values "0 KB" for 0 and 1 byte and "1024 KB" for 1,048,575 bytes).

- `specs/web-board-transfer/spec.md`: Export/Import entry point scoped to the pieces with mounting and tests in the app-layer change (D2); dialogs stay open after the menu closes (D1); board list reload replaced by `onBoardsChanged` (D2); pre-check cancel and newer-file rule with two scenarios (A1); four file-size scenarios (T1); "any key that came back as already used" plus scenario (T2); retry-fails scenario (T3).
- `design.md`: `useImportFlow` with `{ open(), dialogs }`, `ImportTrigger` button-only (D1); stale pre-check results ignored and retry failure back to `choosing` (A1, T3); UTF-8/BOM note (A3); revoke after 60 seconds (A4); `escapeValue: false` (A2).
- `tasks.md`: tasks 1.2, 3.3, 3.4, 4.1, 5.1, 5.3, 5.4, 6.2, 6.3, 6.5, 7.2 and Workflow follow-up updated. No checkbox changed.
- `proposal.md`: import entry wording follows D1.
- `decisions.md` not edited. D18 still holds: the pieces stay self-contained, only the import API shape changed. No non-standard artifacts in the change folder.
- `openspec validate add-import-export-ui --strict` passes.
