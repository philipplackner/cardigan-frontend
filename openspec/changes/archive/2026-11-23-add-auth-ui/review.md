# Artifact review: add-auth-ui

**Verdict:** Ready
**Reviewed:** 2026-11-21, schema `careful-planning`, repo kind `code`

Counts are what each reviewer reported, before merging. After merging duplicates, 29 findings remain: 0 blockers, 17 majors and 12 minors.

| Reviewer | Blocker | Major | Minor |
|---|---|---|---|
| Testability | 0 | 6 | 6 |
| Security | 0 | 1 | 1 |
| Hidden assumptions | 0 | 7 | 3 |
| Design contract | 0 | 6 | 3 |

Verdict reason: no blocker was found or rejected. The user applied every major except A3, which was rejected as a nitpick. All minors stay open.

## Conflicts between reviewers

### C1: How server field codes the form has no text for are shown (T4 vs A7)
- **T4** (with D7 agreeing on the password part): a password `TOO_SHORT` or `PASSWORD_TOO_WEAK` marks the field invalid with no text. **Any other** unknown code or unknown field, including an unknown code on `email`, shows only the generic banner, following D6 ("Field errors the form can't show fall back to the generic banner"). Record the deviation from `api-errors` *New field code*.
- **A7**: password `TOO_SHORT`, `PASSWORD_TOO_WEAK` **and any unknown password code** → `rulesUnmet`. Email `INVALID_CHARACTER` **or an unknown email code** → "Enter a valid email address." on the field. Only an entry for a field the form doesn't show gives the banner, following `api-errors` *Clients handle unknown error codes by status*.
- Why both can't apply: they give different outcomes for an unknown code on `email` or `password`. Both agree on `TOO_SHORT` and `PASSWORD_TOO_WEAK`.
- Decision: A7. Unknown email codes show "Enter a valid email address.", and unknown password codes mark the field invalid with no text. Only an unknown field gives the banner.

### C2: Where the connect-level session behavior is specified (T6/D4 vs S1, S2, A5)
- **T6 / D4**: shrink "Session interface for the app" to what this change can deliver and test: the email from the session, `null` while unknown, and log out without confirmation. Move "Log out with a server error", "Email after a reload", "no browser storage" and "Leaving the screen ends the state" to `web-auth-connect` and list them in tasks.md > Workflow follow-up.
- **S1**: add to the same requirement a pending-logout marker in `localStorage` and the scenario "Reload after a failed log out".
- **S2**: add "Ending the session SHALL remove all cached user data and SHALL end the session in every open tab" and the scenario "Next user sees no previous data".
- **A5**: add "A session the user ended with log out SHALL NOT be reported as expired".
- Why both can't apply as written: T6/D4 take connect-level behavior out of this spec, while S1, S2 and A5 add more of it. One way to reconcile them is to apply T6/D4 and record the S1, S2 and A5 content as requirements for `web-auth-connect` in tasks.md > Workflow follow-up. The defects S1, S2 and A5 describe stay valid either way.
- Decision: apply T6/D4. S1 (the pending log out marker, which the user chose over accepting the risk) and A5 are recorded as `web-auth-connect` behavior in design.md > Session interface and tasks.md > Workflow follow-up. S2 is a minor and stays open.

## Findings

### S1: A failed log out leaves the web refresh cookie valid, and a reload restores the session
**Status:** applied with edits (recorded as connect behavior in design.md and tasks.md, per C2)
- Severity: major. On a shared computer, the next person gets the previous user's account for up to 30 days. Fake-based tests can't catch it, and the spec's wording invites connect to build this. Not a blocker, because this change only ships the fake.
- Location: specs/web-auth/spec.md > Requirement: Session interface for the app (and scenario "Log out with a server error"); design.md > Session interface
- Current text: "Log out SHALL end the session at once, without a confirmation, and SHALL ignore a failed server response."
- Problem: on web, the client can't discard the refresh token. It lives in an httpOnly cookie that only the backend's logout response clears and revokes. "Ignore a failed response" is right on mobile, where the client deletes the token from secure storage. On web it leaves a live session behind the logged-out UI. With session restore on load, and D17 opening the app as signed in on restore errors, the next page load silently signs the previous user back in.
- Failure scenario: a user on a library computer clicks Log out while Wi-Fi drops. The UI shows the plain log in screen and they walk away. The next person opens the app, the restore refresh succeeds with the surviving cookie, and they see the first user's boards.
- Proposed fix: keep D7's user-facing behavior and add to the requirement: "On web the refresh cookie can only be cleared by the server. When the log out request fails, the app SHALL keep a non-personal 'log out pending' marker in `localStorage`. While the marker exists, the app SHALL NOT restore a session on load. It SHALL send the log out request again before anything else, and remove the marker only after the server confirmed the log out or after a new successful log in." Add the scenario "Reload after a failed log out" (WHEN the user logs out, the log out request fails, and the page is reloaded / THEN the log in screen shows and no session is restored). In design.md > Session interface add: "`logOut` stays fire and forget for the UI. `web-auth-connect` implements the pending-logout marker (see spec)." Alternative: accept the risk and document it in design.md > Risks / Trade-offs. Not recommended.
- Upstream: no

