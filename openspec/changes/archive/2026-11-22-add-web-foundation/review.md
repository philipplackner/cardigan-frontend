# Artifact review (light): add-web-foundation

**Verdict:** Ready
**Reviewed:** 2026-11-21, schema `careful-planning`, repo kind `code`

| Pass | Blocker | Major | Minor |
|---|---|---|---|
| Testability | 0 | 0 | 3 |
| Security | 0 | 0 | 0 |
| Hidden assumptions | 0 | 1 | 1 |
| Design contract | 0 | 2 | 3 |

## Findings

### D1: React logs caught route errors in production by default
**Severity:** major · **Status:** applied
**Location:** design.md > Route files; specs/web-app-shell/spec.md > Loading and failed pages show a blank main area
**Current text:** "The error component logs with `console.error` only when `import.meta.env.DEV`." / "Production builds SHALL NOT log it."
**Failure scenario:** TanStack Router's `CatchBoundary` is a React error boundary. React 19's default `onCaughtError` calls `console.error(error)` in production too (checked in `react-dom` 19.3.1, `react-dom-client.production.js`, `defaultOnCaughtError`). A page that throws in the production build logs the error, its message and any data in it, so the spec fails. Route tests run as a dev build and can't catch this. In dev, the error is also logged twice (React and `BlankPage`).
**Fix:** In design.md > Route files, replace the sentence with: "`main.tsx` passes `onCaughtError` and `onUncaughtError` to `createRoot`. Both log with `console.error` only when `import.meta.env.DEV` and do nothing otherwise. `BlankPage` doesn't log." In tasks.md 5.3, add: "Pass the dev-only `onCaughtError`/`onUncaughtError` handlers to `createRoot` in `src/main.tsx`. Verify: a unit test of the handler factory shows it logs with DEV true and stays silent with DEV false." In proposal.md > Impact > Code, add `src/main.tsx`.

### D2: Design contradicts itself on where the character check runs
**Severity:** major · **Status:** applied
**Location:** design.md > Text helper (D8)
**Current text:** "The order puts invalid characters before length, so a single tab in a single-line field is reported as invalid, not as empty after trimming would hide it. Because trimming removes a leading or trailing tab, the character check runs on the normalized value: a tab only fails when it is inside the text, …"
**Failure scenario:** The first sentence only holds if the check runs on the raw value. An implementer who follows it rejects `"Release\n"` (pasted with a trailing line break) in a single-line field as `INVALID_CHARACTER`. The backend accepts that text after normalizing, which breaks shared `text-length` "Clients validate with the same rule". On the normalized value, a lone tab becomes `""` and returns `EMPTY`.
**Fix:** Replace both sentences with: "The character check runs on the normalized value, like the backend. A tab or line break at the edge of a single-line value is trimmed away and never fails. A single tab on its own normalizes to `""` and returns `EMPTY`. A tab inside the text returns `INVALID_CHARACTER`. Empty text can't contain an invalid character, so the order of `EMPTY` and `INVALID_CHARACTER` never matters. `INVALID_CHARACTER` before `TOO_SHORT` and `TOO_LONG` follows shared `api-errors` › One field error per field."

### A1: Requests made while offline are held and sent later
**Severity:** major · **Status:** applied
**Location:** design.md > Query client (D7); specs/web-app-shell/spec.md > Server data reloads only on intent, Failed requests are not retried automatically
**Current text:** "queries: { staleTime: Infinity, refetchOnWindowFocus: false, refetchOnReconnect: false, refetchOnMount: false, retry: false }, mutations: { retry: false }"
**Failure scenario:** TanStack Query's default `networkMode: 'online'` pauses queries and mutations while `navigator.onLine` is false and sends them when the network returns. A user who deletes a board while offline sees no error, and the delete runs minutes later on reconnect. A page opened offline stays on the pending state and then loads when the network returns, which the spec rules out ("SHALL NOT reload it … when the network comes back"). Two implementers can read the spec either way.
**Fix:** In design.md, add `networkMode: 'always'` to both `queries` and `mutations` in `createQueryClient`, with the line: "`networkMode: 'always'` so a request made offline fails at once and is never held for later." Add to the spec requirement "Failed requests are not retried automatically": "A request made while the browser is offline SHALL be sent at once and SHALL NOT be held to be sent when the network returns." with the scenario: "**WHEN** the browser is offline and the user starts a change **THEN** the request fails at once, and no request is sent when the network comes back". Add `networkMode` to the assertions in tasks.md 3.1.

