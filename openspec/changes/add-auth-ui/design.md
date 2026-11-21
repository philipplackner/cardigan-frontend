# Design

## Context

- `src/features/auth/` holds only empty `api/`, `components/`, `hooks/` and `utils/` folders. `src/core/auth/` is empty.
- `core/ui` already has every component the Figma frames use:
  - `Brand` (`size="auth"`), `Field`, `Input` (`isInvalid`, `disabled` at 55% opacity), `Button` (`isLoading` with spinner), `Banner` (`error`, `info`), `PasswordRule` (`isMet`, `stateLabel`), `ErrorMessage`.
  - `Sidebar` with an account row that takes `email` and `onLogOut`.
- The `transfer` feature set the pattern for UI built before its endpoints exist:
  - Injected functions that return result types (`ExportBoard`, `ImportBoard` in `types.ts`).
  - A view-model hook with a reducer.
  - Screen tests and Root-level tests with fakes.
  - A section on the dev preview page.
- The web foundation change (decisions D2) adds TanStack Router, TanStack Query, the app shell and a text helper in `core/utils` that normalizes text (`text-length`: CRLF/CR → LF, NFC, trim; NFC only for passwords) and counts code points. This change uses that helper and adds no router code.
- The backend auth endpoints are defined in `be-auth` but aren't in `api/openapi.json` yet. No generated types exist for them.

## Goals / Non-Goals

**Goals:**
- Screens and view-models that `web-auth-connect` can mount on routes without changes. Connect only supplies the real `logIn`, `register` and session.
- One Zod schema per form as the single definition of its client rules, shared by the live rules, the error texts and the tests.
- A session interface in `core/auth` that the board list change can build against now.

**Non-Goals:**
- Real HTTP, tokens, refresh, route guards, the post-login redirect and page titles per route. These are all `web-auth-connect`.
- Mapping HTTP responses to the result types. The injected functions return the result types, and connect maps problem details to them.

## Decisions

### Module layout

```
src/core/auth/
  session.tsx          AuthSession type, SessionProvider, useSession()
  fakeSession.ts       createFakeSession() for tests and the preview page
src/features/auth/
  types.ts             LogIn, Register, AuthResult, AuthFailure
  index.ts             LoginRoot, RegisterRoot, public types
  components/          AuthLayout, LoginScreen, LoginForm, RegisterScreen, RegisterForm, PasswordRules
  hooks/               useLoginViewModel, useRegisterViewModel, authRequestReducer
  utils/               loginForm.ts, registerForm.ts (Zod schemas), emailFormat.ts,
                       passwordRules.ts, retryAfterText.ts, fieldErrorText.ts
  i18n/en.json         "auth" namespace
```

`core/auth` is the only place both auth and board list can import from, so the session interface lives there (D13). The `react-security` skill also puts session state in `core/auth`. Connect replaces the fake with the real session in the same module, so callers don't change.

### Session interface

```ts
// src/core/auth/session.tsx
export type AuthSession = {
  /** The signed-in user's email as the backend returned it (lowercased). `null` while it loads after a reload. */
  email: string | null
  /** Ends the session at once. Never throws and never needs a confirmation. */
  logOut: () => void
}
export function SessionProvider(props: { session: AuthSession; children: ReactNode }): ReactNode
export function useSession(): AuthSession // throws outside a SessionProvider
```

- `logOut` is fire and forget (D7). The UI reacts to the session ending, not to a promise, so a failing server call can't leave the user signed in.
- `useSession` throws outside a provider. The shell only renders for a signed-in user, so a missing provider is a programming error, not a state to design for.
- `createFakeSession({ email, onLogOut })` returns an `AuthSession` for tests and the preview page.
- `email` comes from the log in or register response. After a reload, `web-auth-connect` restores the session with a refresh, then calls `GET /api/v1/users/me` once and fills `email`. Until then it is `null` (D11). It lives in memory only, never in browser storage. If the restore fails with a network error or a 5xx, the app still opens as signed in, and the board list's own load error shows (D17). The board list change gets the interface through the coordinator.

