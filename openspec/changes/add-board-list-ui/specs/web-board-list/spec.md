# Spec Delta

## Purpose

Defines the web-only behavior of the board list: layout per screen size, phone scrolling, loading, empty and error states, refresh, the New board, Rename board and Delete board dialogs, board menus, the sidebar board section and the phone menu. Shared rules come from `domain-board`, `text-length`, `api-errors` and `api-conventions`.

## ADDED Requirements

### Requirement: Board list layout per size
When the viewport is not a phone, the board list SHALL show boards as a grid of tiles under a header with the title "Boards", the board count, and the Refresh, Import and New board buttons. The grid SHALL fit as many columns as tiles of at least 260 px allow. On a phone it SHALL show boards as a single list of rows under an app bar with the brand, + (New board) and ⋯ (menu) buttons, and no refresh control.

#### Scenario: Desktop
- **WHEN** the board list loads 6 boards in a 1440 px wide viewport
- **THEN** 6 board tiles show in a grid of 4 columns under the header "Boards 6 boards" with Refresh, Import and New board

#### Scenario: Tablet portrait
- **WHEN** the board list loads 6 boards in an 834 px wide viewport
- **THEN** the tiles show in a grid of 2 columns

#### Scenario: Phone
- **WHEN** the board list loads 6 boards on a phone
- **THEN** 6 board rows show in one list, the app bar has + and ⋯, and there is no refresh button

### Requirement: Board order
The board list and the sidebar's board section SHALL show boards in the order the repository returns them, which is the order of `api-conventions` — *Board list order*. The client SHALL NOT sort them again.

#### Scenario: Server order kept
- **WHEN** the repository returns "Raytracer" before "Cardigan v1"
- **THEN** "Raytracer" is listed before "Cardigan v1" in the board list and in the sidebar

### Requirement: Board tile and row content
A board tile SHALL show the key, the name, the card count ("1 card", "{n} cards") and "Updated {relative time}". A phone board row SHALL show the name, the key, the card count and the relative time without "Updated". Each tile and row SHALL have a menu button. Activating a tile or row outside its menu button SHALL open that board.

#### Scenario: Tile text
- **WHEN** a board "Cardigan v1" with the key `CRD` and 12 cards was updated 2 hours ago today
- **THEN** its tile shows `CRD`, "Cardigan v1", "12 cards" and "Updated 2 hours ago"

#### Scenario: Row with one card
- **WHEN** a board with 1 card is shown on a phone
- **THEN** its row shows "1 card"

#### Scenario: Open a board
- **WHEN** the user activates the tile of "Cardigan v1" outside its menu button
- **THEN** the board "Cardigan v1" opens

### Requirement: Board count
Once boards have loaded and at least one exists, the header (or the phone title) SHALL show the count next to "Boards": "1 board" or "{n} boards". On a phone the list SHALL end with the same count below the last row. While loading, in the empty state and in the error state, no count SHALL show.

#### Scenario: Phone list end
- **WHEN** 14 boards are loaded on a phone and the user scrolls to the end
- **THEN** "14 boards" shows below the last row

#### Scenario: One board
- **WHEN** exactly one board is loaded
- **THEN** the count reads "1 board"

#### Scenario: Loading
- **WHEN** the boards are still loading
- **THEN** only "Boards" shows, without a count

### Requirement: Phone title on scroll
On a phone, the large "Boards" title SHALL scroll with the list under the pinned app bar. Once it has scrolled under the bar, the bar SHALL show "Boards" in place of the brand and a divider below the bar. The bar's actions SHALL stay in place.

#### Scenario: At the top
- **WHEN** the phone list is at the top
- **THEN** the bar shows the brand and the large "Boards" title shows below it

#### Scenario: Scrolled
- **WHEN** the user scrolls until the large title is under the bar
- **THEN** the bar shows "Boards" with a divider, and + and ⋯ stay in place

### Requirement: Loading state
While the first load of the boards runs, the board list SHALL show skeleton tiles (tablet and desktop) or skeleton rows (phone) in place of boards. The header actions SHALL stay available.

#### Scenario: First load
- **WHEN** the board list opens and the repository has not answered yet
- **THEN** skeletons show and the New board button can be used

### Requirement: Empty state
When the boards have loaded and there are none, the board list SHALL show the empty state with the title "No boards yet", the text "Create a board to start adding cards, or import a board from a JSON export.", and the buttons New board and Import.

#### Scenario: No boards
- **WHEN** the repository returns no boards
- **THEN** "No boards yet" shows with New board and Import

### Requirement: Load error state
When the first load fails, the board list SHALL show "Couldn't load your boards" with the text "Check your connection and try again." and a "Try again" button. Try again SHALL load the boards again and show the loading state while it runs.