### T1: Code point scenarios pass even when the count uses UTF-16 units or graphemes
**Status:** applied
- Severity: major. The main counting bug in this area would ship with green tests.
- Location: specs/web-auth/spec.md > Live password rules > Scenario: Length counts code points; Register password checks > Scenario: Password over the limit
- Current text: "**WHEN** the password is eleven letters and digits followed by one emoji, and contains a lowercase letter, an uppercase letter and a digit / **THEN** "12+ characters" shows a check"
- Problem: 11 characters plus one emoji is 12 code points, 13 UTF-16 units and 12 graphemes. Every counting method reaches 12, so the check shows whichever one the code uses. The 129 scenario uses ASCII. No scenario shows that 128 is accepted.
- Failure scenario: `passwordRules` uses `value.length`. A user types 10 characters plus 😀 (11 code points), the rule shows a check, and the backend rejects `TOO_SHORT`. All tests pass.
- Proposed fix: replace the scenario with "ten ASCII … followed by U+1F600 → cross". Add: eleven ASCII + U+1F600 → check; ten ASCII + 👍🏽 (U+1F44D U+1F3FD) → check; 120 ASCII meeting all rules + eight U+1F600 on blur → no error.
- Test sketch: unit (`passwordRules`, register schema). `passwordRules("Abcdefghi1" + "😀")` gives length false. The 128-code-point string is accepted. Fails with `.length` or `Intl.Segmenter`.
- Upstream: no

### T2: The spec contradicts itself when a password breaks a rule and also has a tab or is too long
**Status:** applied
- Severity: major. Two valid tests from the same spec expect different output for the same input.
- Location: specs/web-auth/spec.md > Unmet password rules on submit; Register password checks
- Current text: "When the user submits the register form with a non-empty password that breaks a rule shown in the live list ... No error text SHALL show under the rules for this case." and "Errors SHALL read ... "Password can't contain tabs or line breaks." ..., "Password can't be longer than 128 characters." ..."
- Problem: `abc\tdef` breaks the live rules (no text) and contains a tab (tab text). A 129-code-point lowercase password has the same clash with the length text. The order REQUIRED → INVALID_CHARACTER → rulesUnmet → TOO_LONG is only in design.md.
- Failure scenario: one developer shows no text for `abc\tdef`, and a tester expects the tab message. Both read the spec correctly.
- Proposed fix: append to Register password checks: "The password SHALL show only the first error in this order: empty, a control character or unpaired surrogate, a broken live rule (no text, see Unmet password rules on submit), over 128 code points." Add the scenarios "Weak password with a tab" (`abc\tdef` → tab text) and "Weak password over the limit" (129 lowercase → invalid with no text, Uppercase and Digit crossed). In Unmet password rules, say "a non-empty password without control characters".
- Test sketch: unit (register schema). `abc\tdef` gives `INVALID_CHARACTER`, and `"a".repeat(129)` gives `rulesUnmet`.
- Upstream: no

### T3: The double-submit scenario can't fail
**Status:** applied · Related: A3
- Severity: major. The view-model guard would never be tested by this scenario.
- Location: specs/web-auth/spec.md > Request in progress > Scenario: Double submit
- Current text: "**WHEN** a register request runs and the user presses Enter in a field / **THEN** no second request is sent"
- Problem: all fields are disabled during the request, so the user can't press Enter in one. `Button` with `isLoading` also ignores clicks. The scenario passes without the view-model guard.
- Failure scenario: the `isSubmitting` check is missing. The test passes, and a `requestSubmit()` from code or assistive technology sends two register requests.
- Proposed fix: "**WHEN** a register request runs and the form receives another submit event / **THEN** the register function is not called a second time"
- Test sketch: UI (Root with a pending fake). Call `fireEvent.submit(form)` twice. The fake is called once.
- Upstream: no

### T4 (merged with A7, D7): Server field codes without a client text have no defined outcome
**Status:** applied with edits (A7 rule, per C1) · Severity: major (A7 major, D7 minor)
- Location: specs/web-auth/spec.md > Other failures; design.md > Request state and banners > Field failures; tasks.md 3.4
- Current text: spec: "A `VALIDATION_FAILED` response SHALL show each field error under its field with the matching text from the field check requirements. If a field error can't be shown, the generic banner SHALL show." Design: "`invalidFields` entries for `email` or `password` → the same texts as the client codes. If any entry names another field or an unknown code, the reducer gets `failed({ kind: 'other' })` instead."
- Problem (T4): the backend can return `password` `TOO_SHORT` or `PASSWORD_TOO_WEAK` (`api-errors` *Field error codes*), and the client has no text for either. It is unclear whether those "can be shown". A mix of known and unknown entries isn't specified, and an unknown email code conflicts with `api-errors` *New field code* ("shows its general invalid-value message on that field").
- Problem (A7): client and server can disagree, because browser Unicode tables for `\p{Ll}`/`\p{Lu}`/`\p{Nd}` and NFC can differ from Java's. A valid server answer then shows "Couldn't reach Cardigan. Check your connection and try again.", and the user retries a request that can never succeed.
- Failure scenario: the server rejects a password with `PASSWORD_TOO_WEAK`. The user sees the network banner, or one implementation shows the red field while the tests expect the banner.
- Proposed fix (T4): "A field error for `password` with `TOO_SHORT` or `PASSWORD_TOO_WEAK` SHALL mark the password field invalid with no text, as for unmet live rules. If any entry names a field other than `email` or `password`, or a code without a text, the generic banner SHALL show and no field error from that response SHALL show." Add the scenarios "Server weak password" and "Known and unknown field together". Record the deviation from *New field code*.
- Proposed fix (A7): password `TOO_SHORT`/`PASSWORD_TOO_WEAK` → `rulesUnmet`. Email `INVALID_CHARACTER` or an unknown code → "Enter a valid email address." Password unknown code → `rulesUnmet`. Only an unknown field gives the banner.
- Proposed fix (D7): map `TOO_SHORT`/`PASSWORD_TOO_WEAK` to `rulesUnmet`, and add both codes to the `fieldErrorText` tests in tasks.md 3.4.
- Test sketch: UI (Root with a fake returning `invalidFields` `[{field:'password', code:'PASSWORD_TOO_WEAK'}]`). The password has `aria-invalid="true"`, with no text and no `role="alert"`.
- Upstream: no

