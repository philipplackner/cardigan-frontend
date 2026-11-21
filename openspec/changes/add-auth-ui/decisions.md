# Decisions: add-auth-ui

Confirmed with Philipp Lackner on 2026-11-21, through the coordinator session (cardiganapp-18). The coordinator merged these questions with the mobile and the other web sessions, so the user answered each one only once. Coordinator decision IDs are noted in brackets, for example [C-D25]. Each one lists this session's original question ID (WA-n).

## Summary

Build the `auth` feature's UI for chunk 19 (`web-auth-ui`): the log in and register screens with every Figma state, the session expired state as a prop, and a session interface in `core/auth` that gives the rest of the app the user's email and a log out action. The log in, register and log out calls are injected and faked in tests. HTTP, tokens, refresh, routes and the redirect after log in come with `web-auth-connect` (chunk 29). The screens aren't mounted on a route yet. The dev preview page shows them. This change builds on the web foundation change, which adds the router, TanStack Query, the app shell and the text normalize-and-count helper.

## Decisions

### D1 — Scope [C-D2, C-D6; WA-1]
- **Question**: How far does this change go?
- **Decision**: UI and interfaces for all four parts: log in, register, session expired (a prop of the log in screen) and log out (a session interface with a fake). No HTTP, no tokens, no refresh, no route guard. Those come in `web-auth-connect`. Until the endpoints exist, the screens are tested with test doubles and shown on the dev preview page.
- **Alternatives**: Also add `/login` and `/register` routes now; merge with auth-connect.
- **Why**: Matches chunk 19. The backend auth endpoints aren't in the OpenAPI snapshot yet.
- **Depends on**: —

### D2 — Router and shared helpers come from the web foundation change [C-D4; WA-1, WA-8]
- **Question**: Who sets up the router, TanStack Query, the app shell and the shared text normalize-and-count helper?
- **Decision**: A separate web foundation change. This change does not add them. It uses the foundation's helper in `core/utils` for email and password normalization and code point counting.
- **Alternatives**: Auth adds the helper; whichever change lands first adds it.
- **Why**: Web board list, board view and auth all need these pieces.
- **Depends on**: —

### D3 — App shell ownership [C-D3; WA-7]
- **Question**: Who places the log out item and the user's email in the app shell?
- **Decision**: The board list change owns the sidebar's board section and the phone ⋯ menu (Import board, Labels, Log out). Auth only provides the log out action and the email, through the session interface.
- **Alternatives**: Auth places the items.
- **Why**: The shell belongs to the board list screens.
- **Depends on**: D1

### D4 — When validation errors show [C-D25; WA-2]
- **Question**: When do field errors show?
- **Decision**: The password rules on register update on every keystroke, as Figma says. All other field errors show after a field loses focus for the first time, then update live. The submit button stays enabled. Submitting with errors sends no request and shows every error.
- **Alternatives**: Only on submit and then live; live from the first character.
- **Why**: Matches the Figma frame that shows the mismatch error next to the live rules. Shared with mobile.
- **Depends on**: —

### D5 — Field rules and copy [C-D26; WA-3]
- **Question**: Which checks run on each form, and what do the errors say?
- **Decision**:
  - Register checks the full email rule from `domain-user` and `text-length`. Log in checks only that email and password are filled in.
  - Copy:
    - "Enter your email." (email empty)
    - "Enter a valid email address." (email format, register only)
    - "Email can't be longer than 254 characters." (register only)
    - "Enter your password." (password empty)
    - "Repeat your password." (repeat password empty)
  - Mismatch: "Passwords don't match." (Figma).
  - Submitting register with unmet password rules shows no message. The password field gets the danger border and the unmet rules stay as crosses.
  - Register loading label: "Creating account…". Log in loading label: "Logging in…" (Figma).
- **Alternatives**: Login also checks the email format.
- **Why**: A malformed email on login gets the same 401 as a wrong one, so a format check on login adds nothing. Shared copy with mobile.
- **Depends on**: D4

### D6 — Errors without a design [C-D27; WA-4]
- **Question**: How do rate limiting, network errors and server errors show?
- **Decision**: In the auth card's error Banner, in the same slot as wrong credentials.
  - 429 `RATE_LIMITED`: "Too many attempts. Try again in {time}." {time} comes from `Retry-After`, for example "12 seconds". No countdown, and the button stays enabled.
  - Network errors, 5xx and unknown codes: "Couldn't reach Cardigan. Check your connection and try again."
  - `VALIDATION_FAILED` field errors map to the field texts from D5. Field errors the form can't show fall back to the generic banner.
