# web-auth Specification

## Purpose
Defines the web-only behavior of logging in, registering and logging out: the field rules and when their errors show, loading states, where errors appear and what they say, the session expired state, and how the app shell gets the user's email and log out. Shared rules come from `domain-user`, `text-length`, `api-errors` and `api-auth-tokens`.

## Requirements

### Requirement: Log in form
The log in screen SHALL show the title "Log in to Cardigan", an Email field, a Password field, a "Log in" button and the line "No account yet? Create one", where "Create one" opens register. The email field SHALL be single-line and offer saved emails. The password field SHALL hide its text, offer saved passwords and allow pasting.

#### Scenario: Empty log in screen
- **WHEN** the user opens the log in screen without the session expired flag
- **THEN** the screen shows the title, the two empty fields, the "Log in" button, the register link and no banner

#### Scenario: Paste a password
- **WHEN** the user pastes text into the password field
- **THEN** the text is entered, hidden

### Requirement: Log in checks only for filled-in fields
Before sending, the log in form SHALL check only that the email is not empty after `text-length` normalization and that the password is not `""`. It SHALL NOT check the email format or any length. Empty fields SHALL show "Enter your email." and "Enter your password." A password of only spaces SHALL count as filled in.

#### Scenario: Malformed email is sent
- **WHEN** the user logs in with the email `ann@` and a password
- **THEN** the request is sent

#### Scenario: Whitespace email
- **WHEN** the user submits the log in form with the email `"   "`
- **THEN** no request is sent and the email field shows "Enter your email."

#### Scenario: Spaces as password
- **WHEN** the user submits the log in form with a filled-in email and the password `"   "`
- **THEN** the request is sent

### Requirement: Register form
The register screen SHALL show the title "Create your account", Email, Password and Repeat password fields, a "Create account" button and the line "Already have an account? Log in", where "Log in" opens log in. The password fields SHALL hide their text and allow pasting. The password and repeat fields SHALL let password managers suggest a new password.

#### Scenario: Empty register screen
- **WHEN** the user opens the register screen
- **THEN** it shows the three empty fields, the four password rules as not met, the "Create account" button and the log in link

### Requirement: Live password rules
Under the register password field, four rules SHALL show: "12+ characters", "Lowercase letter", "Uppercase letter" and "Digit". Each SHALL show a cross until it is met, then a check, and SHALL update on every keystroke from the first one, before the field loses focus. Each rule SHALL also state "met" or "not met" in text for screen readers.

#### Scenario: Typing updates rules
- **WHEN** the user types `abcdefghijkl` into the empty password field
- **THEN** "12+ characters" and "Lowercase letter" show a check, and "Uppercase letter" and "Digit" show a cross

#### Scenario: Non-ASCII characters count
- **WHEN** the password is `äöüÄÖÜ١٢٣ßßßß`
- **THEN** all four rules show a check

#### Scenario: Length counts code points
- **WHEN** the password is ten ASCII letters and digits with a lowercase letter, an uppercase letter and a digit, followed by U+1F600 (😀)
- **THEN** "12+ characters" shows a cross

#### Scenario: Twelve code points with an emoji
- **WHEN** the password is eleven ASCII letters and digits with a lowercase letter, an uppercase letter and a digit, followed by U+1F600
- **THEN** "12+ characters" shows a check

#### Scenario: Emoji with a modifier counts as two
- **WHEN** the password is ten ASCII letters and digits with a lowercase letter, an uppercase letter and a digit, followed by 👍🏽 (U+1F44D U+1F3FD)
- **THEN** "12+ characters" shows a check

### Requirement: Register email check
Before sending, the register form SHALL check that the email is filled in, contains no character forbidden by `text-length`, has a normalized length of at most 254 and has a valid `domain-user` email format, in that order. It SHALL show only the first error: "Enter your email.", "Enter a valid email address." (forbidden character), "Email can't be longer than 254 characters." or "Enter a valid email address." (format).

#### Scenario: Missing domain
- **WHEN** the user submits the register form with the email `ann@`
- **THEN** no request is sent and the email field shows "Enter a valid email address."

#### Scenario: Single-label domain
- **WHEN** the user submits the register form with the email `mail@pl-coding`
- **THEN** no request is sent and the email field shows "Enter a valid email address."

