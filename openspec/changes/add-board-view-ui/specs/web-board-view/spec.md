# Spec Delta

## Purpose

Defines the web-only behavior of the board screen: layout per screen size, header and loading, error and empty states, quick add, add column, the column and board menus, refresh, how saves wait and fail, and recovery from stale data. Shared rules come from `domain-board`, `domain-column`, `domain-card`, `domain-ordering`, `text-length`, `api-conventions` and `api-errors`.

## ADDED Requirements

### Requirement: Board content area
The board view SHALL render only the content area of the app shell for one board, identified by the board ID in the URL. The sidebar and the phone menu are not part of it. Tablet SHALL use the desktop layout of every state.

#### Scenario: Opening a board
- **WHEN** the user opens the URL of the board "Cardigan v1"
- **THEN** the content area shows that board's header and columns next to the shell's sidebar

#### Scenario: Tablet
- **WHEN** the viewport is 834 px wide
- **THEN** every board view state uses the desktop layout

### Requirement: Board header on tablet and desktop
When the viewport is not a phone, the header SHALL show the board name, the key and the card count, followed by a refresh button and a board menu button. The count SHALL use real plurals ("1 card", "12 cards") and SHALL be left out when the board has no cards.

#### Scenario: Board with cards
- **WHEN** the board "Cardigan v1" with the key `CRD` and 12 cards is shown at 1440 px
- **THEN** the header shows "Cardigan v1", `CRD`, "12 cards", the refresh button and the board menu button

#### Scenario: One card
- **WHEN** the board has exactly one card
- **THEN** the count reads "1 card"

#### Scenario: No cards
- **WHEN** the board has no cards
- **THEN** the header shows the name and key without a count

### Requirement: Board app bar on phones
On a phone, the app bar SHALL show a back button that goes to the board list, the board name, a subtitle with the key and the card count ("CRD · 12 cards"), and the board menu button. The count SHALL be left out of the subtitle when the board has no cards. There SHALL be no refresh control on a phone.

#### Scenario: Phone app bar
- **WHEN** the board "Cardigan v1" with 12 cards is shown on a phone
- **THEN** the app bar shows back, "Cardigan v1", "CRD · 12 cards" and the board menu button, and no refresh button

#### Scenario: Back
- **WHEN** the user taps back in the app bar
- **THEN** the board list opens

### Requirement: Columns layout
Columns SHALL be shown side by side in ascending position order, each with its name, its card count and a column menu button. The column row SHALL scroll horizontally when it is wider than the content area. On a phone, columns SHALL be 300 px wide and scroll freely without snapping.

#### Scenario: Column order
- **WHEN** a board has the columns "Done", "To do" and "In progress" at positions 2, 0 and 1
- **THEN** they are shown as "To do", "In progress", "Done" from left to right

#### Scenario: Phone swipe
- **WHEN** a board with four columns is shown on a phone and the user swipes sideways
- **THEN** the columns scroll and stop wherever the swipe ends

### Requirement: Card tiles
Each column SHALL show its cards in ascending position order. Each tile SHALL show the card's display ID, its title and its labels sorted as defined in `domain-card`. A tile without labels SHALL show no label row.

#### Scenario: Tile content
- **WHEN** card 118 of the board `CRD` has the title "Decide card ordering" and the labels `frontend`, `Bug` and `api`
- **THEN** its tile shows `CRD-118`, the title, and the labels `api`, `Bug`, `frontend`

### Requirement: Opening a card
Activating a card tile with a click, a tap, Enter or Space SHALL hand the card's identifier to the app layer to open the card. The board view itself SHALL NOT change.

#### Scenario: Keyboard
- **WHEN** a card tile has focus and the user presses Enter
- **THEN** the app layer is asked to open that card

### Requirement: Loading state
While the board loads for the first time, the content area SHALL show skeleton columns and cards. The header SHALL show the board name and key from the board list data when that board is in it, and no title otherwise. The refresh button SHALL show; the board menu and card count SHALL NOT.

#### Scenario: Board known from the list
- **WHEN** the user opens "Cardigan v1" from the sidebar and the board is still loading
- **THEN** the header shows "Cardigan v1" and `CRD`, and the content area shows skeleton columns