- **Alternatives**: Error toast; wait for Figma frames.
- **Why**: Reuses a drawn pattern. Shared copy with mobile.
- **Depends on**: D5

### D7 — Log out [C-D28; WA-7]
- **Question**: How does log out behave?
- **Decision**: No confirmation. The session ends right away and server errors are ignored. The user lands on the plain log in screen without a banner.
- **Alternatives**: A confirmation dialog first.
- **Why**: No confirmation in Figma. `api-auth-tokens` says to discard tokens whatever the response.
- **Depends on**: D3

### D8 — Where users land after log in and register [C-D29; WA-6]
- **Question**: Where does the user go after logging in or registering?
- **Decision**: On web, back to the page they were on or the protected link they opened, if it is a same-origin path. Otherwise the board list. Register logs the user in right away. In this change the screens only report success to the host. `web-auth-connect` implements the navigation.
- **Alternatives**: Always the board list.
- **Why**: Web has deep links to boards.
- **Depends on**: D1

### D9 — Session expired state [C-D30; WA-5]
- **Question**: Where does the session expired state come from, and when does the banner go away?
- **Decision**: An in-memory flag set when a refresh is rejected. A reload loses it and shows the plain log in screen. The email is not prefilled. The banner stays until the next submit or until the user leaves the screen. In this change it's a prop of the log in screen. `web-auth-connect` sets the flag.
- **Alternatives**: A URL search param; sessionStorage. Hiding the banner when the user starts typing.
- **Why**: No personal data in storage or in the URL.
- **Depends on**: D1

### D10 — Wrong credentials and used email [C-D31]
- **Question**: What happens to the form after a wrong password or a used email?
- **Decision**: Wrong credentials keep both values, mark the password field and show the error banner. The banner clears on the next edit. Email already registered shows "An account with this email already exists." under the email field. It clears when the email is edited. There is no "Log in instead" link, because the link below the form covers it.
- **Alternatives**: Clear the password.
- **Why**: Matches Figma and the design decisions.
- **Depends on**: —

### D11 — User's email in the app shell [C-D34]
- **Question**: Does the app shell show the user's email, and where does it come from?
- **Decision**: Yes. The phone menu shows "Signed in as {email}" and the sidebar shows the email. The email comes from the session, not from a separate request in each screen.
  - After log in or register, the email comes from the response's `user`.
  - After a reload, `web-auth-connect` restores the session with a refresh and then calls `GET /api/v1/users/me` once. The email is kept in the in-memory session only.
  - The session interface in this change exposes `email: string | null`. It is `null` while that request runs.
- **Alternatives**: Cache the email in localStorage; a backend change so refresh returns the user.
- **Why**: Refresh returns no user. Option a needs no storage and no backend change. Mobile keeps the email in secure storage next to the tokens instead.
- **Depends on**: D3

### D12 — Follow the shared spec on rate limiting; fix CLAUDE.md [C-D35; WA-9]
- **Question**: The web `CLAUDE.md` says the 429 code is `RATE_LIMIT_EXCEEDED`, but the shared spec says `RATE_LIMITED`. Which one is right?
- **Decision**: The shared spec is right: `RATE_LIMITED`. Log in and register are limited per email only. Refresh and log out are never limited. This change corrects `CLAUDE.md`.
- **Alternatives**: —
- **Why**: The shared spec is the contract.
- **Depends on**: D6

### D13 — Where the pieces live
- **Question**: Where do the screens, the session interface and the injected calls live?
- **Decision**: Proposed by this session, following `CLAUDE.md` and the `react-security` and `react-project-structure` skills. Reviewed with the proposal.
  - Screens, view-models, form schemas, error mapping and translations go in `src/features/auth/`.
  - The session interface (email, log out) goes in `src/core/auth/`, because the board list feature reads it and features can't import each other. It comes with a fake for tests and the preview page.
  - The log in and register calls are injected functions that return result types, like the `transfer` feature's export and import.
- **Alternatives**: Put the session interface in the auth feature (not possible, because board list needs it).
- **Why**: Import boundaries; the `react-security` skill puts session state in `core/auth`.
- **Depends on**: D1, D3

### D14 — Form library
- **Question**: How are the forms built?
- **Decision**: React Hook Form with a Zod schema, in the `onTouched` mode that gives D4's timing. The web foundation change installs `react-hook-form`, `zod` and `@hookform/resolvers` (confirmed by the coordinator; foundation D11). This change adds no dependency of its own.
- **Alternatives**: A hand-written form reducer.
- **Why**: `CLAUDE.md` and the `react-presentation-mvi` skill.
- **Depends on**: D2, D4