#### Scenario: Address that RFC 5322 allowed
- **WHEN** the user submits the register form with `"ann lee"@example.com`, `ann@[192.168.0.1]` or `jürgen@münchen.de`
- **THEN** no request is sent and the email field shows "Enter a valid email address."

#### Scenario: Subdomains
- **WHEN** the user registers with `ann@a.b.example.co.uk`
- **THEN** the email passes the check

#### Scenario: Email over the limit
- **WHEN** the email has a normalized length of 255
- **THEN** the email field shows "Email can't be longer than 254 characters."

#### Scenario: Forbidden character before the limit
- **WHEN** the email has a normalized length of 255 and contains a tab
- **THEN** the email field shows "Enter a valid email address."

#### Scenario: Email with surrounding spaces
- **WHEN** the user registers with `  Ann@Example.com `
- **THEN** the email passes the check and is sent as `Ann@Example.com`, trimmed with its case kept

### Requirement: Register password checks
Before sending, the register form SHALL check the password against the `domain-user` rule and the `text-length` rules for passwords, and that the repeated password equals the password. Errors SHALL read "Enter your password." (empty), "Password can't contain tabs or line breaks." (a control character or unpaired surrogate), "Password can't be longer than 128 characters." (over 128 code points), "Repeat your password." (empty repeat) and "Passwords don't match."

#### Scenario: 128 code points with emoji are accepted
- **WHEN** the user leaves the register password field holding 120 ASCII characters that meet all four rules followed by eight U+1F600
- **THEN** the password field shows no error

#### Scenario: Password over the limit
- **WHEN** the user leaves the register password field holding a password of 129 code points that meets all four rules
- **THEN** the password field shows "Password can't be longer than 128 characters." and all four rules show a check

#### Scenario: Tab in the password
- **WHEN** the user leaves the register password field holding a password that meets all four rules and contains a tab
- **THEN** the password field shows "Password can't contain tabs or line breaks."

#### Scenario: Unpaired surrogate
- **WHEN** the register password contains an unpaired surrogate
- **THEN** the password field shows "Password can't contain tabs or line breaks." and no request is sent on submit

#### Scenario: Password empty
- **WHEN** the user submits the register form with an empty password
- **THEN** the password field shows "Enter your password."

#### Scenario: Passwords differ
- **WHEN** the repeated password differs from the password
- **THEN** the repeat field shows "Passwords don't match."

#### Scenario: Repeat empty
- **WHEN** the user submits with an empty repeat field
- **THEN** the repeat field shows "Repeat your password."

### Requirement: One password error at a time
The register password SHALL show only the first error in this order: empty, a control character or unpaired surrogate, a broken live rule (no text, see Unmet password rules on submit), over 128 code points.

#### Scenario: Weak password with a tab
- **WHEN** the user leaves the register password field holding `abc\tdef`
- **THEN** the password field shows "Password can't contain tabs or line breaks."

#### Scenario: Weak password over the limit
- **WHEN** the user leaves the register password field holding 129 lowercase letters
- **THEN** the password field is marked invalid with no error text, and "Uppercase letter" and "Digit" show a cross

### Requirement: Unmet password rules on submit
When the user submits the register form with a non-empty password without control characters that breaks a rule shown in the live list, the password field SHALL show its error state and the unmet rules SHALL stay as crosses. No error text SHALL show under the rules for this case.

#### Scenario: Submit a weak password
- **WHEN** the user submits the register form with the password `abcdefghijkl`
- **THEN** no request is sent, the password field shows its error border, and "Uppercase letter" and "Digit" show a cross with no extra message

### Requirement: When field errors show
A field error SHALL first show when the field loses focus, or when the user submits the form. From then on, it SHALL update with every change to the field. The submit button SHALL stay enabled. Submitting with any field error SHALL send no request, show every field error and move focus to the first field in error. "Passwords don't match." SHALL also update when the password changes after the repeat field showed an error.

#### Scenario: Typing before leaving the field
- **WHEN** the user types `ann@` into the register email field and has not left it
- **THEN** no email error shows

#### Scenario: Leaving the field
- **WHEN** the user leaves the register email field holding `ann@`
- **THEN** the email field shows "Enter a valid email address."

