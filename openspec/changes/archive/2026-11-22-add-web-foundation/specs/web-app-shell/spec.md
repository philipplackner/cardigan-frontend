# Spec Delta

## Purpose

Defines which web pages render inside the app shell, how each page fills the shell's regions, what the app shows at unknown URLs, while a page loads or when it fails, and when server data is reloaded.

## ADDED Requirements

### Requirement: Signed-in pages render inside the app shell
Every page for a signed-in user SHALL render inside the app shell, with the regions from `web-design-system` "Layout regions per breakpoint". The log in and register pages SHALL render without the shell.

#### Scenario: Board list on desktop
- **WHEN** the user opens `/` on a 1440 px wide viewport
- **THEN** the page shows the sidebar and the main area

#### Scenario: Log in page
- **WHEN** the user opens the log in page
- **THEN** no sidebar and no app shell top bar are shown

### Requirement: The shell stays in place between pages
Moving between pages inside the shell SHALL keep the shell mounted. Only the main area and the phone top bar SHALL change.

#### Scenario: Sidebar scroll position is kept
- **WHEN** the user has scrolled the sidebar and opens another page from it
- **THEN** the sidebar keeps its scroll position

### Requirement: Each page provides its phone top bar
On a phone, the top bar SHALL show the bar that the current page provides. The top bar SHALL stay outside the scrolling main area. When the current page provides no bar, no top bar SHALL be shown.

#### Scenario: Page with its own bar
- **WHEN** a page that provides a top bar is open on a phone and the user scrolls its content
- **THEN** that page's bar is shown and stays at the top

#### Scenario: Page without a bar
- **WHEN** a page that provides no top bar is open on a phone
- **THEN** no top bar is shown

### Requirement: Unknown URLs show a blank page
A URL that matches no page SHALL show a blank page and SHALL keep the URL the user entered. There SHALL be no redirect.

#### Scenario: Unknown path
- **WHEN** the user opens `/does-not-exist`
- **THEN** a blank page is shown and the address bar still shows `/does-not-exist`

### Requirement: Loading and failed pages show a blank main area
While a page inside the shell is still loading, and when it fails to load or render, its main area SHALL be blank and the shell SHALL stay usable. In development builds a failure SHALL be logged to the browser console. Production builds SHALL NOT log it.

#### Scenario: Page fails to render
- **WHEN** a page inside the shell throws while rendering
- **THEN** the `main` element is empty, the sidebar with the brand is still rendered, and navigating to `/` afterwards renders the index page inside the same shell

#### Scenario: Failure in development
- **WHEN** a page fails in a development build
- **THEN** the error is logged to the browser console

### Requirement: Server data reloads only on intent
Server data the web app has loaded SHALL stay on screen until the user refreshes it, changes it, or reloads the browser page. The app SHALL NOT reload it when the tab regains focus or when the network comes back. A page opened again SHALL reuse the loaded data while it is kept; data no page has used for 5 minutes SHALL be dropped and loaded again when needed.

#### Scenario: Back to the tab
- **WHEN** the user switches to another tab and back to the app
- **THEN** no request is sent to reload the shown data

#### Scenario: Revisiting a page soon
- **WHEN** the user leaves a page and opens it again within 5 minutes
- **THEN** the page shows the data loaded before without a new request

#### Scenario: Revisiting a page later
- **WHEN** the user opens a page again after no page used its data for more than 5 minutes
- **THEN** the data is loaded again

### Requirement: Failed requests are not retried automatically
A request for server data or a change that fails SHALL NOT be repeated automatically. A request made while the browser is offline SHALL be sent at once and SHALL NOT be held to be sent when the network returns.

#### Scenario: Load fails
- **WHEN** loading a page's data fails
- **THEN** exactly one request was sent

#### Scenario: Change made offline
- **WHEN** the browser is offline and the user starts a change
- **THEN** the request fails at once, and no request is sent when the network comes back