### T5: "Next submit" doesn't say whether a submit blocked by validation clears the banner
**Status:** applied
- Severity: major. Two valid tests disagree, and the session expired banner's lifetime depends on it.
- Location: specs/web-auth/spec.md > Banners clear on the next submit; Session expired state
- Current text: "A banner from a failed request SHALL stay until the next submit ... Submitting SHALL remove the current banner before the new request starts." / "The banner SHALL stay while the user types and SHALL go away on the next submit."
- Problem: the design dispatches `submitted` only when a request starts. React Hook Form doesn't call the handler for an invalid form, so a blocked submit keeps the banner. The spec can be read either way.
- Failure scenario: the session expired banner shows, and the user clears the email and presses "Log in". One test expects the banner to go away, and the implementation keeps it.
- Proposed fix: "until the next submit that sends a request". Add the scenario "Blocked submit keeps the banner" (session expired banner + empty email submit → no request, banner stays). If the other behavior is wanted, dispatch `submitted` on every attempt.
- Test sketch: UI (LoginRoot, `isSessionExpired`). Clicking "Log in" empty leaves `role="status"` present and the fake not called.
- Upstream: no

### T6 (merged with D4): The "Session interface for the app" requirement specifies connect behavior this change can't build or test
**Status:** applied · Part of conflict C2 · Severity: major (both)
- Location: specs/web-auth/spec.md > Requirement: Session interface for the app (all three scenarios); Session expired state ("Leaving the screen SHALL end the state")
- Current text: "It SHALL NOT be kept in browser storage. Log out SHALL end the session at once, without a confirmation, and SHALL ignore a failed server response. After log out the log in screen SHALL show without a banner." Also the scenarios "Email after a reload" and "Log out with a server error".
- Problem: this change has no server call, reload restore, route or app shell (D1, D3). Task 2.1 only tests the provider and the fake. After archive, the main spec would claim behavior no code implements.
- Failure scenario: connect forgets to discard tokens when log out gets a 500. Nothing in this change's tests covers that, and connect has no delta pointing at it. Or verify of this change can't demonstrate the scenario.
- Proposed fix (D4 wording; T6 is equivalent): replace the requirement with "The app SHALL give the app shell the signed-in user's email and a log out action through one session interface, so screens don't request the email themselves. The email SHALL be unknown until the session has loaded it. Log out SHALL NOT ask for a confirmation." Add the scenarios "Email in the shell", "Email not loaded yet" and "Log out without confirmation". Add to tasks.md > Workflow follow-up: "`web-auth-connect` specifies and tests: the email is never in browser storage, log out ignores a failed server response, log out lands on log in without a banner, the reload restore with `email: null`, and the session expired flag ending on navigation (D7, D9, D11)."
- Test sketch: UI here (component reads the session). Route/MSW tests in connect (logout 500 → log in route with no banner).
- Upstream: no

### A1: The mismatch check is assumed to run while other fields have errors
**Status:** applied
- Severity: major. With Zod 4 the Figma "Live password check and mismatch" state can't appear, and submit doesn't show every error.
- Location: design.md > Decisions > Client rules ("Repeat password"); tasks.md 3.3
- Current text: "**Repeat password**: `""` → `REQUIRED`, otherwise it must equal the password, raw → `mismatch`."
- Assumption: an object-level Zod refinement for the mismatch runs even when another field already has an issue.
- Problem: `zod` is installed unpinned, which gives Zod 4. In Zod 4, object-level `.refine`/`.superRefine` checks are skipped once any property has an issue, unless the `when` option is used. `zodResolver` runs the whole schema.
- Failure scenario: the user types `abcdefghijkl`, then a different repeat value, and leaves the field. No mismatch shows. Submitting with an invalid email and a mismatch shows only the email error.
- Proposed fix: add to design.md > Client rules: "The mismatch check is an object-level refinement with a `when` condition that only requires `password` and `repeatPassword` to be strings. It runs even when email or the password rules have issues. Zod 4 skips object refinements by default once any field has an issue." Add to tasks.md 3.3: "Mismatch reported together with an invalid email, and together with `rulesUnmet`."
- Upstream: no

### A2 (merged with D1): `deps: ['repeatPassword']` shows a repeat error before the repeat field is touched
**Status:** applied · Severity: major (both)
- Location: design.md > Decisions > Forms; tasks.md 5.3
- Current text: "The password field registers with `deps: ['repeatPassword']`, so \"Passwords don't match.\" updates when the password changes."
- Problem: React Hook Form calls `trigger(deps)` whenever the password field validates, and `trigger` sets errors whether or not the target was touched. In `onTouched` mode that first happens when the password loses focus.
- Failure scenario: the user types a password and tabs to Repeat password. "Repeat your password." appears at once, which contradicts D4 and "When field errors show".
- Proposed fix: replace the bullet with: "The password field's `onChange` calls `trigger('repeatPassword')` only when the repeat field is touched or the form was submitted (`getFieldState('repeatPassword').isTouched || formState.isSubmitted`). `deps` is not used, because it validates the dependent field even when it is untouched." Add to tasks.md 5.3: "Leaving or editing the password with the repeat field untouched shows no repeat error."
- Upstream: no