#### Scenario: Fixing the error
- **WHEN** the email field shows an error and the user types until the email is valid
- **THEN** the error disappears without leaving the field

#### Scenario: Submit an untouched form
- **WHEN** the user presses "Log in" with both fields empty
- **THEN** no request is sent, both fields show their error, and focus moves to the email field

#### Scenario: Password fixed after mismatch
- **WHEN** the repeat field shows "Passwords don't match." and the user changes the password to equal the repeated one
- **THEN** the mismatch error disappears

### Requirement: Request in progress
While a log in or register request runs, all fields SHALL be disabled. The button SHALL show a spinner and the label "Logging in…" or "Creating account…", and SHALL NOT start a second request. When the request ends, the fields SHALL be enabled again. Leaving the screen while a request runs SHALL NOT cancel it. If the request succeeds after the screen is gone, the host SHALL still be told, so the app never holds a session it doesn't know about. Failures after leaving SHALL be ignored.

#### Scenario: Logging in
- **WHEN** the user submits a valid log in form
- **THEN** both fields are disabled and the button shows a spinner and "Logging in…"

#### Scenario: Double submit
- **WHEN** a register request runs and the form receives another submit event
- **THEN** the register function is not called a second time

### Requirement: Wrong email or password
When log in fails with `INVALID_CREDENTIALS`, the screen SHALL show the error banner "Email or password is incorrect." above the fields. It SHALL keep both values and show the password field in its error state. The banner and the password error state SHALL clear on the next edit of either field.

#### Scenario: Wrong password
- **WHEN** log in fails with 401 `INVALID_CREDENTIALS`
- **THEN** the banner shows, both values stay, and the password field shows its error border

#### Scenario: Edit after failure
- **WHEN** the banner shows and the user types in the email field
- **THEN** the banner and the password error border disappear

### Requirement: Email already registered
When register fails with 409 `CONFLICT` and a field error `ALREADY_USED` for `email`, the email field SHALL show "An account with this email already exists." The other values SHALL stay. The error SHALL clear when the email is edited. No extra link SHALL be added.

#### Scenario: Used email
- **WHEN** register fails with 409 and `ALREADY_USED` for `email`
- **THEN** the email field shows "An account with this email already exists." and the password fields keep their values

#### Scenario: Edit the email
- **WHEN** the used email error shows and the user changes the email
- **THEN** the error disappears

### Requirement: Rate limited
When log in or register fails with 429 `RATE_LIMITED`, the screen SHALL show the error banner "Too many attempts. Try again in {time}." {time} SHALL come from `Retry-After`. It SHALL be in seconds below 60 and otherwise in whole minutes rounded up, with singular and plural forms. The banner SHALL NOT count down. The button SHALL stay enabled.

#### Scenario: Twelve seconds
- **WHEN** log in fails with 429 and `Retry-After: 12`
- **THEN** the banner reads "Too many attempts. Try again in 12 seconds."

#### Scenario: One second
- **WHEN** register fails with 429 and `Retry-After: 1`
- **THEN** the banner reads "Too many attempts. Try again in 1 second."

#### Scenario: Over a minute
- **WHEN** log in fails with 429 and `Retry-After: 61`
- **THEN** the banner reads "Too many attempts. Try again in 2 minutes."

#### Scenario: Exactly a minute
- **WHEN** log in fails with 429 and `Retry-After: 60`
- **THEN** the banner reads "Too many attempts. Try again in 1 minute."

#### Scenario: No usable Retry-After
- **WHEN** register fails with 429 and `Retry-After` is missing or not a positive whole number
- **THEN** the banner reads "Couldn't reach Cardigan. Check your connection and try again."

#### Scenario: Correct password over the limit
- **WHEN** a log in with the correct password fails with 429
- **THEN** the rate limit banner shows, not the wrong credentials banner

### Requirement: Other failures
When log in or register fails with a network error, a 5xx, a response that isn't problem details, or a code the form does not handle, the screen SHALL show the error banner "Couldn't reach Cardigan. Check your connection and try again." and keep all values.

#### Scenario: No network
- **WHEN** the register request can't reach the server
- **THEN** the generic banner shows and all values stay

