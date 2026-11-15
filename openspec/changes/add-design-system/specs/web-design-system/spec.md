# Spec Delta

## Purpose

Defines the web-only behavior of the Cardigan design system: how theme, sizes and layout respond to the device and user settings, how components behave where Figma doesn't draw it, and how the components are previewed during development.

## ADDED Requirements

### Requirement: Theme follows the system color scheme
The web app SHALL show the light theme when the operating system or browser prefers a light color scheme and the dark theme when it prefers dark. It SHALL switch without a reload when that preference changes. There SHALL be no in-app theme switch.

#### Scenario: System switches to dark
- **WHEN** the app is open and the system color scheme changes from light to dark
- **THEN** every surface, text, border and label color changes to its Figma Dark mode value without a reload

#### Scenario: No preference
- **WHEN** the browser reports no color scheme preference
- **THEN** the light theme is shown

### Requirement: Phone condition
The web app SHALL treat a viewport as a phone when it is narrower than 640 CSS px or lower than 480 CSS px. Every phone-specific behavior in this spec SHALL use this one condition.

#### Scenario: Narrow viewport
- **WHEN** the viewport is 390 px wide and 844 px high
- **THEN** it is a phone

#### Scenario: Phone in landscape
- **WHEN** the viewport is 844 px wide and 390 px high
- **THEN** it is a phone

#### Scenario: Tablet portrait
- **WHEN** the viewport is 834 px wide and 1194 px high
- **THEN** it is not a phone

### Requirement: Touch sizes on phones
Components that have Default and Touch size variants in Figma SHALL use the Touch variant on a phone and the Default variant otherwise, without the screen choosing a size.

#### Scenario: Button on a phone
- **WHEN** a button is shown on a phone
- **THEN** it has the Touch size from Figma

#### Scenario: Button on desktop
- **WHEN** the same button is shown in a 1440 px wide viewport
- **THEN** it has the Default size from Figma

### Requirement: Layout regions per breakpoint
The app layout SHALL show a top app bar and no sidebar on a phone, a 224 px sidebar from 640 px wide, and a 248 px sidebar from 1024 px wide. An open side panel SHALL be 420 px wide on tablet, 452 px on desktop, and fill the screen on a phone.

#### Scenario: Tablet portrait with side panel
- **WHEN** the viewport is 834 px wide, not a phone, and a side panel is open
- **THEN** the sidebar is 224 px wide and the side panel is 420 px wide

#### Scenario: Desktop with side panel
- **WHEN** the viewport is 1440 px wide and a side panel is open
- **THEN** the sidebar is 248 px wide and the side panel is 452 px wide

#### Scenario: Phone with side panel
- **WHEN** the viewport is a phone and a side panel is open
- **THEN** the panel covers the whole viewport and no sidebar is shown

### Requirement: Text follows the user's text size
All text SHALL scale with the browser's default font size and page zoom. Control heights from Figma SHALL act as minimum heights so controls grow to fit larger text. Single-line labels that no longer fit SHALL be truncated with an ellipsis instead of wrapping.

#### Scenario: Larger default font size
- **WHEN** the browser's default font size is raised from 16 px to 24 px
- **THEN** text is 1.5 times its Figma size and buttons and inputs grow taller so their text is not clipped

#### Scenario: Long single-line label
- **WHEN** a navigation item's name is longer than the available width
- **THEN** it is shown on one line, cut off with an ellipsis

### Requirement: Visible keyboard focus
Every interactive component SHALL show the Figma focus ring when it receives focus from the keyboard. Inputs and text areas in error SHALL show the danger focus ring. Focus from a mouse click SHALL NOT show the ring on buttons.

#### Scenario: Tab to a button
- **WHEN** the user presses Tab until a button has focus
- **THEN** the button shows the accent focus ring

#### Scenario: Focus an input in error
- **WHEN** an input in its error state receives focus
- **THEN** it shows the danger focus ring

### Requirement: Hover feedback
On devices with hover, primary buttons SHALL change to the accent hover color, and secondary buttons, ghost buttons and icon buttons SHALL show the hover background. Danger and danger ghost buttons SHALL NOT change on hover. Disabled controls SHALL NOT change on hover.

#### Scenario: Hover a primary button
- **WHEN** the pointer moves over an enabled primary button
- **THEN** its background changes to the accent hover color

#### Scenario: Hover a danger button
- **WHEN** the pointer moves over an enabled danger button
- **THEN** its look does not change

### Requirement: Loading buttons
A button in its loading state SHALL show the spinner in place of its leading icon, SHALL NOT trigger its action when activated, and SHALL be reported as busy to assistive technology.

