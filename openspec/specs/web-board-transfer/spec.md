# web-board-transfer Specification

## Purpose
Defines the web-only behavior of exporting a board to a JSON file and importing such a file as a new board: entry points, progress and result feedback, browser download, file choice, client pre-checks, error placement and copy, and the key clash dialog. Shared rules come from `board-export-format`, `domain-board` and `api-errors`.

## Requirements

### Requirement: Export entry point
Export SHALL be offered only as "Export as JSON" in the board view's board menu, on every size. The `transfer` feature provides this piece; the app layer mounts it (D18), and its tests are written with the mounting change. It SHALL NOT be offered in the board list.

#### Scenario: Board view menu
- **WHEN** the user opens the board menu in the board view
- **THEN** it contains "Export as JSON"

#### Scenario: Board tile menu
- **WHEN** the user opens a board tile or board row menu in the board list
- **THEN** it has no export item

### Requirement: Export progress
While an export request runs, the web app SHALL show the progress dialog titled "Exporting “{board name}”" with the body "When the file is ready, the browser downloads it." The dialog SHALL NOT be dismissible and SHALL close when the request ends.

#### Scenario: Export starts
- **WHEN** the user chooses "Export as JSON" for the board "Cardigan v1"
- **THEN** the progress dialog "Exporting “Cardigan v1”" shows with the browser sentence and no mention of a share sheet

#### Scenario: Escape during export
- **WHEN** the export is running and the user presses Escape
- **THEN** the progress dialog stays open

### Requirement: Export download and file name
After a successful export, the browser SHALL download the file without leaving the app. It SHALL use the file name from the response's `Content-Disposition`. If that is missing or unreadable, it SHALL use `<board.key>-<yyyy-MM-dd>.json` from the file's `board.key` and the UTC date of its `exportedAt`, and otherwise `board-export.json`.

#### Scenario: Name from the response
- **WHEN** the export response names the file `CRD-2026-11-04.json`
- **THEN** the downloaded file is called `CRD-2026-11-04.json`

#### Scenario: Header missing
- **WHEN** the response has no `Content-Disposition` and the file has `board.key` `CRD` and `exportedAt` `2026-11-04T23:30:00Z`
- **THEN** the downloaded file is called `CRD-2026-11-04.json`, even though the local date in Berlin is 5 November

#### Scenario: Nothing readable
- **WHEN** the response has no usable `Content-Disposition` and the file has no readable `board.key` or `exportedAt`
- **THEN** the downloaded file is called `board-export.json`

### Requirement: Export result feedback
After the download starts, a success toast SHALL show "“{board name}” exported." When the export fails, an error toast SHALL show instead and nothing SHALL be downloaded. A 404 SHALL show "“{board name}” no longer exists, so it can't be exported." Every other failure SHALL show "Couldn't export “{board name}”. Check your connection and try again."

#### Scenario: Success
- **WHEN** the export of "Cardigan v1" succeeds
- **THEN** the toast "“Cardigan v1” exported." shows

#### Scenario: Board deleted elsewhere
- **WHEN** the export of "Cardigan v1" fails with 404 `NOT_FOUND`
- **THEN** the error toast "“Cardigan v1” no longer exists, so it can't be exported." shows

#### Scenario: Network failure
- **WHEN** the export request fails without a response
- **THEN** the error toast "Couldn't export “Cardigan v1”. Check your connection and try again." shows

### Requirement: Import entry point
On tablet and desktop, the board list header SHALL offer an "Import" button. On a phone, the board list menu SHALL offer "Import board". `transfer` provides the pieces; the app layer mounts them and writes these tests (D18). The dialogs SHALL stay open after the menu closes. Both SHALL open the import dialog titled "Import board" with the drop zone, the hint "JSON exports up to 5 MB" and a Cancel button. Tablet SHALL use the desktop dialog layout.

#### Scenario: Desktop
- **WHEN** the user selects "Import" in the board list header on a 1440 px viewport
- **THEN** the "Import board" dialog opens with the drop zone

#### Scenario: Phone
- **WHEN** the user selects "Import board" in the board list menu on a phone
- **THEN** the "Import board" dialog opens with the drop zone and stays open after the menu closes

### Requirement: Choosing a file
The user SHALL choose a file by dropping it on the drop zone or through the system file picker, which SHALL suggest `.json` files. When several files are dropped, only the first SHALL be used. Choosing a file SHALL start the pre-checks and, if they pass, the upload right away, without a confirm step.

#### Scenario: Picker filter
- **WHEN** the user opens the file picker from "browse files"
- **THEN** the picker suggests `.json` and `application/json` files

#### Scenario: Several files dropped
- **WHEN** the user drops `a.json` and `b.json` together
- **THEN** only `a.json` is checked and uploaded

#### Scenario: No confirm step
- **WHEN** the user picks a valid export file
- **THEN** the upload starts without another click