### A3: The double-submit guard assumes React state updates before the second submit
**Status:** rejected · Related: T3 · The user rejected it as a nitpick. `Button` with `isLoading` already blocks a second activation, and the remaining window is a few milliseconds.
- Severity: major. Two requests can go out, and a 409 can show after a successful register.
- Location: design.md > Request state and banners > "Double submit"; spec.md > Request in progress
- Current text: "**Double submit**: blocked by checking `isSubmitting` in the view-model before calling the injected function."
- Assumption: `isSubmitting` is already re-rendered into the handler's closure when the second submit arrives.
- Problem: `handleSubmit` awaits the async resolver before calling the handler. Two submits inside that gap both read the stale `false`. A test that submits again after a re-render doesn't catch this.
- Failure scenario: Enter pressed twice quickly on register. The first creates the account, the second returns 409, and the form may show "An account with this email already exists." while the user is signed in.
- Proposed fix: "**Double submit**: blocked by a ref set synchronously when the submit starts, before validation awaits, and cleared when the request ends. Reducer state alone can be stale across the resolver's await." Add to tasks.md 4.2: "two submits fired in the same tick make one call."
- Upstream: no

### A4: The screen is assumed to stay mounted until the request ends
**Status:** applied
- Severity: major. The user can end up signed in without the host knowing.
- Location: spec.md > Request in progress; design.md > Request state and banners > "Success"
- Current text: "While a log in or register request runs, all fields SHALL be disabled." / "**Success** calls `onLoggedIn` or `onRegistered` and shows nothing itself."
- Problem: the switch link and the back button stay usable. What happens when the request settles after the Root unmounts isn't specified.
- Failure scenario: the user presses "Log in", then clicks "Create one". Log in succeeds and the token is stored. Either the user sits on register while signed in, or they get redirected without warning.
- Proposed fix: add to spec.md > Request in progress: "Leaving the screen while a request runs SHALL NOT cancel it. If the request succeeds after the screen is gone, the host SHALL still be told, so the app never holds a session it doesn't know about. Failures after leaving SHALL be ignored." Add a matching line to design.md > Success. Alternative (UI decision): make the switch link inert during a request.
- Upstream: no

### A5: Logging out is assumed never to turn into "session expired"
**Status:** applied with edits (recorded as connect behavior in design.md and tasks.md, per C2)
- Severity: major.
- Location: spec.md > Session interface for the app; design.md > Session interface
- Current text: "Log out SHALL end the session at once, without a confirmation, and SHALL ignore a failed server response. After log out the log in screen SHALL show without a banner."
- Problem: a query still running at log out gets 401, refreshes, and gets `INVALID_REFRESH_TOKEN`, which sets the expired flag (D9). The cross-tab broadcast also ends other tabs, and nothing says which login state they show.
- Failure scenario: Log out while the board list reloads lands on "Your session has expired…", which contradicts D7.
- Proposed fix: add to the requirement: "A session the user ended with log out, in this tab or another tab, SHALL NOT be reported as expired. A refresh rejected after log out started SHALL NOT set the session expired flag." Add a matching follow-up line for `web-auth-connect`.
- Upstream: no

### A6: The interface assumes `useSession` is never read after the session ends
**Status:** applied
- Severity: major. Board list builds against this interface now, and connect must not change callers (D13).
- Location: design.md > Session interface
- Current text: "`useSession` throws outside a provider. The shell only renders for a signed-in user, so a missing provider is a programming error"
- Problem: `AuthSession` has no signed-out state. The interface doesn't say what the provider gives between `logOut()` and the redirect.
- Failure scenario: connect clears the store, and the provider renders without a value one render before the route leaves `_authenticated`. `useSession()` throws, and the error boundary shows a blank page.
- Proposed fix: add to design.md > Session interface: "After `logOut`, the host removes the signed-in tree, including `SessionProvider`, in the same update that ends the session. Until then the provider keeps its last value. `AuthSession` has no signed-out state, and consumers never see one."
- Upstream: no

### D2: The session Context in `core/auth/session.tsx` clashes with the project's session module and file patterns
**Status:** applied
- Severity: major. Connect would have to rename a module that board list already imports.
- Location: design.md > Decisions > Module layout, Session interface; tasks.md 2.1
- Current text: "session.tsx          AuthSession type, SessionProvider, useSession()" and "Connect replaces the fake with the real session in the same module, so callers don't change."
- Problem: the `react-security` skill reserves `src/core/auth/session.ts` for the token and status store. `session.ts` next to `session.tsx` makes `@/core/auth/session` ambiguous. The repo splits context and provider (`ToastContext.ts` / `Toast.tsx`), and one `.tsx` file with a provider and a hook trips `react/only-export-components`. `react-project-structure` says "Don't add a Context to swap implementations for tests", and the design doesn't explain why this one is fine.
- Failure scenario: connect adds `session.ts`, and imports become ambiguous or every importer is renamed.
- Proposed fix: Module layout: `SessionContext.ts` (`AuthSession`, `SessionContext`, `useSession()`), `SessionProvider.tsx`, `fakeSession.ts`. Add: "`session.ts` stays free for the token and status store from `react-security`, which `web-auth-connect` adds. Connect provides `SessionProvider` once in `App.tsx` with a value built from that store. This is an app-wide object, not a Context for swapping implementations in tests, so it fits `react-project-structure`. The file split follows `ToastContext.ts`/`Toast.tsx`." Update the file names in tasks.md 2.1.
- Upstream: no

