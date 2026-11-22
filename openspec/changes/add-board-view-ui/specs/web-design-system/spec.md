# Spec Delta

## MODIFIED Requirements

### Requirement: Modal overlays and keyboard
Dialogs and bottom sheets SHALL keep keyboard focus inside while open, close on Escape or on a click on the scrim (except Progress dialogs, see below), and return focus to the element that opened them. A dialog MAY opt out of returning focus when the screen moves focus to another element itself, as the board view's discard dialog does. Menus and popovers SHALL close on Escape or an outside click and return focus to their trigger.

#### Scenario: Escape in a dialog
- **WHEN** a dialog is open and the user presses Escape
- **THEN** the dialog closes and focus returns to the control that opened it

#### Scenario: Tab inside a dialog
- **WHEN** focus is on the last control of an open dialog and the user presses Tab
- **THEN** focus moves to the first control of the dialog

#### Scenario: Dialog that opts out of returning focus
- **WHEN** a dialog that opts out of returning focus closes and the screen focuses another field
- **THEN** focus stays on that field and does not move to the control that opened the dialog
