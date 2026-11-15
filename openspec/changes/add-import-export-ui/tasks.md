# Tasks

Each group ends in its own commit once all five gates pass (`typecheck`, `lint`, `format:check`, `test`, `build`). "Check against Figma" means: open the transfer preview section on the dev server at 390 px, 834 px and 1440 px wide, in light and dark system themes, and compare it with `get_screenshot` of the matching frame on page `9:9`. Look frames up with `get_metadata 9:9`; don't use node IDs copied from this file.

Before group 6: chunk 20 must have defined the New board key error strings (D24). Stop and ask if either is missing.

## 1. i18n and screen test setup

Covered by commit 978fd70 ("build: add react-i18next and screen test setup").

- [x] 1.1 Install `i18next`, `react-i18next`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, and verify `npm ls` lists them with no peer warnings
- [x] 1.2 Add `src/core/i18n/` setup (English only, bundled resources, typed keys via `CustomTypeOptions`, `interpolation.escapeValue: false`, `common` namespace) and import it from `src/main.tsx` and the preview entry. Verify `npm run build` passes and a typo in a `t()` key fails `npm run typecheck`
- [x] 1.3 Configure Vitest so `*.test.tsx` runs in jsdom while `*.test.ts` stays in `node`, add `src/testSetup.ts` (jest-dom, i18n, cleanup), update `tsconfig.test.json`, and verify with one smoke `*.test.tsx` that renders a `core/ui` `Button` and finds it by role, while the existing tests still pass
- [x] 1.4 Tell the orchestrator session (cardiganapp-be) that the setup commit has landed, so the other wave-3 web sessions rebase onto it

## 2. Drop zone Over variant

- [x] 2.1 Add `overTitle` to `DropZone`: Over shows `DownloadIcon` and the over title without the hint line, and the browse button stays mounted. Update `ImportExportSection` in the preview, add a screen test that `dragenter` with files shows "Release to import" and hides "or browse files" and that `dragleave` restores it, and check against the Figma frame "Dragging a file over · Desktop 1440"

## 3. Transfer types, translations and pure utils

- [x] 3.1 Add `features/transfer/types.ts` with `ExportBoard`, `ImportBoard`, `ExportResult`, `ImportResult` as in design.md, and verify `npm run typecheck` passes
- [x] 3.2 Add the `transfer` namespace (`features/transfer/i18n/en.json`), registered under `resources` in `src/app/i18n.ts`, with every Figma string from page `9:9` plus the copy from proposal.md › What Changes, and verify each string matches Figma or the proposal character for character, including the curly quotes
- [x] 3.3 Add `formatFileSize` with adversarial unit tests (0 → "0 KB", 1 → "0 KB", 1023 → "1 KB", 1024 → "1 KB", 1,536 → "2 KB", 14,336 → "14 KB", 1,048,575 → "1024 KB", 1,048,576 → "1.0 MB", 1,310,720 → "1.3 MB", 5,242,880 → "5.0 MB", 5,242,881 → "5.1 MB", 7,549,747 → "7.2 MB") and verify they pass
- [x] 3.4 Add `checkExportFile` with unit tests: exactly 5,242,880 bytes passes, 5,242,881 fails as too large without being read, not JSON, JSON array, `null`, wrong `format`, `formatVersion` `2` and `"1"`, BOM-prefixed valid file passes (the backend decides with 422 if it rejects it), valid header with invalid content passes. Verify they pass
- [x] 3.5 Add `exportFileName` with unit tests: `filename="CRD-2026-11-04.json"`, `filename*=UTF-8''…`, missing header falls back to key + UTC date with `exportedAt` `2026-11-04T23:30:00Z` under `TZ=Europe/Berlin` giving `2026-11-04`, path separators stripped, unreadable file gives `board-export.json`. Verify they pass

## 4. Export

- [x] 4.1 Add `downloadFile` (object URL, temporary `<a download>`, revoke after 60 seconds) and a jsdom test with fake timers that it clicks an anchor with the given name, does not revoke before 60 seconds and revokes the URL afterwards
- [x] 4.2 Add `useExportBoard` with the progress dialog ("Exporting “{name}”" with the web-only body), the download, the success toast and the error toasts for `notFound` and `other`. Write feature tests with a fake `ExportBoard`: success downloads with the response name and shows "“Cardigan v1” exported.", 404 shows the no-longer-exists toast and downloads nothing, other failures show the generic toast, Escape doesn't close the progress dialog
- [x] 4.3 Add an export demo to the preview section (a menu with "Export as JSON" and a fake that resolves after a delay) and check the menu, the Exporting dialog and the Export done toast against Figma at 390 px and 1440 px