### T1: "The sidebar still works" can't be checked in this change
**Severity:** minor · **Status:** applied
**Location:** specs/web-app-shell/spec.md > Loading and failed pages show a blank main area > Page fails to render
**Current text:** "**THEN** its main area is blank and the sidebar still works"
**Failure scenario:** The sidebar holds only the brand here, so there's nothing to "work". A shell that is replaced entirely by `BlankPage` (error caught at the root) passes a test that only checks that something renders.
**Fix:** "**THEN** the `main` element is empty, the sidebar with the brand is still rendered, and navigating to `/` afterwards renders the index page inside the same shell". Catches: the error caught by the root route, which drops the shell.

### T2: "Stays at the top" isn't observable in route tests
**Severity:** minor · **Status:** open
**Location:** specs/web-app-shell/spec.md > Each page provides its phone top bar > Page with its own bar
**Current text:** "**THEN** that page's bar is shown and stays at the top"
**Failure scenario:** jsdom does no layout or scrolling. A bar portaled into the `main` element passes a test that only checks the bar is visible.
**Fix:** "**THEN** that page's bar is rendered in the phone top-bar region, outside the scrolling `main` element". Catches: rendering the `AppBar` inside the page content.

### T3: The 5-minute drop is never tested against the real client
**Severity:** minor · **Status:** open
**Location:** design.md > Query client (D7); tasks.md > 3.1
**Current text:** "`createTestQueryClient()` lives next to it with the same defaults and `gcTime: Infinity` so tests don't leave timers." / "Verify: … default gcTime"
**Failure scenario:** Route and feature tests use `gcTime: Infinity`, so "Revisiting a page later" holds in no test. Asserting "default gcTime" passes even if someone later sets `gcTime: Infinity` in `createQueryClient` while also changing the test, and the test client would hide it anyway.
**Fix:** tasks.md 3.1 Verify: "`queryClient.test.ts` asserts the defaults, and with fake timers shows that a query from `createQueryClient()` with no observer is still cached after 4:59 min and removed after 5:01 min."

### A2: How long the previous page stays before the blank pending state
**Severity:** minor · **Status:** open
**Location:** specs/web-app-shell/spec.md > Loading and failed pages show a blank main area
**Current text:** "While a page inside the shell is still loading, … its main area SHALL be blank"
**Failure scenario:** The router keeps the previous page on screen for `defaultPendingMs` (1 s) and then shows the pending component for at least `defaultPendingMinMs` (500 ms). One implementer keeps those defaults, another sets `defaultPendingMs: 0`. A test that checks for a blank main area right after navigation fails for the first.
**Fix:** In design.md > Route files add: "`defaultPendingMs` and `defaultPendingMinMs` keep the router defaults (1000 ms, 500 ms)." In the spec: "While a page inside the shell has been loading for more than 1 second, … its main area SHALL be blank. Before that the previous page stays."

### D3: `Sidebar` can't be rendered brand-only as designed
**Severity:** minor · **Status:** open
**Location:** design.md > Shell composition; tasks.md > 4.1
**Current text:** "`sidebar`: `<Sidebar brandName=… navLabel=… />` with no `mainNav`, `boards` or `account` yet." / "Make `Sidebar`'s `mainNav`, `boards`/`boardsAction` and `account` optional"
**Failure scenario:** `boardsHeading` stays required, so the `AppShell` call fails `typecheck`. And with everything omitted, `Sidebar` still renders an empty `<nav aria-label>` landmark that screen readers announce.
**Fix:** tasks.md 4.1: "Make `mainNav`, `boardsHeading`, `boards`/`boardsAction` and `account` optional (`boardsHeading` required when `boards` or `boardsAction` is given). When `mainNav`, `boards` and `boardsAction` are all absent, don't render the `nav` element." Mirror it in design.md > Shell composition.