### Requirement: Server field errors
A `VALIDATION_FAILED` response SHALL show each field error under its field with the text from the field check requirements. A `password` code without a text, including `TOO_SHORT` and `PASSWORD_TOO_WEAK`, SHALL mark the field invalid with no text. An `email` code without a text SHALL show "Enter a valid email address." If any entry names another field, only the generic banner SHALL show.

#### Scenario: Server field error
- **WHEN** register fails with 400 `VALIDATION_FAILED` and a field error `INVALID_FORMAT` for `email`
- **THEN** the email field shows "Enter a valid email address."

#### Scenario: Server weak password
- **WHEN** register fails with 400 `VALIDATION_FAILED` and `PASSWORD_TOO_WEAK` for `password`
- **THEN** the password field is marked invalid with no error text and no banner shows

#### Scenario: Unknown code on the email
- **WHEN** register fails with 400 `VALIDATION_FAILED` and a code the form has no text for on `email`
- **THEN** the email field shows "Enter a valid email address." and no banner shows

#### Scenario: Unknown field
- **WHEN** register fails with 400 `VALIDATION_FAILED` and only a field error for `refreshTokenTransport`
- **THEN** the generic banner shows

#### Scenario: Known and unknown field together
- **WHEN** register fails with 400 `VALIDATION_FAILED` with `INVALID_FORMAT` for `email` and an entry for `refreshTokenTransport`
- **THEN** only the generic banner shows

### Requirement: Banners clear on the next submit
A banner from a failed request SHALL stay until the next submit that sends a request or, for wrong credentials, the next edit. Submitting SHALL remove the current banner before the new request starts. A submit that field errors block SHALL keep the banner. Only one banner SHALL show at a time.

#### Scenario: Retry after network failure
- **WHEN** the generic banner shows and the user submits again
- **THEN** the banner disappears while the request runs

#### Scenario: Blocked submit keeps the banner
- **WHEN** the session expired banner shows and the user submits with an empty email
- **THEN** no request is sent and the session expired banner stays

### Requirement: Session expired state
When the host opens log in with the session expired flag, the screen SHALL show the info banner "Your session has expired. Log in again to continue." above the fields, with empty fields. The banner SHALL stay while the user types and SHALL go away on the next submit that sends a request.

#### Scenario: Session expired
- **WHEN** log in opens with the session expired flag
- **THEN** the info banner shows and the email field is empty

#### Scenario: Typing keeps the banner
- **WHEN** the session expired banner shows and the user types an email
- **THEN** the banner stays

#### Scenario: Submit replaces the banner
- **WHEN** the session expired banner shows and the next log in fails with `INVALID_CREDENTIALS`
- **THEN** only the wrong credentials banner shows

### Requirement: Successful log in and register
After a successful log in or register, the screen SHALL report the success to the host and SHALL NOT show a message of its own. Register SHALL count as logged in.

#### Scenario: Register succeeds
- **WHEN** register succeeds
- **THEN** the host is told the user is logged in, and no second log in is needed

### Requirement: Session interface for the app
The app SHALL give the app shell the signed-in user's email and a log out action through one session interface, so screens don't request the email themselves. The email SHALL be unknown until the session has loaded it. Log out SHALL NOT ask for a confirmation.

#### Scenario: Email in the shell
- **WHEN** the session holds the email `ann@example.com`
- **THEN** the app shell gets `ann@example.com` from the session interface

#### Scenario: Email not loaded yet
- **WHEN** the session has not loaded the email
- **THEN** the session interface reports the email as unknown

#### Scenario: Log out without confirmation
- **WHEN** the user chooses log out
- **THEN** the session's log out action runs once, with no confirmation

### Requirement: Auth layout per size
The log in and register screens SHALL follow the Figma layouts: on phones the brand, title and form start at the top without a card; on tablet and desktop the brand and a card with the form are centered. Inputs and buttons SHALL use the touch size on phones.

#### Scenario: Desktop
- **WHEN** the log in screen is shown at 1440 px width
- **THEN** the brand and the card are centered horizontally and vertically, with the card 380 px wide

#### Scenario: Phone
- **WHEN** the register screen is shown at 390 px width
- **THEN** the form fills the width inside the page margins with no card border, and inputs use the touch height