## 5. Import dialog, pre-checks and progress

- [ ] 5.1 Add the import reducer (`idle`, `choosing`, `checking`, `uploading`, `clash`, `done`) with unit tests for every transition, including a new file replacing an earlier error, cancel from every step, a check that resolves after cancel or after a newer file being ignored, and a non-key failure on a retry from `clash` returning to `choosing` with the error
- [ ] 5.2 Add `ImportScreen` for the import dialog (drop zone, hint, file row, error box, Cancel), with `accept=".json,application/json"` and screen tests for the empty, too-large and not-an-export states
- [ ] 5.3 Add `useImportViewModel` and `ImportFlow` with the pre-check, the upload, the progress dialog "Importing {file name}", error mapping (`tooLarge`, `invalidFile`, `other`), `onBoardsChanged` after a failed upload, and the window drop guard while the dialog is open. Write feature tests with a fake `ImportBoard`: a valid file uploads without a confirm step, an oversized and a non-JSON file are never passed to the fake, server 413/422/other show the right messages and call `onBoardsChanged`, two dropped files upload only the first, a drop on the scrim uploads nothing and is `defaultPrevented`, Cancel while a check is pending never calls the fake
- [ ] 5.4 Add `useImportFlow` (`{ open(), dialogs }`) and `ImportTrigger` (button only) and a preview demo that opens import both from the button and from a `Menu` item, and verify the dialog stays open after the menu closes; and check the Import dialog, Dragging a file over, Importing, Not a Cardigan export and File larger than 5 MB frames against Figma at 390 px, 834 px (desktop layout) and 1440 px

## 6. Key clash and success

- [ ] 6.1 Add the key clash dialog to `ImportScreen` (prefilled key, uppercase on input, local 2–5 A–Z check with chunk 20's messages, server key errors under the field, "Cancel import", "Import") with the named and fallback body texts. While the value is a used key it shows "You already have a board with the key {key}." and Import is disabled, from the moment it opens. Write screen tests for both bodies, the initial error with disabled Import, uppercase input, changing the key enabling Import, typing `crd` back disabling it, and a local key error
- [ ] 6.2 Wire the clash into the view model: 409 `keyUsed` opens it with `findBoardNameByKey` and adds the key to `usedKeys`; "Import" re-uploads the same `File` with the key; "Cancel import" closes everything. Write feature tests: clash, retry succeeds with `CRDB`, retry clashes again and stays open with the error and Import disabled, typing the first clashing key after a second clash keeps Import disabled, a retry failing without a response shows the import dialog with the generic error and calls `onBoardsChanged`, cancel calls the fake no more and leaves no dialog open
- [ ] 6.3 On success, close all dialogs, call `onBoardsChanged` and show "Imported “{name}” with the key {key}." from the returned board. Write feature tests for an import with and without a key change, and one importing a board named `R&D <x>` that checks the toast text exactly
- [ ] 6.4 Add the clash and success states to the preview demo and check Key already used (390 px, 1440 px) and Imported (toast) against Figma
- [ ] 6.5 Export `useImportFlow`, `ImportTrigger`, `useExportBoard` and the types from `features/transfer/index.ts`, and verify with `npm run lint` that nothing outside `src/app` and `src/preview` imports them, and that `transfer` imports no other feature

## 7. Integration checks

- [ ] 7.1 Run all five gates on a clean checkout of the branch and verify they pass
- [ ] 7.2 Walk through the full flows on the preview page with only the keyboard (open import, browse, pick, clash, retry, cancel; export from the menu), and verify focus returns to the trigger, or for menu items to the menu's button, after each dialog closes. Also export a board in Safari and Firefox and verify the file is downloaded

## Workflow follow-up

- Chunk 40 (`web-import-export-connect`) adds the API functions, the `DataError` → result mapper, MSW handlers, timeouts and E2E tests.
- The app layer mounts `ImportTrigger` or `useImportFlow` in the board list (chunks 20/35) and `useExportBoard` in the board view menu (chunks 21/35).
- The mounting change writes the entry-point and reload tests from `web-board-transfer` › Export entry point, Import entry point, Import success.
- Archive the change after review.