### D3: The web foundation change still gives this change the login routes, the account footer and the redirect
**Status:** applied
- Severity: major. Two active changes give the same work to different owners.
- Location: proposal.md > Impact > Other changes. The conflicting text is in add-web-foundation decisions.md D2 and D4 and its design.md > Route files and Shell composition.
- Current text: here: "`web-auth-connect` implements the injected calls, the real session, the routes and the redirect after log in." Foundation D4: "Auth adds the account footer (email + log out)." Foundation D2: "Web auth owns the `redirect` search param on `/login` and the safe same-origin check". Foundation design: "`routes/login.tsx`, `routes/register.tsx` (web auth)" and "`<AccountFooter />` from auth".
- Problem: auth D1, D3 and D8 and board list D15 put these in `web-auth-connect` and board list. The foundation still names "web auth".
- Failure scenario: `AccountFooter` and `routes/login.tsx` are expected from this change and never arrive, or two account footers get built.
- Proposed fix: add to proposal.md > Impact > Other changes: "The web foundation change's notes that 'web auth' adds `/login`, `/register`, the `redirect` param and the account footer are out of date. Routes and the redirect belong to `web-auth-connect` (D1, D8). The sidebar footer and phone menu belong to board list, fed from `useSession()` (D3). The foundation change should update its D2, D4 and design.md 'Route files' / 'Shell composition' to match." Tell the coordinator.
- Upstream: no

### D5: The "error state with no text" plan doesn't match `Field` or React Hook Form
**Status:** applied
- Severity: major. The danger border wouldn't show, or wouldn't clear as specified.
- Location: design.md > Decisions > Forms; Request state and banners
- Current text: "`fieldErrorText` renders no text for it, but the field still gets `aria-invalid` and the danger border." / "Wrong credentials also set a password error with an empty text, for the danger border (D10). The form's `onChange` dispatches `edited`, which clears the banner and that error."
- Problem: `core/ui/Field` sets `aria-invalid` only when `error` is truthy (`error ? true : undefined`), so an empty text gives no border. Only `Input`'s `isInvalid` does. The reducer can't clear a React Hook Form error, so a `setError` on `password` stays when the user edits the email.
- Failure scenario: submitting `abcdefghijkl` gives no red border. Or after a wrong password the user edits the email, the banner goes, and the red password border stays.
- Proposed fix: "The password `Input` gets `isInvalid` when the field has any form error, including `rulesUnmet`, or when `banner === 'invalidCredentials'`. `Field` gets `error` only when `fieldErrorText` returns text, because `Field` treats an empty error as no error." And: "Wrong credentials set no form error. The border comes from the reducer's banner, so `edited` clears the banner and the border together."
- Upstream: no

### D6: The docs edit targets `CLAUDE.md`, but the text lives in `AGENTS.md`, and the plan leaves contradicting lines
**Status:** applied
- Severity: major. Future agents keep reading "ask before building its UI".
- Location: design.md > Docs; tasks.md 6.2; proposal.md > What Changes (Docs) and Impact
- Current text: "`CLAUDE.md` → Authentication: replace `RATE_LIMIT_EXCEEDED` with `RATE_LIMITED`. ... Drop the matching item from \"Open Items\" (D12)."
- Problem: `CLAUDE.md` only contains `@AGENTS.md`. The bullet (AGENTS.md:161) also says "There is no design for this state yet, so ask before building its UI.", which D6 has settled. "The matching item" could be either of two Open Items (AGENTS.md:251–252).
- Failure scenario: a paragraph is added to `CLAUDE.md`, and `AGENTS.md` keeps telling agents to stop and ask about 429.
- Proposed fix: replace design.md > Docs with: "`AGENTS.md` (which `CLAUDE.md` includes) → Authentication: replace the last bullet with: 'Log in and register are rate limited per email. Refresh and log out are never rate limited. A `429` comes with code `RATE_LIMITED` and a `Retry-After` header. The auth screens show it in the error banner (see `openspec/specs/web-auth`).' Open Items: delete 'Whether refresh and logout get a rate limit (still open on the backend).' and change 'Designs for: rate limit (`429`), network error, offline, not-found page.' to 'Designs for: network error and offline outside the auth screens, not-found page.'" Change `CLAUDE.md` to `AGENTS.md` in tasks.md 6.2 and proposal.md.
- Upstream: no

### S2: The log out requirement doesn't say what "end the session" clears
**Status:** open · Part of conflict C2
- Severity: minor. AGENTS.md and the `react-security` skill already require it, but the spec connect treats as acceptance criteria has no scenario for it.
- Location: specs/web-auth/spec.md > Requirement: Session interface for the app
- Current text: "Log out SHALL end the session at once, without a confirmation, and SHALL ignore a failed server response. After log out the log in screen SHALL show without a banner."
- Problem: "end the session" is only checked through the fake.
- Failure scenario: connect clears the token but not `queryClient`. User B logs in on the same tab and briefly sees A's cached board list (`staleTime: Infinity`). A second tab keeps showing A's boards.
- Proposed fix: append "Ending the session SHALL remove all cached user data and SHALL end the session in every open tab." Add the scenario "Next user sees no previous data". Note in tasks.md > Workflow follow-up that connect tests it.
- Upstream: no