Alternative: a plain module with `getEmail()`/`subscribe` like the skill's token store. Rejected for now because nothing outside React reads the email. Connect can still back the provider with such a store.

### Injected calls and result types

```ts
export type AuthFailure =
  | { kind: 'invalidCredentials' }                         // 401 INVALID_CREDENTIALS (log in)
  | { kind: 'emailUsed' }                                  // 409 with email/ALREADY_USED (register)
  | { kind: 'rateLimited'; retryAfterSeconds: number | null } // 429 RATE_LIMITED; null when Retry-After is missing or not a positive whole number
  | { kind: 'invalidFields'; fields: FieldFailure[] }      // 400 VALIDATION_FAILED
  | { kind: 'other' }                                      // network, 5xx, non-problem, unknown codes
export type FieldFailure = { field: string; code: string; min?: number; max?: number }
export type AuthResult = { ok: true } | { ok: false; error: AuthFailure }

export type LogIn = (input: { email: string; password: string }) => Promise<AuthResult>
export type Register = (input: { email: string; password: string }) => Promise<AuthResult>
```

- The form sends the normalized values from the foundation's text helper (email: single-line kind; password: password kind, NFC without trimming), as the foundation change decides for all features. The email keeps its case. The backend lowercases it, and `domain-user` says clients SHALL NOT need to.
- `LoginRoot` props: `logIn`, `onLoggedIn()`, `isSessionExpired`, `renderRegisterLink(label)`. `RegisterRoot` props: `register`, `onRegistered()`, `renderLogInLink(label)`.
- The link props are slots so the host can pass a router `Link` in connect and a plain button on the preview page. The sentence and the link text stay in the auth translations.
- Alternative: navigation callbacks. Rejected because the switch must stay a real link for keyboard users and for opening in a new tab once routes exist.

### Forms

- React Hook Form with `zodResolver`, `mode: 'onTouched'` and `reValidateMode: 'onChange'`. This gives D4 exactly: the first error on blur or submit, then live. `shouldFocusError` (the default) moves focus to the first field in error on submit.
- The password field registers with `deps: ['repeatPassword']`, so "Passwords don't match." updates when the password changes.
- The live rules don't use form errors. `PasswordRules` reads the password with `useWatch` and calls `passwordRules(value)`, which returns the four booleans. It shows them from the first keystroke, independent of the touched state.
- The register schema's password check reports a special key `rulesUnmet` when one of the four rules fails. `fieldErrorText` renders no text for it, but the field still gets `aria-invalid` and the danger border. The submit therefore shows the red field and the crosses without an extra message.
- Fields get `disabled` from the view-model's `isSubmitting` through `Input`'s own prop, not through React Hook Form's `disabled` option. That option would drop the values.
- `autocomplete`:
  - Log in: `username` on the email and `current-password` on the password.
  - Register: `username` on the email and `new-password` on both password fields.
  - `type="email"` keeps the email keyboard on phones, and `noValidate` keeps the browser's own bubbles away.

### Client rules

- **Email (register)**, in this order (`api-errors` *One field error per field*):
  1. Empty after normalization → `REQUIRED`.
  2. Over 254 code points → `TOO_LONG`.
  3. Fails `isAddrSpec` → `INVALID_FORMAT`.

  `isAddrSpec` is a hand-written RFC 5322 `addr-spec` check: a dot-atom or quoted-string local part, a dot-atom or domain-literal domain, ASCII only, no comments, no folding whitespace. It mirrors `be-auth`'s `@ValidEmail`. It is built without nested quantifiers, so it can't backtrack badly. It runs only after the length check. A control character fails the format.
- **Email (log in)**: only `REQUIRED` after normalization.
- **Password (register)**:
  1. `""` → `REQUIRED`.
  2. A control character or unpaired surrogate → `INVALID_CHARACTER`.
  3. Under 12 code points, or missing Ll, Lu or Nd → `rulesUnmet`.
  4. Over 128 → `TOO_LONG`.

  All of this runs on the NFC form, without trimming. Character classes use `\p{Ll}`, `\p{Lu}`, `\p{Nd}` with the `u` flag. `INVALID_CHARACTER` reads "Password can't contain tabs or line breaks." and `TOO_LONG` reads "Password can't be longer than 128 characters." (D15).