### Requirement: Drops outside the drop zone
While the import dialog is open, a file dropped anywhere outside the drop zone SHALL be ignored, and the browser SHALL NOT open or navigate to it.

#### Scenario: Drop on the scrim
- **WHEN** the import dialog is open and the user drops a JSON file on the scrim
- **THEN** the app stays on the board list, the dialog stays open and nothing is uploaded

### Requirement: Import pre-checks
Before uploading, the web app SHALL reject a file over 5,242,880 bytes. Otherwise it SHALL parse the file as JSON and reject it if it isn't JSON, or if `format` isn't `cardigan.board` or `formatVersion` isn't `1`. A rejected file SHALL NOT be uploaded. All other validation SHALL be left to the backend. If the import dialog is closed or another file is chosen while a file is being checked, the result of that check SHALL be discarded and that file SHALL NOT be uploaded.

#### Scenario: Exactly at the limit
- **WHEN** the user picks a valid export of exactly 5,242,880 bytes
- **THEN** it is uploaded

#### Scenario: One byte over
- **WHEN** the user picks a file of 5,242,881 bytes
- **THEN** it is not uploaded and the size error shows

#### Scenario: PNG renamed to .json
- **WHEN** the user picks a file that isn't valid JSON
- **THEN** it is not uploaded and the invalid-file error shows

#### Scenario: Newer version
- **WHEN** the file has `"formatVersion": 2`
- **THEN** it is not uploaded and the invalid-file error shows

#### Scenario: Content error left to the backend
- **WHEN** the file has a valid header and a card title over the limit
- **THEN** it is uploaded and the backend's 422 decides

#### Scenario: Cancel during the check
- **WHEN** the user picks a 5 MB file and presses Cancel before the check finishes
- **THEN** no dialog is open and nothing is uploaded

#### Scenario: Newer file during the check
- **WHEN** the user drops `b.json` while `a.json` is still being checked
- **THEN** only `b.json` can be uploaded

### Requirement: Import progress
While the import request runs, the web app SHALL show the progress dialog titled "Importing {file name}" with the body "This creates the board with all its columns, cards and labels." It SHALL NOT be dismissible and SHALL close when the request ends.

#### Scenario: Upload running
- **WHEN** `board-backup.json` is being uploaded
- **THEN** the progress dialog "Importing board-backup.json" shows and Escape doesn't close it

### Requirement: Import errors in the dialog
When a file is rejected or the import fails other than with a key error, the import dialog SHALL show the drop zone, the file row (name and size) and an error box with the message. The user SHALL be able to choose another file from the same dialog. After a failed upload, the flow SHALL call `onBoardsChanged`, which the app layer points at the board list reload.

#### Scenario: Error and retry
- **WHEN** `notes.json` was rejected and the user drops `board-backup.json`
- **THEN** the error box and the old file row go away and `board-backup.json` is checked

#### Scenario: Board list after a server error
- **WHEN** the import request fails with 500 `INTERNAL_ERROR`
- **THEN** the error box shows in the dialog and `onBoardsChanged` is called

### Requirement: Import error messages
The error box SHALL show "This file is {size}. Board exports can be up to 5 MB." for an oversized file or a 413. It SHALL show "This file isn't a Cardigan board export. Choose a .json file that was exported from Cardigan." for a failed format check or any 422. Every other failure SHALL show "Couldn't import the board. Check your connection and try again."

#### Scenario: Server 413
- **WHEN** the backend answers 413 `PAYLOAD_TOO_LARGE` for a 7,549,747-byte file
- **THEN** the box shows "This file is 7.2 MB. Board exports can be up to 5 MB."

#### Scenario: Server 422
- **WHEN** the backend answers 422 `INVALID_EXPORT_FILE`
- **THEN** the box shows the invalid-file message

#### Scenario: Unknown code
- **WHEN** the backend answers 415 or an error code the client doesn't know
- **THEN** the box shows "Couldn't import the board. Check your connection and try again."

### Requirement: File size text
File sizes SHALL be shown with base 1024 in English: whole KB below 1 MB (1,048,576 bytes), otherwise MB with one decimal. KB and MB SHALL be rounded half up, except for files over 5,242,880 bytes, which SHALL always be rounded up.

#### Scenario: Small file
- **WHEN** the file has 14,336 bytes
- **THEN** its size shows as "14 KB"

#### Scenario: Smallest sizes
- **WHEN** the file has 0 bytes, 1 byte or 1,023 bytes
- **THEN** its size shows as "0 KB", "0 KB" or "1 KB"

#### Scenario: Just below 1 MB
- **WHEN** the file has 1,048,575 bytes
- **THEN** its size shows as "1024 KB"

#### Scenario: Exactly 1 MB
- **WHEN** the file has 1,048,576 bytes
- **THEN** its size shows as "1.0 MB"

#### Scenario: Exactly at the limit
- **WHEN** the file has 5,242,880 bytes
- **THEN** its size shows as "5.0 MB"

#### Scenario: Half a KB
- **WHEN** the file has 1,536 bytes
- **THEN** its size shows as "2 KB"