#### Scenario: Deep link before the list loads
- **WHEN** the user opens a board URL directly and neither the board nor the board list has loaded yet
- **THEN** the header shows no title and the content area shows skeleton columns

### Requirement: Load error state
When the first load fails for any reason other than a 404, the content area SHALL show "Couldn’t load this board", "Check your connection and try again." and a "Try again" button. "Try again" and the refresh button SHALL load the board again.

#### Scenario: Network failure
- **WHEN** the first load of the board fails without a response
- **THEN** "Couldn’t load this board" shows with "Try again"

#### Scenario: Try again succeeds
- **WHEN** the user presses "Try again" and the load succeeds
- **THEN** the board's columns are shown

### Requirement: Board no longer exists
When loading the board, or any change to it, ends in a 404 for the board itself, the web app SHALL go to the board list and show the error toast "This board no longer exists."

#### Scenario: Deleted on another device
- **WHEN** the user opens a board that another device deleted
- **THEN** the board list opens and the toast "This board no longer exists." shows

### Requirement: Empty column
A column without cards SHALL show the placeholder "No cards yet" above its "Add card" button.

#### Scenario: New board
- **WHEN** a new board with the default columns "To do", "In progress" and "Done" is shown
- **THEN** each column shows "No cards yet" and "Add card"

### Requirement: Board without columns
A board with zero columns SHALL show "This board has no columns", "Add a column to start adding cards." and an "Add column" button in place of the columns. The button SHALL open the add column form in place of this empty state.

#### Scenario: Last column deleted
- **WHEN** the user deletes the only column of a board
- **THEN** the board shows "This board has no columns" with "Add column"

#### Scenario: Add from the empty state
- **WHEN** the user presses "Add column" in the empty state
- **THEN** the add column form opens with focus in its name field

### Requirement: Opening quick add
"Add card" at the bottom of a column SHALL replace itself with the quick add form: a title field with focus, an "Add card" button and "Cancel". Desktop and tablet SHALL also show the hint "Enter to add". At most one quick add form SHALL be open on the board; opening one closes any other and drops its text.

#### Scenario: Open
- **WHEN** the user presses "Add card" in "To do"
- **THEN** the quick add form opens at the bottom of "To do" with focus in the title field

#### Scenario: Second column
- **WHEN** a quick add form with the text "Write docs" is open in "To do" and the user presses "Add card" in "Done"
- **THEN** the form in "To do" closes without creating a card, and an empty form opens in "Done"

### Requirement: Adding a card
Pressing Enter in the title field or the form's "Add card" button SHALL create a card with the normalized title at the end of the column. When the card is created, it SHALL appear at the end of the column, and the field SHALL stay open, empty and focused. Enter on an empty or whitespace-only title SHALL do nothing.

#### Scenario: Add two cards in a row
- **WHEN** the user types "Write docs", presses Enter, then types "Fix login" and presses Enter
- **THEN** both cards appear at the end of the column in that order, and the field is open and empty

#### Scenario: Whitespace only
- **WHEN** the title field contains only spaces and the user presses Enter
- **THEN** no card is created and no error shows

### Requirement: Closing quick add
Escape and "Cancel" SHALL close the quick add form and drop its text. A click or focus move outside the form SHALL close it when the field is empty and SHALL keep it open with its text otherwise.

#### Scenario: Escape with text
- **WHEN** the title field contains "Write docs" and the user presses Escape
- **THEN** the form closes and the text is gone

#### Scenario: Click outside with text
- **WHEN** the title field contains "Write docs" and the user clicks elsewhere on the board
- **THEN** the form stays open with "Write docs"

#### Scenario: Click outside when empty
- **WHEN** the title field is empty and the user clicks elsewhere on the board
- **THEN** the form closes

### Requirement: Adding a column
"Add column" after the last column SHALL open an inline form with a "Name" field, an "Add column" button and "Cancel". Submitting a valid name SHALL create the column at the end. The form SHALL then close, the new column SHALL scroll into view and focus SHALL move to its "Add card". Escape and "Cancel" SHALL close the form.

#### Scenario: Add a column
- **WHEN** the user opens the add column form, types "Review" and presses Enter
- **THEN** a column "Review" appears after the last column, is scrolled into view, and its "Add card" has focus