### T7: Scenarios phrased at the HTTP level, and one that can't fail on the client
**Status:** open
- Severity: minor.
- Location: specs/web-auth/spec.md > Rate limited ("No usable Retry-After", "Correct password over the limit"); Wrong email or password; Email already registered; Other failures; tasks.md 5.2
- Current text: "**WHEN** register fails with 429 and `Retry-After` is missing or not a positive whole number" and "**WHEN** a log in with the correct password fails with 429 / **THEN** the rate limit banner shows, not the wrong credentials banner"
- Problem: header parsing doesn't exist in this change. "Correct password over the limit" is a server ordering guarantee and is the same client input as "Twelve seconds".
- Failure scenario: connect parses `Retry-After: 0` or `1.5` and shows "Try again in 0 seconds". No test in either change targets it.
- Proposed fix: delete "Correct password over the limit" (covered by `api-errors` *Rate limit is checked before credentials*). In tasks.md > Workflow follow-up, add: "`web-auth-connect` covers every HTTP-level scenario in `web-auth` (401, 409, 429 with `Retry-After` of 12, 0, 1.5, an HTTP date and missing, 5xx, non-problem body, network error) with MSW feature tests." In tasks.md 5.2, replace "including the correct password over the limit" with "with the fake returning `rateLimited` with 12 and `null`".
- Upstream: no

### T8: WHEN clauses leave out the blur or submit the error depends on
**Status:** open
- Severity: minor.
- Location: specs/web-auth/spec.md > Register email check > "Email over the limit"; Register password checks > "Unpaired surrogate", "Passwords differ"
- Current text: "**WHEN** the email has a normalized length of 255", "**WHEN** the register password contains an unpaired surrogate", "**WHEN** the repeated password differs from the password"
- Problem: without blur or submit, no error shows per "When field errors show". The 255 case doesn't test the length-before-format order. No 254 acceptance scenario.
- Failure scenario: a tester asserts the mismatch text right after typing, and the correct `onTouched` implementation fails.
- Proposed fix: "the user leaves the register email field holding an email of 255 code points that also fails the format check / THEN only the length text". Add "Email at the limit" (254, valid → no error). Prefix the surrogate and mismatch WHENs with "the user leaves the … field holding …".
- Upstream: no

### T9: Promises with no scenario
**Status:** open
- Severity: minor.
- Location: specs/web-auth/spec.md > When field errors show; Request in progress; Wrong email or password; Log in checks only for filled-in fields
- Current text: "The submit button SHALL stay enabled." / "move focus to the first field in error" / "When the request ends, the fields SHALL be enabled again." / "clear on the next edit of either field" / "It SHALL NOT check the email format or any length."
- Problem: focus is only tested with the email first. Nothing covers re-enabling after failure, editing the password after wrong credentials, over-length log in values, or which values log in sends.
- Failure scenario: `form.focus()` on the email passes the only focus scenario, but focus lands wrong when only the password is empty.
- Proposed fix: add the scenarios "Focus on the first field in error", "Fields enabled after a failure", "Editing the password clears wrong credentials" and "Long values are sent on log in" (` Ann@Example.com ` + 200 code points → sent as `Ann@Example.com` and the unchanged password).
- Upstream: no

### T10: "Error border" isn't observable in the test environment
**Status:** open
- Severity: minor.
- Location: specs/web-auth/spec.md > Wrong email or password > "Wrong password", "Edit after failure"; Unmet password rules on submit > "Submit a weak password"
- Current text: "the password field shows its error border"
- Problem: jsdom doesn't compute Tailwind styles, so tests pick their own proxy.
- Failure scenario: a test checks `border-danger`, and a refactor of `Input` breaks it without a behavior change.
- Proposed fix: "is marked invalid (`aria-invalid`), which shows the error border". In "Edit after failure": "the banner disappears and the password field is no longer marked invalid".
- Upstream: no

### T11: D18 accessibility names and autocomplete tokens aren't in the spec
**Status:** open
- Severity: minor.
- Location: specs/web-auth/spec.md > Log in form; Register form; Live password rules
- Current text: "The email field SHALL be single-line and offer saved emails. The password field SHALL hide its text, offer saved passwords and allow pasting." / "SHALL let password managers suggest a new password." / "Each rule SHALL also state "met" or "not met" in text for screen readers."
- Problem: "offers saved passwords" is browser-dependent and untestable. The observable contract is the `autocomplete` token. D18's names and roles aren't in the spec, and "met" doesn't match D18's "Met".
- Failure scenario: `autocomplete="email"` on log in passes every spec scenario, and password managers stop pairing.
- Proposed fix: use `autocomplete="username"` / `current-password` / `new-password` in the requirement text. Live rules: "Each rule SHALL be preceded by the screen reader text "Met" or "Not met", and the rules SHALL be a list named "Password requirements"." Each form: "The form SHALL be named by its title. Error banners SHALL use `role="alert"` and the session expired banner `role="status"`." Add the scenario "Rules for screen readers".
- Upstream: no

### T12: Layout scenarios can only be checked by hand
**Status:** open
- Severity: minor.
- Location: specs/web-auth/spec.md > Auth layout per size > "Desktop", "Phone"; tasks.md 5.1
- Current text: "the brand and the card are centered horizontally and vertically, with the card 380 px wide"
- Problem: jsdom has no layout, and Playwright isn't installed.
- Failure scenario: a breakpoint class is dropped and all gates pass.
- Proposed fix: append to tasks.md 5.1: "These two scenarios are verified manually against Figma; record the check in the commit message." Alternative: a Playwright visual check, which needs approval for a new dependency.
- Upstream: no