#### Scenario: Half a tenth of a MB
- **WHEN** the file has 1,310,720 bytes (1.25 MB)
- **THEN** its size shows as "1.3 MB"

#### Scenario: Large file
- **WHEN** the file has 7,549,747 bytes
- **THEN** its size shows as "7.2 MB"

#### Scenario: Just over the limit
- **WHEN** the file has 5,242,881 bytes
- **THEN** its size shows as "5.1 MB", not "5.0 MB"

### Requirement: Key clash dialog
When the import fails with 409 `CONFLICT` and the field error `key`/`ALREADY_USED`, the import dialog SHALL be replaced by "Choose a different key". Its Key field SHALL be prefilled with the clashing key and show "You already have a board with the key {key}." It SHALL offer "Cancel import" and "Import". Import SHALL be disabled, and the "already used" error SHALL show, while the field holds any key that came back as already used during this import.

#### Scenario: Clash
- **WHEN** the user imports a file with the key `CRD` and already has a board with that key
- **THEN** "Choose a different key" shows with the Key field set to `CRD`, the error "You already have a board with the key CRD." under it, and Import disabled

#### Scenario: Key changed
- **WHEN** the user changes the key from `CRD` to `CRDB`
- **THEN** the error goes away and Import is enabled

#### Scenario: Key changed back
- **WHEN** the user changes the key back to `crd`
- **THEN** the field shows `CRD`, the "already used" error shows again and Import is disabled

#### Scenario: Earlier clashing key
- **WHEN** `CRD` and then `CRDB` clashed and the user types `CRD`
- **THEN** the "already used" error shows and Import is disabled

### Requirement: Key clash text
The clash dialog body SHALL be "Your board “{name}” already uses the key {key}. Enter another key for the imported board." when a board with that key is in the board list data already loaded. Otherwise it SHALL be "One of your boards already uses the key {key}. Enter another key for the imported board." No extra request SHALL be made for the name.

#### Scenario: Board known
- **WHEN** the loaded board list has "Cardigan v1" with the key `CRD`
- **THEN** the body names "Cardigan v1"

#### Scenario: Board not loaded
- **WHEN** no loaded board has the key `CRD`
- **THEN** the body is "One of your boards already uses the key CRD. Enter another key for the imported board."

### Requirement: Key field in the clash dialog
The Key field SHALL follow the New board key field, with its error messages: lowercase letters become uppercase, a key that isn't 2–5 letters A–Z is rejected on the client without an upload, and a server field error for `key` shows under the field. The dialog SHALL stay open on a key error.

#### Scenario: Lowercase input
- **WHEN** the user types `crdb`
- **THEN** the field shows `CRDB`

#### Scenario: Invalid key
- **WHEN** the user submits `C`
- **THEN** a key error shows under the field and nothing is uploaded

#### Scenario: Key error messages
- **WHEN** the user submits an empty key, `C`, `CRDBXY` or `CR1`
- **THEN** the field shows "Enter a key.", "Use at least 2 letters.", "Use at most 5 letters." or "Use only the letters A–Z." and nothing is uploaded

#### Scenario: Unknown key error code
- **WHEN** the retry fails with 400 and a `key` field error code the client doesn't know
- **THEN** the field shows "Use only the letters A–Z." and the dialog stays open

#### Scenario: New key also used
- **WHEN** the retry with `CRDB` fails with 409 and `key`/`ALREADY_USED`
- **THEN** the dialog stays open with "You already have a board with the key CRDB." under the field and Import disabled until the key changes again

### Requirement: Retry with a new key
"Import" in the clash dialog SHALL upload the same file again with the entered key, behind the import progress dialog. "Cancel import" SHALL close every import dialog and import nothing.

#### Scenario: Retry
- **WHEN** the user enters `CRDB` and selects "Import"
- **THEN** the same file is uploaded with the key `CRDB`

#### Scenario: Retry fails without a response
- **WHEN** the retry with `CRDB` fails without a response
- **THEN** the clash dialog is replaced by the import dialog with the file row and "Couldn't import the board. Check your connection and try again.", and `onBoardsChanged` is called

#### Scenario: Cancel
- **WHEN** the user selects "Cancel import"
- **THEN** no dialog is open and no board was created

### Requirement: Import success
After a successful import, every import dialog SHALL close, the user SHALL stay on the board list, the flow SHALL call `onBoardsChanged`, and a success toast SHALL show "Imported “{name}” with the key {key}." using the created board's name and key, also when the key wasn't changed.

#### Scenario: Imported with a new key
- **WHEN** "Cardigan v1" is imported with the key `CRDB`
- **THEN** the toast "Imported “Cardigan v1” with the key CRDB." shows on the board list

#### Scenario: Imported with the file's key
- **WHEN** a file with the key `GARD` is imported without a clash
- **THEN** the toast "Imported “Garden irrigation” with the key GARD." shows and the app doesn't open the board