### D15 — Register password over the limit or with a control character [WA-10]
- **Question**: What shows when a register password is over 128 characters, or contains a control character or an unpaired surrogate? The four live rules can all be met in both cases.
- **Decision**: An error message under the password field, with the D4 timing (after blur, then live):
  - "Password can't be longer than 128 characters."
  - "Password can't contain tabs or line breaks."
- **Alternatives**: One combined message; no client message.
- **Why**: User decision. The second text uses the mobile session's shorter wording.
- **Depends on**: D4, D5

### D16 — Rate limit time format [WA-11]
- **Question**: How is {time} in "Too many attempts. Try again in {time}." formatted?
- **Decision**: Below 60 seconds: seconds ("1 second", "12 seconds"). From 60: whole minutes rounded up ("1 minute", "2 minutes" for 61). A 429 without a usable `Retry-After` (missing, not a positive whole number) shows the generic "Couldn't reach Cardigan. Check your connection and try again." banner.
- **Alternatives**: Always seconds; minutes and seconds.
- **Why**: Never shows less time than the real wait. User decision.
- **Depends on**: D6

### D17 — Offline or server error while restoring the session (for `web-auth-connect`)
- **Question**: What happens when the session restore at page load fails with a network error or a 5xx?
- **Decision**: The app opens as signed in. The board list's own load error shows, and the next load or refresh tries again. This change only records the decision. `web-auth-connect` implements it.
- **Alternatives**: Show log in; show a separate error page.
- **Why**: Matches `api-auth-tokens` *Other refresh failures are temporary*.
- **Depends on**: D11

### D18 — Accessibility labels
- **Question**: Which accessible names and screen reader texts do the auth screens use?
- **Decision**: Proposed by this session in the accepted style (short, sentence case, like "Back" and "Board actions"):
  - Password rule states: "Met" and "Not met", read before each rule.
  - The rule list is a list labelled "Password requirements".
  - The forms are labelled by their titles ("Log in to Cardigan", "Create your account").
  - The log out button in the account row: "Log out".

  Error banners are announced as alerts. The session expired banner is announced as a status.
- **Alternatives**: —
- **Why**: Matches the style the user accepted for the other screens. The coordinator may still adjust the wording.
- **Depends on**: —

## Facts

- Login and register return `AuthSessionDto` with `accessToken`, `accessTokenExpiresAt` and `user` (`id`, `email`, `createdAt`). Refresh returns `AuthTokensDto` without the user. — source: `/Users/philipplackner/IdeaProjects/cardigan/openspec/changes/be-auth/specs/auth-sessions/spec.md`
- The auth endpoints (`POST /api/v1/auth/register`, `login`, `refresh`, `logout`) are planned in the backend change `be-auth` but are not in the OpenAPI snapshot yet. The snapshot only has `GET /api/v1/users/me` and `Problem`/`FieldError`. — source: `app/src/test/resources/openapi/openapi.json` in the backend repo
- The backend's register email check is the RFC 5322 `addr-spec` (dot-atom or quoted-string local part, dot-atom or domain-literal domain, ASCII only). Login checks only that the email isn't blank after normalization and the password isn't `""`. — source: `be-auth/design.md`
- The password rule is 12–128 code points after NFC (no trimming), with at least one Ll, one Lu and one Nd character, and no control characters. — source: `domain-user`, `text-length`
- `INVALID_CREDENTIALS` is identical for an unknown email and a wrong password. — source: `api-errors` *Login failures look the same*
- A 429 carries `Retry-After` in whole seconds, at least 1. — source: `api-auth-tokens` *Auth endpoints are rate limited*
- `core/ui` already has `Banner` (error, info), `Field`, `Input`, `Button`, `Brand` (auth size), `PasswordRule`, `ErrorMessage` and a `Sidebar` with the account row and log out button. — source: `src/core/ui/`
- Figma page "Log in & register" (9:4) has Log in, Register, Wrong email or password, Session expired, Live password check and mismatch, Email already registered, and Logging in. The annotations say: "Each rule shows a cross until it is met, then a check. It updates with every keystroke.", "Shown after a failed token refresh logs the user out." and "Fields are disabled while the request runs." — source: Figma `MALwbOph7Uj2QtiTy21JaQ`, node 9:4

## Out of scope

- HTTP calls, tokens, refresh, session restore, cross-tab handling, the route guard and the redirect after log in (`web-auth-connect`).
- Router, TanStack Query, the app shell and the text helper (web foundation change).
- Placing the log out item and the email in the sidebar and the phone menu (web board list change).
- Forgot password, email verification, account or settings screen, password visibility toggle (not in v1 or not in Figma).

## Deferred

None. D34, WA-10 and WA-11 were answered through the coordinator on 2026-11-21 (D11, D15, D16).