#### Scenario: Load fails
- **WHEN** the first load fails without a response
- **THEN** "Couldn't load your boards" shows with Try again

#### Scenario: Try again succeeds
- **WHEN** the user selects Try again and the load succeeds
- **THEN** the boards show

### Requirement: Refresh
When the viewport is not a phone, the Refresh button SHALL load the boards again. While it runs, the current list SHALL stay visible and the refresh icon SHALL spin. If it fails, the current list SHALL stay and the error toast "Couldn't refresh your boards. Check your connection and try again." SHALL show. In the load error state, Refresh SHALL behave like Try again.

#### Scenario: Refresh succeeds
- **WHEN** the user selects Refresh and another device has added a board
- **THEN** the list stays visible while loading and then includes the new board

#### Scenario: Refresh fails
- **WHEN** the user selects Refresh and the request fails
- **THEN** the previous list stays and the refresh error toast shows

#### Scenario: Phone
- **WHEN** the board list is shown on a phone
- **THEN** there is no way to refresh other than reloading the page or Try again in the load error state

### Requirement: Board menu
The menu of a board tile or row SHALL contain "Rename" and "Delete board", separated by a divider. "Rename" SHALL open the Rename board dialog and "Delete board" the Delete board dialog for that board. The dialog SHALL stay open after the menu closes.

#### Scenario: Open the tile menu
- **WHEN** the user opens the menu of the "Cardigan v1" tile
- **THEN** it shows "Rename" and "Delete board"

### Requirement: New board entry points
The New board dialog SHALL open from the header's New board button, the sidebar's "+ New board", the phone app bar's + button and the empty state's New board button.

#### Scenario: Sidebar
- **WHEN** the user selects "+ New board" in the sidebar
- **THEN** the New board dialog opens

### Requirement: New board dialog
The New board dialog SHALL have the title "New board", a Name field, a Key field with the hint "2–5 uppercase letters. Card IDs will look like {key}-1. The key can't be changed later.", the note "New boards start with the columns To do, In progress and Done.", and the buttons Cancel and "Create board". The Name field SHALL be focused when the dialog opens. The hint SHALL be replaced by the key error while one shows.

#### Scenario: Hint follows the key
- **WHEN** the Key field contains `GARD`
- **THEN** the hint reads "2–5 uppercase letters. Card IDs will look like GARD-1. The key can't be changed later."

### Requirement: Key prefill
While the user has not edited the Key field, it SHALL be filled from the name: the first 4 letters A–Z of the name, uppercased, after removing diacritics, skipping every other character. If that gives fewer than 2 letters, the Key field SHALL be empty. Once the user edits the Key field, it SHALL no longer follow the name until the dialog closes.

#### Scenario: Two words
- **WHEN** the user types "Garden irrigation" as the name
- **THEN** the key is `GARD`

#### Scenario: Diacritics and digits
- **WHEN** the name is "Ärger v2"
- **THEN** the key is `ARGE`

#### Scenario: Too few letters
- **WHEN** the name is "Q3 2026"
- **THEN** the key is empty

#### Scenario: User edited the key
- **WHEN** the user changes the key to `GI` and then edits the name
- **THEN** the key stays `GI`

### Requirement: Key input
Lowercase letters typed into the Key field SHALL show as uppercase. The key SHALL be checked on the client with the rules and messages of the import key clash field (`web-board-transfer` — *Key field in the clash dialog*) before anything is sent.

#### Scenario: Lowercase typing
- **WHEN** the user types `crd`
- **THEN** the field shows `CRD`

#### Scenario: Digit in the key
- **WHEN** the user submits the key `CR1`
- **THEN** "Use only the letters A–Z." shows under the Key field and nothing is sent

### Requirement: Name checks
The name SHALL be normalized and counted as in `text-length` before it is checked or sent. An empty name SHALL show "Enter a name.". A name longer than 100 code points SHALL show "Use at most 100 characters.". A name with a line break or another control character SHALL show "Use a single line without control characters.". Nothing SHALL be sent while a name error applies.

#### Scenario: Whitespace only
- **WHEN** the user submits a name of only spaces
- **THEN** "Enter a name." shows and nothing is sent

#### Scenario: Limit reached after trimming
- **WHEN** the user submits 100 letters surrounded by spaces
- **THEN** no name error shows and the trimmed name is sent

#### Scenario: Too long
- **WHEN** the user submits a name of 101 code points
- **THEN** "Use at most 100 characters." shows

#### Scenario: Pasted line break
- **WHEN** the user pastes "Road\nmap" into the name
- **THEN** "Use a single line without control characters." shows on submit