### A8: `isSessionExpired` is assumed to be final when LoginRoot mounts
**Status:** open
- Severity: minor.
- Location: design.md > Request state and banners
- Current text: "The initial banner is `'sessionExpired'` when `isSessionExpired` is set (D9)."
- Problem: the prop only seeds initial state. If connect navigates first and sets the flag after, the banner never shows.
- Failure scenario: the refresh is rejected, the redirect happens, the flag updates later, and the user sees no explanation.
- Proposed fix: "`isSessionExpired` is read once on mount. Later changes are ignored. Connect sets the flag before it navigates to log in."
- Upstream: no

### A9: `GET /users/me` is assumed to succeed after restore
**Status:** open
- Severity: minor.
- Location: design.md > Session interface; spec.md > Session interface for the app
- Current text: "After a reload, `web-auth-connect` restores the session with a refresh, then calls `GET /api/v1/users/me` once and fills `email`. Until then it is `null` (D11)."
- Problem: if the one call fails, `email` stays `null` for the page lifetime.
- Failure scenario: a flaky connection at load, and the sidebar never shows "Signed in as" until a reload.
- Proposed fix: "If `/users/me` fails, `email` stays `null`, and connect tries again on the next successful protected request (or loads it as a TanStack Query query with the default retry). 'Once' means one successful load per session, not one attempt."
- Upstream: no

### A10: `type="email"` is assumed to give back what the user typed
**Status:** open
- Severity: minor.
- Location: design.md > Forms > `autocomplete` bullet
- Current text: "`type=\"email\"` keeps the email keyboard on phones, and `noValidate` keeps the browser's own bubbles away."
- Problem: Chromium converts IDN domains to punycode in `.value`, and Firefox doesn't. `ann@münchen.de` passes in Chrome and fails in Firefox.
- Failure scenario: a Chrome user registers `ann@münchen.de` and later sees "Signed in as ann@xn--mnchen-3ya.de".
- Proposed fix: "The email input uses `type=\"text\"` with `inputMode=\"email\"`, `autoCapitalize=\"none\"` and `spellCheck={false}`, because `type=\"email\"` makes Chromium convert IDN domains to punycode and browsers then differ on the `domain-user` ASCII rule." Alternative: keep `type="email"` and document the trade-off.
- Upstream: no

### D8: A rejected `logIn` or `register` promise is not handled
**Status:** open
- Severity: minor.
- Location: design.md > Injected calls and result types; tasks.md 4.2
- Current text: "export type LogIn = (input: { email: string; password: string }) => Promise<AuthResult>"
- Problem: `useImportViewModel` maps a throw to `{ kind: 'other' }`. The auth design doesn't, so `isSubmitting` never resets.
- Failure scenario: connect's `logIn` throws on a JSON parse error, and the button spins forever.
- Proposed fix: "The view-model treats a rejected `logIn` or `register` promise as `{ kind: 'other' }`, as `useImportViewModel` does." Add to tasks.md 4.2: "including an injected function that rejects, which shows the generic banner and enables the fields again."
- Upstream: no

### D9: An auth section on the design-system preview page doesn't fit the feature-playground pattern
**Status:** open
- Severity: minor.
- Location: design.md > Context; tasks.md 6.1; proposal.md > Impact
- Current text: "Add `src/preview/sections/AuthSection.tsx`: Both screens with a fake `logIn`/`register`, and a scenario picker ..."
- Problem: `transfer` uses `TransferPlayground` at `?transfer`. `AuthLayout` centers on the full viewport, which a section can't show.
- Failure scenario: the 1440 px centering check can't be done inside a section.
- Proposed fix: "`src/preview/AuthPlayground.tsx`, opened with `?auth` in `src/preview/main.tsx` like `?transfer`, and linked from the preview page intro." Update proposal.md > Impact and design.md > Context.
- Upstream: no

## Security analysis

### Trust boundaries

- **Server responses → screens (through `AuthResult`)**: a crafted `detail` or field name. Blocked: `AuthFailure` has no free-text member, and an unknown field gives `other` (design.md > Request state; spec scenario "Unknown field").
- **Log in / register user input**: very long or crafted input to trigger regex backtracking (self-DoS only). Blocked: the length check runs first, `isAddrSpec` has no nested quantifiers, there is a 250 KB timing test in task 3.1, and log in does no format check.
- **Account enumeration through error responses**: blocked by the single `INVALID_CREDENTIALS` message and 429 before credentials. Register's 409 reveals a used email, which is shared-spec behavior.
- **Log out → refresh cookie (web only)**: the next person on a shared computer after a failed log out. Not stopped → S1.
- **Session end → cached user data and other tabs**: covered by AGENTS.md and the `react-security` skill, but not by a spec scenario → S2.
- **Post-login redirect target (D8)**: `//evil.example`. This is connect's work, and `safeRedirectPath` in `react-security` covers it. No finding.
- **Session expired flag and email in storage or URL**: blocked by D9 (in memory, no prefill) and the "Email after a reload" scenario.
- **Dev preview page and fake session**: `preview.html` isn't a rollup input, so it isn't built. The fake is only reachable from tests or the preview. No finding.

### Test versus production

- **Session interface > "Log out with a server error"**: the fake ends the in-memory session, so the test is green. In production the httpOnly cookie survives and a reload restores the session. Closed by S1 plus a connect-level reload scenario.
- **Session interface > "Email after a reload"**: only connect could break it by caching, and the scenario is written so connect can test it. No gap.
- **Wrong credentials / Rate limited before credentials**: `AuthFailure` has no member to tell an unknown email from a wrong password. No gap.
- **Request in progress > "Double submit"**: a same-tick double submit is possible, at most one extra request. Not a security concern (see A3 and T3 for the functional side).

