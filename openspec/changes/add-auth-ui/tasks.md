# Tasks

Every group ends with all five gates passing (`typecheck`, `lint`, `format:check`, `test`, `build`) and a commit, as `CLAUDE.md` requires. Changes in `core/auth` get their own commit.

## 1. Prerequisites

- [ ] 1.1 Check that the web foundation change has landed: `core/utils` exports the text normalize-and-count helper (text and password variants), `react-hook-form`, `zod` and `@hookform/resolvers` are installed, and TanStack Router and Query are set up. If any of them is missing, stop and tell the user instead of adding a copy. Verify by reading the helper's exports and its tests, and with `npm ls react-hook-form zod @hookform/resolvers`.

## 2. Session interface in `core/auth`

- [ ] 2.1 Add `AuthSession`, `SessionProvider` and `useSession` in `src/core/auth/session.tsx`, and `createFakeSession` in `fakeSession.ts`, as in `design.md`. Verify with tests:
  - `useSession` returns the provided email (also `null`) and `logOut`.
  - It throws a clear error outside a provider.
  - The fake calls `onLogOut` once per `logOut`.
- [ ] 2.2 Check that the oxlint import boundaries allow `features/*` → `core/auth` and still reject `core/auth` → `features/*`. Verify with the boundary test in `src/app/lintBoundaries.test.ts`, adding a case if none covers `core/auth`.

## 3. Rules, texts and error mapping

- [ ] 3.1 Add `isAddrSpec` in `features/auth/utils/emailFormat.ts`. Verify with adversarial unit tests:
  - The `domain-user` scenarios: plus address, `ann@`, `jürgen@münchen.de`, `ann(work)@example.com`.
  - A quoted local part, a domain literal, leading, trailing and double dots, a missing local part, a tab, a NUL.
  - A 250 KB near-match that finishes within 100 ms.
- [ ] 3.2 Add `passwordRules(value)` in `utils/passwordRules.ts`, returning the four booleans on the NFC form. Verify with unit tests:
  - 11 and 12 code points, including a 12th character that is an emoji.
  - Each class missing.
  - `äöüÄÖÜ١٢٣ßßßß` passes all four.
  - A decomposed `é` counts once.
  - Leading and trailing spaces count.
- [ ] 3.3 Add the log in and register Zod schemas in `utils/loginForm.ts` and `utils/registerForm.ts`, with the rule order from `design.md` and translation keys as messages. Verify with unit tests for every case in the spec's field check requirements:
  - Whitespace email; 254/255 code points; `  Ann@Example.com ` accepted.
  - Spaces-only password accepted on log in.
  - `rulesUnmet`, `INVALID_CHARACTER` (tab, unpaired surrogate) and `TOO_LONG` (129) on register.
  - Mismatch and empty repeat.
  - One error per field.
- [ ] 3.4 Add `retryAfterText` and `fieldErrorText` (code → translation key, `rulesUnmet` → no text, unknown field or code → banner fallback). Add the `auth` namespace `en.json` with every Figma, D5, D6, D15, D16 and D18 string, registered with i18next and typed. Verify with unit tests: 1, 12, 59, 60, 61 and 3600 seconds; each field code including the two D15 texts; an unknown field; and the typecheck failing on a misspelled key.

## 4. Request state and view-models

- [ ] 4.1 Add `types.ts` (`LogIn`, `Register`, `AuthResult`, `AuthFailure`, `FieldFailure`) and `authRequestReducer`. Verify with reducer unit tests:
  - Session expired as the initial banner.
  - `submitted` clears any banner.
  - Each failure kind maps to its banner or to no banner.
  - `rateLimited` with `retryAfterSeconds: null` maps to the generic banner.
  - `edited` clears only `invalidCredentials`.
- [ ] 4.2 Add `useLoginViewModel` and `useRegisterViewModel`: the double-submit guard, calling the injected function, routing `emailUsed` and `invalidFields` to the form and the other failures to the reducer, and calling `onLoggedIn` or `onRegistered`. Verify with tests on fake injected functions, including a second submit while the first is pending that makes no second call.

## 5. Screens

- [ ] 5.1 Add `AuthLayout` with the phone and tablet/desktop layouts from Figma 9:4. Before building, look at every size of the Log in and Register frames with `get_metadata` and `get_design_context`. Verify with a screen test for the brand, the heading level and the link sentence, and by comparing the preview at 390, 834 and 1440 px with the Figma frames.
- [ ] 5.2 Add `LoginForm`, `LoginScreen` and `LoginRoot`. Verify with screen and Root tests (fakes) for each `web-auth` scenario on log in:
  - The empty screen; the untouched submit with focus on the email field.
  - The malformed email that is sent.
  - Logging in… with disabled fields and values kept.
  - Wrong credentials (values kept, password border, cleared on edit).
  - Rate limited, including the correct password over the limit and a 429 without a usable `Retry-After`.
  - The generic banner.
  - The session expired banner kept while typing and replaced on submit.
  - `onLoggedIn` on success.
  - The `autocomplete` values.
- [ ] 5.3 Add `PasswordRules`, `RegisterForm`, `RegisterScreen` and `RegisterRoot`. Verify with screen and Root tests (fakes) for each `web-auth` scenario on register:
  - Live rules before blur, with the screen reader state text.
  - Errors after blur and then live.
  - Mismatch updating when the password changes.
  - The weak password submit with no message.
  - The D15 messages: 129 code points and a tab, each with all four rules met.
  - Creating account….
  - The used email cleared on edit.
  - Server `INVALID_FORMAT` on email.
  - An unknown server field → the generic banner.
  - `onRegistered` on success.
- [ ] 5.4 Check keyboard-only use and the D18 labels on both screens: tab order, Enter submits, the banner is announced (`role="alert"` for errors, `role="status"` for session expired), the forms are named by their titles, and the rules are a list named "Password requirements" with "Met" or "Not met" before each rule. Verify with screen tests that query by role and name, and with a manual keyboard pass on the preview page.

## 6. Preview page and docs

- [ ] 6.1 Add `src/preview/sections/AuthSection.tsx`:
  - Both screens with a fake `logIn`/`register`, and a scenario picker (success, wrong credentials, email used, 429 with 12 s and 61 s, network error, slow request).
  - A session expired toggle.
  - A `Sidebar` account row fed by `createFakeSession`.

  Verify by opening the preview page and going through every scenario in light and dark mode at 390, 834 and 1440 px.
- [ ] 6.2 Update `CLAUDE.md` as described in `design.md` → Docs. Verify by reading the section against `api-auth-tokens` and `api-errors`.
- [ ] 6.3 After the last commit, run the five gates on a clean working tree. Verify that all of them pass.

## Workflow follow-up

- Tell the coordinator (cardiganapp-18) when the session interface is in, so the web board list change can read it.
- `web-auth-connect` mounts `LoginRoot` and `RegisterRoot` on routes, implements `LogIn`, `Register` and the real session, fills `email` from `/users/me` after a reload (D11), and opens the app as signed in when the restore fails with a network error or a 5xx (D17).
- Archive only when the user says so.