### Requirement: Local key clash
On submit, the key SHALL be compared with the keys of the boards already loaded. If one matches, the Key field SHALL show "You already have a board with the key {key}." and nothing SHALL be sent. A server 409 with `key`/`ALREADY_USED` SHALL show the same message.

#### Scenario: Key used by a loaded board
- **WHEN** a board with `CRD` is loaded and the user submits a new board with `CRD`
- **THEN** "You already have a board with the key CRD." shows and nothing is sent

#### Scenario: Server reports the clash
- **WHEN** the create request fails with 409 and `key`/`ALREADY_USED` for `GARD`
- **THEN** "You already have a board with the key GARD." shows under the Key field and the dialog stays open

### Requirement: Validation timing
In the New board and Rename board dialogs, field errors SHALL first show when the user submits. After that, they SHALL update while the user types. The primary button SHALL be disabled while a field error shows and while a save runs, and enabled otherwise.

#### Scenario: Typing before the first submit
- **WHEN** the user clears the name before ever submitting
- **THEN** no error shows and "Create board" stays enabled

#### Scenario: Fixing an error
- **WHEN** "Use at least 2 letters." shows and the user types a second letter
- **THEN** the error disappears and "Create board" becomes enabled

### Requirement: Create board result
When the create request succeeds, the dialog SHALL close and the new board SHALL open. No toast SHALL show. Server field errors SHALL show under their fields and keep the dialog open; an unknown `key` error code SHALL show "Use only the letters A–Z.".

#### Scenario: Created
- **WHEN** "Garden irrigation" with `GARD` is created
- **THEN** the dialog closes and the board "Garden irrigation" opens

#### Scenario: Server name error
- **WHEN** the create request fails with 400 and `name`/`TOO_LONG` with `max` 100
- **THEN** "Use at most 100 characters." shows under the Name field

### Requirement: Saving in board dialogs
While a create, rename or delete request runs, the dialog's primary button SHALL show its loading state, its fields and Cancel SHALL be disabled, and Escape or a click outside SHALL NOT close the dialog. The request SHALL NOT be repeated automatically.

#### Scenario: Escape while creating
- **WHEN** the create request is running and the user presses Escape
- **THEN** the dialog stays open and the request continues

### Requirement: Board dialog failures
When a create, rename or delete request fails without a response or with a 5xx, the dialog SHALL stay open with the user's input, and an error toast SHALL show: "Couldn't create the board.", "Couldn't save the board." or "Couldn't delete “{name}”.", each followed by " Check your connection and try again.". After a failed create, the boards SHALL reload in the background.

#### Scenario: Create fails offline
- **WHEN** the create request fails without a response
- **THEN** the dialog stays open, the toast "Couldn't create the board. Check your connection and try again." shows and the boards reload

#### Scenario: Delete fails with 500
- **WHEN** deleting "Cardigan v1" fails with 500
- **THEN** the dialog stays open and the toast "Couldn't delete “Cardigan v1”. Check your connection and try again." shows

### Requirement: Rename board dialog
The Rename board dialog SHALL have the title "Rename board", a Name field filled with the current name and focused, a disabled Key field with the board's key and the hint "The key can't be changed.", and the buttons Cancel and Save. Name checks and validation timing SHALL be the same as in New board.

#### Scenario: Open rename
- **WHEN** the user selects "Rename" for "Cardigan v1" with `CRD`
- **THEN** the dialog shows "Cardigan v1" in Name and `CRD` in the disabled Key field

### Requirement: Rename result
The Rename and Delete board dialogs SHALL report to the screen that opened them whether the board was renamed (with the new board), deleted, or neither. If the normalized name equals the current name, Save SHALL close the dialog without a request. On success, the dialog SHALL close and the board SHALL show the name returned by the repository. If the board no longer exists (404), the dialog SHALL close, the board SHALL disappear from the list and the toast "“{name}” no longer exists." SHALL show.

#### Scenario: Unchanged name
- **WHEN** the user adds a trailing space to "Cardigan v1" and selects Save
- **THEN** the dialog closes and no request is sent

#### Scenario: Renamed
- **WHEN** the user renames "Cardigan v1" to "Cardigan v2"
- **THEN** the dialog closes and the tile shows "Cardigan v2"

#### Scenario: Board deleted elsewhere
- **WHEN** renaming "Cardigan v1" fails with 404 `NOT_FOUND`
- **THEN** the dialog closes, the board disappears and the toast "“Cardigan v1” no longer exists." shows

### Requirement: Delete board dialog
The Delete board dialog SHALL have the title "Delete board “{name}”?", the body "Its 1 card will be deleted too. This can't be undone." or "Its {n} cards will be deleted too. This can't be undone.", or only "This can't be undone." when the board has no cards, and the buttons Cancel and "Delete board" in the destructive style.