## Assumptions safe to leave implicit

| Assumption | Where it is implied | Why it is safe |
|---|---|---|
| `\p{..}` with the `u` flag, `isWellFormed()` and `Intl.PluralRules` exist | design.md > Client rules, Rate limit text | Available in the supported browser versions. The foundation already checked `isWellFormed`. |
| `Retry-After` is in delta seconds, not an HTTP date | spec.md > Rate limited | `api-auth-tokens` requires whole seconds ≥ 1. Anything else falls back to the generic banner (D16). |
| The `Retry-After` header is readable from JS | design.md > Injected calls | Same origin, so no CORS exposed-header limits. Connect parses it. |
| No clock or time zone dependency | spec.md > Rate limited | Relative header value, no countdown (D6). |
| English pluralization only | spec.md > Rate limited | AGENTS.md: English only. |
| Values survive disabling the inputs during a request | design.md > Risks | Stated, with a planned test. |
| Reload during a request loses the result | spec.md > Successful log in and register | A repeat register gives the specified 409, and a repeat log in works. |
| Board list handles a `null` email | design.md > Risks | The board list design says `null` hides the email. |
| The foundation helper and libraries exist | tasks.md 1.1 | The task checks and stops if one is missing. |

## New abstractions

- `AuthSession` + `SessionProvider` + `useSession` (Context in `core/auth`): **challenge** (D2). Keep the Context, split the files like `ToastContext.ts`/`Toast.tsx`, keep `session.ts` free, and document why the Context fits.
- `createFakeSession`: fine as is.
- `LogIn` / `Register` / `AuthResult` / `AuthFailure` / `FieldFailure`: fine as is. Mirrors `transfer/types.ts`. Rejection handling is missing (D8).
- `LoginRoot` / `RegisterRoot` with render-slot link props: keep. The reason is documented.
- `authRequestReducer`: fine as is.
- `useLoginViewModel` / `useRegisterViewModel`: fine as is.
- Zod schemas `loginForm.ts` / `registerForm.ts`: fine as is.
- `rulesUnmet` pseudo-code: keep. The rendering path needs fixing (D5).
- `isAddrSpec`: keep. Justified and documented.
- `passwordRules`, `retryAfterText`, `fieldErrorText`: fine as is.
- `PasswordRules` component: fine as is.
- `AuthLayout`: fine as is.
- `features/auth/index.ts`: fine as is. Matches repo practice. The skill's "no barrel files" rule differs from that practice, but that is not specific to this change.
- `auth` i18n namespace: fine as is.
- `AuthSection` preview: **challenge** (D9). Use a playground page.

## Coverage

- Artifacts reviewed: proposal.md, specs/web-auth/spec.md, design.md, tasks.md, decisions.md (D1–D18, used as settled decisions)
- Missing artifacts: none
- Testability: all requirements and scenarios in specs/web-auth/spec.md. 16 requirements were flagged, and "Email already registered" and "Successful log in and register" had no findings. The shared specs `domain-user`, `text-length` and `api-auth-tokens` weren't fetched; the reviewer relied on the facts in decisions.md.
- Security: 7 trust boundaries and 4 invariants. `domain-user`, `text-length` and `api-errors` weren't read in full. There is no HTTP or token code yet.
- Hidden assumptions: all areas were checked except resources (quotas, memory, disk), which don't apply. A1, A2 and A10 rest on documented library and browser behavior and weren't run.
- Design contract: code mode. `core/ui`, `features/transfer`, `src/app`, `src/preview`, `.oxlintrc.json`, the skills, and the other active changes (add-web-foundation, add-board-list-ui, add-board-view-ui) were checked. Figma frames and `text-length` weren't checked.
- Reviewers that did not complete: none
- Duplicates merged: A2 + D1, T4 + A7 + D7, T6 + D4
- Findings dropped because their evidence did not exist: 0
- Findings dropped because they challenged decisions.md: 0

## Applied changes

- Files changed: `specs/web-auth/spec.md`, `design.md`, `tasks.md`, `proposal.md`
- Spec structure: to stay under the 500-character requirement limit, the T2 order rule became the new requirement "One password error at a time", and the T4/A7 server field rules became the new requirement "Server field errors", split out of "Other failures". "Leaving the screen SHALL end the state" moved from "Session expired state" to the connect follow-up (T6).
- `openspec validate add-auth-ui --strict`: valid
- Stale non-standard artifacts the user chose not to update: none (there are no non-standard artifacts)
- Contradictions with decisions.md:
  - D6 says "Field errors the form can't show fall back to the generic banner." Under C1 (A7), unknown email and password codes now show on their field, and only an unknown field gives the banner. This is consistent if "can't show" means "a field the form doesn't have", but D6 doesn't say that. decisions.md was not edited.
  - D12 says "This change corrects `CLAUDE.md`." The edit now targets `AGENTS.md`, which `CLAUDE.md` includes. The intent is the same.
- Outside this change: D3 asks the add-web-foundation change to update its D2, D4 and design.md. That change was not edited; tell the coordinator.
- Accepted risks: none (no blocker was rejected). A3 (major) was rejected.
- Open: all minors (S2, T7–T12, A8–A10, D8, D9).
- The new wording of the applied majors has not been reviewed. Re-run the review in a fresh session.