#### Scenario: Duplicate name
- **WHEN** the board has a column "Review" and the user adds another column "Review"
- **THEN** both columns exist

### Requirement: Column menu
Each column's menu SHALL offer "Move left", "Move right", "Rename" and "Delete column". "Move left" SHALL be disabled on the first column and "Move right" on the last.

#### Scenario: First column
- **WHEN** the user opens the menu of the first column
- **THEN** "Move left" is disabled and the other items are enabled

#### Scenario: Only column
- **WHEN** the board has one column and the user opens its menu
- **THEN** "Move left" and "Move right" are both disabled

### Requirement: Moving a column
"Move left" and "Move right" SHALL move the column one position and SHALL wait for the server. The columns SHALL show the new order only when the move succeeds. While a column move runs, the move items of every column menu on the board SHALL be disabled.

#### Scenario: Move right
- **WHEN** the board has "To do", "In progress", "Done" and the user chooses "Move right" on "To do"
- **THEN** after the move succeeds the columns are "In progress", "To do", "Done"

#### Scenario: Move fails
- **WHEN** the move of "To do" fails without a response
- **THEN** the columns keep their order and the error toast "Couldn't move “To do”. Check your connection and try again." shows

### Requirement: Renaming a column
"Rename" SHALL open the "Rename column" dialog with a "Name" field holding the current name, "Cancel" and "Save". Saving a valid, different name SHALL rename the column and close the dialog. Saving a name that is unchanged after normalization SHALL close the dialog without a request.

#### Scenario: Rename
- **WHEN** the user renames "Review" to "In review" and presses Save
- **THEN** the dialog closes and the column is called "In review"

#### Scenario: Unchanged
- **WHEN** the dialog for "Review" is saved with " Review "
- **THEN** the dialog closes and no change is sent

### Requirement: Deleting a column
"Delete column" SHALL open a confirmation dialog. For a column with cards it SHALL read "Delete column “{name}”?", "Its {n} cards will be deleted too. This can’t be undone." and "Delete column and {n} cards", with real plurals. For an empty column it SHALL read "Delete column “{name}”?", "This can’t be undone." and "Delete column". A 404 on delete SHALL count as deleted.

#### Scenario: Column with cards
- **WHEN** the user chooses "Delete column" on "Review" with 2 cards
- **THEN** the dialog reads "Delete column “Review”?", "Its 2 cards will be deleted too. This can’t be undone." and offers "Delete column and 2 cards"

#### Scenario: Column with one card
- **WHEN** the column "Review" has 1 card
- **THEN** the dialog reads "Its 1 card will be deleted too. This can’t be undone." and offers "Delete column and 1 card"

#### Scenario: Empty column
- **WHEN** the user chooses "Delete column" on an empty column "Review"
- **THEN** the dialog reads "Delete column “Review”?" and "This can’t be undone." and offers "Delete column"

#### Scenario: Already deleted elsewhere
- **WHEN** the user confirms and the delete returns 404
- **THEN** the dialog closes, the column is gone and no error shows

### Requirement: Board menu
The board menu SHALL offer "Rename board", "Export as JSON" and "Delete board". "Rename board" and "Delete board" SHALL open the same dialogs as in the board list. After a rename, the header SHALL show the new name. After a delete, the board list SHALL open. "Export as JSON" SHALL start the board export.

#### Scenario: Rename from the board view
- **WHEN** the user renames the board to "Cardigan v2" from the board menu
- **THEN** the header shows "Cardigan v2"

#### Scenario: Delete from the board view
- **WHEN** the user deletes the board from the board menu
- **THEN** the board list opens

### Requirement: Refresh
On tablet and desktop, the refresh button SHALL load the board again and spin while it loads. The current board SHALL stay visible, and an open quick add form SHALL keep its text. If the refresh fails, the board SHALL stay and the error toast "Couldn't refresh the board. Check your connection and try again." SHALL show.

#### Scenario: Refresh shows changes from another device
- **WHEN** another device added a card and the user presses refresh
- **THEN** the new card appears and the rest of the board stays in place