### D4: No way for a page to fill the shell's panel region
**Severity:** minor · **Status:** open
**Location:** design.md > Shell composition; Open Questions
**Current text:** "`AppShell` in `src/app/shell` renders `AppLayout` with: `sidebar` … `appBar` … `children`"
**Failure scenario:** Card detail uses `AppLayout`'s `panel` region (side panel, full screen on phones, inert background). `AppShell` owns `AppLayout`, so a route under `_authenticated` has no way to pass `panel`. The cards change will have to redesign the shell, or render its own panel and lose the inert handling.
**Fix:** Add to design.md > Open Questions: "How a page fills `AppLayout`'s `panel` region (card detail). Settle in the cards change. Because `AppShell` owns `AppLayout`, it will likely be a second portal slot like `AppBarSlot`."

### D5: Proposal doesn't list `api-errors`
**Severity:** minor · **Status:** applied
**Location:** proposal.md > Shared specs this change implements or depends on
**Current text:** (list has only `text-length` entries)
**Failure scenario:** `checkText`'s order `INVALID_CHARACTER` → `TOO_SHORT` → `TOO_LONG` comes from shared `api-errors`. The config rule requires listing every shared requirement used. Without the link, a change to that shared order won't be traced to this helper.
**Fix:** Add: "- `api-errors`, \"One field error per field\" — depended on: `checkText` reports the first broken rule in this order."

## Trust boundaries

- **URL / unknown paths:** an attacker could try an open redirect through unknown paths. The spec requires a blank page and no redirect. Stopped.
- **`redirect` search param on `/login`:** owned by web auth (D2), not this change. Not in scope.
- **`_authenticated` without a guard:** signed-out users see the empty shell. It holds no data, and the backend is authoritative. Acceptable until auth-connect.
- **Console output in production:** route errors could leak data to the console. The spec forbids it, but React's default handler breaks this in production (see D1).
- **Query cache across sessions:** clearing on logout is set by AGENTS.md (Authentication). Not this change's to add.
- **Preload on intent:** hovering a link loads that page's data for the signed-in user only. No boundary crossed.

## Coverage

- Checked all 7 requirements and 11 scenarios in `specs/web-app-shell/spec.md`, plus decisions.md, proposal.md, design.md and tasks.md.
- Read `AppLayout`, `Sidebar`, `AppBar`, `Toast`, `App.tsx`, `main.tsx`, `vite.config.ts`, `.oxlintrc.json`, shared `text-length` and `api-errors` › One field error per field.
- Skimmed `add-board-list-ui`, `add-board-view-ui` and `add-auth-ui` for references to this change. They match its route, slot and Query defaults. `add-board-list-ui` adds its own `checkSingleLineText` wrapper on top of the helper. That is that change's choice, not a defect here.
- "Log in page" can't be tested until web auth adds `/login`; this change's tasks rightly don't test it.
- Not read: the `react-*` skills, Figma, `web-design-system` main spec beyond its reference, TanStack Router internals beyond the error boundary behavior.

## Applied changes

- **Applied:** D1, D2, A1, T1, D5, as proposed.
- **Still open:** T2, T3, A2, D3, D4 (all minor).
- `design.md`: dev-only `createRootErrorHandlers` passed to `createRoot` in `main.tsx`, and `BlankPage` no longer logs (D1). Text helper paragraph rewritten (D2). `networkMode: 'always'` with its reason (A1). File tree and test list updated to match.
- `specs/web-app-shell/spec.md`: "Page fails to render" THEN rewritten (T1). Offline rule and scenario "Change made offline" added to "Failed requests are not retried automatically" (A1).
- `tasks.md`: 3.1 asserts `networkMode` (A1). 5.3 adds `rootErrorHandlers.ts`, the `main.tsx` wiring and its test (D1). 5.4 throwing-route test matches the new T1 scenario.
- `proposal.md`: offline behavior under Server state (A1), `src/main.tsx` under Impact (D1), `api-errors` › One field error per field under shared specs (D5).
- No contradictions with decisions.md. No non-standard artifacts in the change folder besides this report. `openspec validate --strict` passes.

