# Proposal

## Why

Users need to register, log in, see when their session has expired, and log out (chunk 19, `web-auth-ui`). The `auth` feature folder and `core/auth` are still empty, and the backend auth endpoints aren't in the OpenAPI snapshot yet. This change builds the screens, the form rules and the session interface now, against injected calls, so `web-auth-connect` (chunk 29) only has to add HTTP, tokens and routing.

## What Changes

- **Log in screen** (D5, D6, D9, D10):
  - Email and password, both checked only for being filled in.
  - "Logging in…" with disabled fields while the request runs.
  - Error banner for wrong credentials, rate limiting and network or server errors.
  - Info banner "Your session has expired. Log in again to continue." when the host passes the session expired flag.
  - Link to register.
- **Register screen** (D4, D5, D10):
  - Email, password and repeat password.
  - Four password rules checked on every keystroke.
  - Email rules from `domain-user`. Mismatch error.
  - "Creating account…" while the request runs.
  - "An account with this email already exists." under the email field.
  - Link to log in.
- **Validation timing** (D4): field errors show after a field loses focus for the first time, then update live. Submitting with errors sends no request and shows every error.
- **Copy without a design** (D5, D6). Shared with mobile:
  - "Enter your email."
  - "Enter a valid email address."
  - "Email can't be longer than 254 characters."
  - "Enter your password."
  - "Repeat your password."
  - "Too many attempts. Try again in {time}."
  - "Couldn't reach Cardigan. Check your connection and try again."
  - "Password can't be longer than 128 characters." (D15)
  - "Password can't contain tabs or line breaks." (D15)
- **Session interface** in `core/auth` (D3, D7, D11, D13): exposes the signed-in user's email (`null` while it loads after a reload) and a log out action, with a fake for tests and the preview page. The board list change reads it for the sidebar and the phone menu. Log out has no confirmation.
- **Injected calls** (D1, D13): the screens take log in and register functions that return result types, and report success to the host. Tests use fakes. The screens are shown on the dev preview page and are not mounted on a route yet.
- **Dependencies** (D14): none of its own. React Hook Form, Zod and `@hookform/resolvers` come from the web foundation change.
- **Docs** (D12): `CLAUDE.md` uses the shared spec's `RATE_LIMITED` code and describes rate limiting as per email for log in and register only.

Not breaking. Nothing changes for users until `web-auth-connect` mounts the screens.

Depends on the web foundation change (D2) for the text normalize-and-count helper in `core/utils`, React Hook Form and Zod.

## Capabilities

### New Capabilities

- `web-auth`: web-only behavior of the log in and register screens: field rules and when their errors show, request and loading states, error placement and copy, the session expired state, and the session interface that gives the app shell the user's email and log out.

### Modified Capabilities

None. The screens use existing `web-design-system` components (Field, Input, Button with spinner, Banner, Password rule, Error message, Brand) without changing their requirements.

### Shared-spec requirements

This change implements or depends on these `cardigan-shared-specs` requirements:

- `domain-user`:
  - *Email is stored lowercased and identifies one user*: the email is sent as entered, and the 254 limit is checked on register.
  - *Email follows the RFC 5322 address format*: the register email check.
  - *Passwords follow one composition rule*: the four live rules and the 128 limit.
- `text-length`:
  - *Text is normalized before validation*, *Passwords are normalized without trimming*, *Length is counted in Unicode code points*: the email and password checks.
  - *Invalid characters are rejected*: control characters in a register password.
  - *Clients validate with the same rule*: no request with text the backend would reject on register.
- `api-errors`:
  - *Error text is for developers only*, *Clients handle unknown error codes by status*: messages come from codes and statuses, never from `detail`.
  - *Login failures look the same*: one message for a wrong email or password.
  - *Field error codes*, *Uniqueness clashes are conflicts*: `VALIDATION_FAILED` field errors and the 409 used email.
  - *Rate limit is checked before credentials*: 429 shows the rate limit banner even with a correct password.
- `api-auth-tokens`:
  - *Auth endpoints are rate limited*: the `Retry-After` text.
  - *Logout ends only the current session*: log out ignores the response.
  - *Clients end the session on a rejected refresh*: the session expired state the host shows afterwards.

## Impact

- **Code**:
  - `src/features/auth/` (components, hooks, utils, types, translations).
  - `src/core/auth/` (session interface and fake).
  - `src/preview/sections/AuthSection.tsx` and the preview page wiring.
  - `src/app/` i18n namespace registration.
- **Dependencies**: none added. React Hook Form, Zod and `@hookform/resolvers` come from the web foundation change.
- **Docs**: `CLAUDE.md` rate limit paragraph.
- **Other changes**:
  - The web board list change reads the session interface for the email and log out.
  - `web-auth-connect` implements the injected calls, the real session, the routes and the redirect after log in.