#### Scenario: Refresh with an open quick add
- **WHEN** the quick add field contains "Write docs" and the user presses refresh
- **THEN** after the refresh the field still contains "Write docs"

#### Scenario: Refresh fails
- **WHEN** the refresh fails without a response
- **THEN** the board stays as it was and the refresh error toast shows

### Requirement: Name and title validation
Column names and card titles SHALL be normalized and counted as in `text-length`. Errors SHALL show under the field on the first submit and then update while typing. Messages: "Enter a name." (empty), "Use at most {n} characters." (over 30 for names, 200 for titles), "Use a single line without control characters." (line breaks or control characters).

#### Scenario: Empty name
- **WHEN** the user submits the add column form with an empty name
- **THEN** "Enter a name." shows under the field and no request is sent

#### Scenario: Too long
- **WHEN** the user submits a column name with a normalized length of 31
- **THEN** "Use at most 30 characters." shows under the field

#### Scenario: Error clears while typing
- **WHEN** "Use at most 30 characters." shows and the user deletes characters until the name has 30
- **THEN** the error disappears without another submit

#### Scenario: Pasted line break in a title
- **WHEN** the user pastes "Fix\nlogin" into quick add and presses Enter
- **THEN** "Use a single line without control characters." shows and no card is created

### Requirement: Server field errors
A field error returned for a name or title SHALL show under that field with the message for its code, and the form or dialog SHALL stay open. An unknown field error code SHALL show the control-character message.

#### Scenario: Server rejects a name
- **WHEN** a rename returns 400 with a field error for `name` with the code `TOO_LONG` and `max` 30
- **THEN** "Use at most 30 characters." shows under the field and the dialog stays open

### Requirement: Saving state
While a column add, rename or delete, or a card add, is saving, the submit button SHALL show a spinner, the fields and "Cancel" SHALL be disabled, and Escape or a click outside SHALL NOT close the dialog or form. The submit button SHALL be disabled only while a validation error shows or a save runs. A success SHALL show no toast.

#### Scenario: Escape while saving
- **WHEN** a rename is saving and the user presses Escape
- **THEN** the dialog stays open

#### Scenario: Success
- **WHEN** a column is renamed successfully
- **THEN** no toast shows

### Requirement: Save failures
When a save fails without a response, with a 5xx or with an unknown error, the dialog or form SHALL stay open with its input and an error toast SHALL show: "Couldn't add the card.", "Couldn't add the column.", "Couldn't rename “{name}”.", "Couldn't move “{name}”." or "Couldn't delete “{name}”.", each followed by " Check your connection and try again."

#### Scenario: Add card fails
- **WHEN** adding the card "Write docs" fails without a response
- **THEN** the quick add field still contains "Write docs" and the toast "Couldn't add the card. Check your connection and try again." shows

#### Scenario: Delete fails
- **WHEN** deleting the column "Review" fails with 500
- **THEN** the dialog stays open and the toast "Couldn't delete “Review”. Check your connection and try again." shows

### Requirement: Saves apply the response
Every successful change SHALL update the shown board from the change's response, without loading the whole board again. A column move SHALL apply the positions of all columns from its response.

#### Scenario: Column added
- **WHEN** a column is added successfully
- **THEN** it appears without another board load

### Requirement: Stale data recovery
When a change returns 404 for a column or `OUT_OF_RANGE` for a move, the web app SHALL load the board again and show an error toast. A missing column SHALL show "“{name}” no longer exists. The board was reloaded." A stale column move SHALL show "Couldn't move “{name}”. The board changed on another device, so it was reloaded."

#### Scenario: Card added to a deleted column
- **WHEN** the user adds a card to "Review", which another device deleted, and the request returns 404
- **THEN** the board loads again without "Review" and the toast "“Review” no longer exists. The board was reloaded." shows

#### Scenario: Stale column move
- **WHEN** the board shows 4 columns, another device deleted one, and "Move right" on the third column returns `OUT_OF_RANGE`
- **THEN** the board loads again and the toast "Couldn't move “{name}”. The board changed on another device, so it was reloaded." shows

#### Scenario: Board gone during recovery
- **WHEN** the reload after a stale change returns 404 for the board
- **THEN** the board list opens and the toast "This board no longer exists." shows