- **Password (log in)**: only `""` → `REQUIRED`.
- **Repeat password**: `""` → `REQUIRED`, otherwise it must equal the password, raw → `mismatch`.

### Request state and banners

`authRequestReducer` holds `{ isSubmitting, banner }`, where `banner` is one of:
- `null`
- `'sessionExpired'`
- `'invalidCredentials'`
- `{ kind: 'rateLimited', seconds }`
- `'other'`

Actions:
- `submitted`: sets `isSubmitting` and clears `banner`.
- `failed(AuthFailure)`: maps `invalidCredentials`, `rateLimited` and `other` to the banner. `emailUsed` and `invalidFields` are handled by the form.
- `succeeded`.
- `edited`: clears only `invalidCredentials`.

The initial banner is `'sessionExpired'` when `isSessionExpired` is set (D9).

- **Field failures** from the server go to the form through `setError`:
  - `emailUsed` → email with the text "An account with this email already exists."
  - `invalidFields` entries for `email` or `password` → the same texts as the client codes.

  If any entry names another field or an unknown code, the reducer gets `failed({ kind: 'other' })` instead. Clearing on edit is React Hook Form's normal behavior once the field changes.
- **Wrong credentials** also set a password error with an empty text, for the danger border (D10). The form's `onChange` dispatches `edited`, which clears the banner and that error.
- **Accessible names** (D18):
  - `PasswordRule` gets `stateLabel` "Met" or "Not met".
  - The rules render as a list labelled "Password requirements".
  - Each form is labelled by its title.
  - Error banners use `role="alert"`, and the session expired banner uses `role="status"`.
- **Double submit**: blocked by checking `isSubmitting` in the view-model before calling the injected function. Disabled fields alone don't stop Enter, because the button stays focusable.
- **Success** calls `onLoggedIn` or `onRegistered` and shows nothing itself.

### Rate limit text

`retryAfterText(seconds)` (D16):
- Below 60: seconds with i18next plurals ("1 second", "12 seconds").
- From 60: `ceil(seconds / 60)` minutes ("1 minute", "2 minutes").

When `retryAfterSeconds` is `null`, the reducer shows the generic `'other'` banner instead.

### Layout

`AuthLayout` renders the Figma "Auth" frame:
- On phones: the brand and the content stacked from the top inside the page margins, with no card.
- From the tablet breakpoint: the brand and a 380 px card centered on both axes.

Breakpoints come from the theme's single definition. The title uses the phone and the desktop type styles from Figma.

### Translations

An `auth` namespace in `src/features/auth/i18n/en.json`, registered where the app registers `transfer`. Every string on the Figma frames and in D5/D6 lives there, with typed keys.

### Docs

`CLAUDE.md` → Authentication: replace `RATE_LIMIT_EXCEEDED` with `RATE_LIMITED`. Say that log in and register are limited per email, and that refresh and log out are never limited. Drop the matching item from "Open Items" (D12).

## Risks / Trade-offs

- [The email check drifts from the backend] → Unit tests use the `domain-user` scenarios and the `be-auth` 4.1 case list (plus address, `ann@`, non-ASCII, comment, quoted local part, leading and trailing dots, 254/255 code points). When connect runs against the real backend, any mismatch shows as a server `INVALID_FORMAT`, and the form still shows the same text.
- [The board list renders before the email is known after a reload] → `email` is typed `string | null`, so the board list must handle `null`. The coordinator told that session.
- [The foundation helper, React Hook Form or Zod isn't there yet] → Group 1 of the tasks checks for them first and stops if one is missing, instead of adding a second copy.
- [React Hook Form `onTouched` and a `disabled` field during submit] → Values come from React Hook Form's store, not the DOM, so disabling the inputs while the request runs keeps them. A test covers this.

## Migration Plan

None. Nothing is mounted for users. The dev preview page is the only consumer until `web-auth-connect`.