#### Scenario: Board with cards
- **WHEN** the user selects "Delete board" for "Cardigan v1" with 12 cards
- **THEN** the dialog reads "Delete board “Cardigan v1”?" and "Its 12 cards will be deleted too. This can't be undone."

#### Scenario: Board without cards
- **WHEN** the board has 0 cards
- **THEN** the body is only "This can't be undone."

### Requirement: Delete result
On success, and also when the delete request fails with 404 `NOT_FOUND`, the dialog SHALL close and the board SHALL disappear from the list and the sidebar. No toast SHALL show.

#### Scenario: Deleted
- **WHEN** the user confirms deleting "Cardigan v1"
- **THEN** the dialog closes and "Cardigan v1" is gone from the list and the sidebar

#### Scenario: Already deleted
- **WHEN** the delete request fails with 404 `NOT_FOUND`
- **THEN** the dialog closes, the board disappears and no error shows

### Requirement: Relative update time
The last update SHALL be shown in the device's local time zone as: "Just now" (under 1 minute or in the future), "1 minute ago" / "{n} minutes ago" (under 1 hour), "1 hour ago" / "{n} hours ago" (same calendar day), "Yesterday" (previous calendar day), "{Mon} {d}" (same year, for example "Oct 9"), otherwise "{Mon} {d}, {yyyy}". The text SHALL NOT update on a timer.

#### Scenario: Earlier today
- **WHEN** it is 15:00 and the board was updated at 12:40 the same day
- **THEN** the time reads "2 hours ago"

#### Scenario: Shortly after midnight
- **WHEN** it is 00:30 and the board was updated at 23:10 the day before
- **THEN** the time reads "Yesterday"

#### Scenario: Under an hour across midnight
- **WHEN** it is 00:10 and the board was updated at 23:50 the day before
- **THEN** the time reads "20 minutes ago"

#### Scenario: Last year
- **WHEN** it is 2026 and the board was updated on 9 October 2025
- **THEN** the time reads "Oct 9, 2025"

#### Scenario: Clock behind the server
- **WHEN** the update time is 30 seconds in the future
- **THEN** the time reads "Just now"

### Requirement: Sidebar board section
When the viewport is not a phone, the sidebar SHALL show "All boards" (current while the board list is open) and list every board under "BOARDS" with its name and key, in board list order, followed by "+ New board". While loading, the section SHALL show no rows; when empty or in the load error state, only "+ New board". The footer SHALL show the user's email, hidden while unknown, and a log out button.

#### Scenario: Boards loaded
- **WHEN** 6 boards are loaded on desktop
- **THEN** the sidebar lists the 6 boards with their keys and then "+ New board"

#### Scenario: Load error
- **WHEN** the first load fails
- **THEN** the sidebar's board section shows only "+ New board"

#### Scenario: Email not known yet
- **WHEN** the page was reloaded and the session's email is still loading
- **THEN** the sidebar footer shows no email, and shows it once it is known

### Requirement: Phone menu
On a phone, the app bar's ⋯ menu SHALL show "Signed in as {email}" at the top, then "Import board", "Labels", a divider and "Log out". While the email is unknown, the "Signed in as" line SHALL be hidden. "Import board" SHALL open the import dialog, "Labels" SHALL open the labels page, and "Log out" SHALL log out without a confirmation.

#### Scenario: Open the phone menu
- **WHEN** the user signed in as `philipp@example.com` opens ⋯ on a phone
- **THEN** the menu shows "Signed in as philipp@example.com", "Import board", "Labels" and "Log out"

#### Scenario: Log out
- **WHEN** the user selects "Log out"
- **THEN** the user is logged out without a confirmation dialog

#### Scenario: Email not known yet
- **WHEN** the user opens ⋯ while the session's email is still loading
- **THEN** the menu starts with "Import board"

### Requirement: Accessible names
Icon-only controls SHALL have these accessible names: the tile and row menu buttons "Actions for board “{name}”", the phone ⋯ button "Menu", the phone + button "New board", the Refresh button "Refresh", the sidebar log out button "Log out".

#### Scenario: Tile menu button
- **WHEN** a screen reader reaches the menu button of the "Cardigan v1" tile
- **THEN** it announces "Actions for board “Cardigan v1”"

### Requirement: Sizes without their own frame
Sizes without their own Figma frame SHALL use the nearest drawn variant: dialogs on a phone SHALL follow "New board · Phone 390" (full-width buttons side by side), and tablet SHALL follow desktop.

#### Scenario: Rename on a phone
- **WHEN** the user opens Rename board on a phone
- **THEN** the dialog uses the phone dialog layout of New board

#### Scenario: Empty state on tablet
- **WHEN** there are no boards on an 834 px wide tablet
- **THEN** the empty state looks like the desktop frame next to the tablet sidebar