#### Scenario: Activate a loading button
- **WHEN** the user clicks or presses Enter on a button that is loading
- **THEN** its action does not run and the spinner keeps showing

### Requirement: Icon-only controls have an accessible name
Every icon-only control SHALL have an accessible name supplied by the screen that uses it. Icons next to visible text SHALL be hidden from assistive technology.

#### Scenario: Icon button read by a screen reader
- **WHEN** a screen reader reaches an icon button whose screen labels it "Close"
- **THEN** it announces a button named "Close"

### Requirement: Toast behavior
Toasts SHALL appear at the bottom center of the viewport. A success toast SHALL close by itself after 4 seconds. An error toast SHALL stay until the user closes it. Only one toast SHALL be visible; showing a new toast SHALL replace the current one. Every toast SHALL have a close button.

#### Scenario: Success toast
- **WHEN** a success toast is shown and the user does nothing
- **THEN** it closes after 4 seconds

#### Scenario: Error toast
- **WHEN** an error toast is shown and the user does nothing for a minute
- **THEN** it is still visible

#### Scenario: Second toast
- **WHEN** a toast is visible and another toast is shown
- **THEN** the first one disappears and only the new one is visible

### Requirement: Modal overlays and keyboard
Dialogs and bottom sheets SHALL keep keyboard focus inside while open, close on Escape or on a click on the scrim, and return focus to the element that opened them. Menus and popovers SHALL close on Escape or an outside click and return focus to their trigger.

#### Scenario: Escape in a dialog
- **WHEN** a dialog is open and the user presses Escape
- **THEN** the dialog closes and focus returns to the control that opened it

#### Scenario: Tab inside a dialog
- **WHEN** focus is on the last control of an open dialog and the user presses Tab
- **THEN** focus moves to the first control of the dialog

### Requirement: Progress dialog cannot be dismissed
A dialog in its Progress type SHALL NOT close on Escape, on a click on the scrim, or through a close control. It SHALL close only when the screen that opened it ends the progress.

#### Scenario: Escape during progress
- **WHEN** a progress dialog is open and the user presses Escape
- **THEN** the dialog stays open

### Requirement: Bottom sheet
A bottom sheet SHALL slide in from the bottom edge on a phone and close on a scrim tap, Escape, or its close action. It SHALL NOT respond to dragging.

#### Scenario: Tap the scrim
- **WHEN** a bottom sheet is open and the user taps the scrim above it
- **THEN** the sheet closes

### Requirement: Text areas grow with their content
Title and Multi-line text areas SHALL grow in height to show all their text without an inner scrollbar. A Description text area SHALL grow until the panel body it sits in scrolls.

#### Scenario: Long card title
- **WHEN** the user types a title that wraps to three lines
- **THEN** the Title text area is three lines high and all text is visible

### Requirement: Skeleton shimmer
Skeleton placeholders SHALL show a shimmer moving from the skeleton color to the skeleton highlight color, about 1.2 seconds per cycle. When the user prefers reduced motion, skeletons SHALL be static.

#### Scenario: Reduced motion
- **WHEN** the operating system's reduced motion setting is on
- **THEN** skeletons show the skeleton color without animation

### Requirement: Label palette
The design system SHALL offer exactly the 20 label colors from the `domain-label` palette, each with a Light and a Dark value from Figma. Label dot, Label, Label chip and Swatch SHALL accept only these color names.

#### Scenario: Label in dark theme
- **WHEN** a label with the color `Teal` is shown in the dark theme
- **THEN** its dot uses the Figma Dark mode value of `label/teal`

### Requirement: File drop zone
The drop zone SHALL show its Over state while a file is dragged over it, SHALL hand dropped files to the screen, and SHALL let keyboard and pointer users choose a file through the system file picker.

#### Scenario: Drag a file over
- **WHEN** the user drags a file over the drop zone
- **THEN** it shows the Over state, and returns to Default when the file leaves without being dropped

#### Scenario: Choose with the keyboard
- **WHEN** the user tabs to the drop zone's browse control and presses Enter
- **THEN** the system file picker opens

### Requirement: Dev-only component preview
In development, a preview page SHALL show every design system component with each Figma variant, size and meaningful state, in the active system theme. The production build SHALL NOT contain the preview page or its code.

#### Scenario: Production build
- **WHEN** the app is built for production
- **THEN** the build output contains no preview page and no preview code

#### Scenario: Development server
- **WHEN** a developer opens the preview page on the dev server
- **THEN** every component is shown with all its variants and states
