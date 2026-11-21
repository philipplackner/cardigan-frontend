# Decisions: add-web-foundation

Confirmed with Philipp Lackner on 2026-11-21, through the coordinator session (cardiganapp-18). The decision IDs WF-1 to WF-10 from that exchange map to D1–D10 below. D11 was added by the coordinator.

## Summary

Add the web foundation that web auth, web board list and web board view build on: TanStack Router (file-based) and TanStack Query wired in `App`, a route tree with a pathless `_authenticated` layout route that renders the empty app shell, blank not-found/pending/error states, and the shared text normalize-and-count helper in `core/utils`. The shell has slots that the feature changes fill. The real session gate comes with auth-connect. This change also installs React Hook Form and Zod for the form features.

## Decisions

### D1 — Route tree shape (WF-1)
- **Question**: How is the route tree structured?
- **Decision**: One pathless layout route `_authenticated` renders the app shell. Signed-in pages nest under it: `/` (board list), `/boards/$boardId` (board view), `/labels` (labels), each added by its feature change. `/login` and `/register` sit at the top level and render without the shell.
- **Alternatives**: Separate `_authenticated` (guard) and `_shell` (layout) routes.
- **Why**: Every signed-in page uses the same shell in Figma; login and register have none.
- **Depends on**: —

### D2 — How the guard attaches (WF-2)
- **Question**: How does the session guard attach before auth-connect exists?
- **Decision**: This change adds `_authenticated` without `beforeLoad`. auth-connect adds `beforeLoad` with `ensureSession()` and the redirect to `/login?redirect=<href>`. Web auth owns the `redirect` search param on `/login` and the safe same-origin check for landing on the previous page after login.
- **Alternatives**: A stub guard backed by a `core/auth` session interface that always says "signed in".
- **Why**: No fake session behavior to remove later.
- **Depends on**: D1

### D3 — Phone top bar (WF-3)
- **Question**: How do pages fill the phone top bar?
- **Decision**: The shell renders a top-bar slot. Each page route puts its own `AppBar` into it through a small slot component the shell exposes. The bar stays outside the scrolling main area.
- **Alternatives**: Each page renders a sticky `AppBar` inside the main area on phones; the shell owns one bar and pages pass config through route `staticData` or context.
- **Why**: The bar differs per page in Figma (board list: brand, refresh, new, ⋯; board view: its own bar), and keeping it outside the scroll area keeps the "raised on scroll" state working.
- **Depends on**: D1

### D4 — Who fills the sidebar (WF-4)
- **Question**: Which change fills which part of the sidebar?
- **Decision**: This change renders the sidebar frame with the brand only. Board list adds the "All boards" nav item, the Boards section and "New board". Labels adds the "Labels" nav item. Auth adds the account footer (email + log out). `Sidebar`'s `mainNav`, `boards` and `account` become optional. The shell composes feature components in `src/app`, because features can't import each other.
- **Alternatives**: This change also owns the "All boards" and "Labels" nav items, and labels adds a placeholder route now.
- **Why**: A typed link to `/labels` can't exist before the labels route does.
- **Depends on**: D1

### D5 — `/` before board list lands (WF-5)
- **Question**: What does `/` show before the board list exists?
- **Decision**: A temporary index route under the shell with an empty main area. The board list change replaces it.
- **Alternatives**: No index route, so `/` falls to not-found.
- **Depends on**: D1

### D6 — Not-found, pending and route-error states (WF-6)
- **Question**: What do not-found, pending and route errors show without designs?
- **Decision**: A blank area. Route errors also log to the console in development only. Real designs are a follow-up.
- **Alternatives**: Reuse `EmptyState`/`ErrorMessage` with new copy; block on the designer.
- **Why**: CLAUDE.md forbids inventing UI.
- **Depends on**: D1

### D7 — TanStack Query defaults (WF-7)
- **Question**: When does server data refresh, and are failed requests retried?
- **Decision**: `staleTime: Infinity`. No refetch on window focus, reconnect or mount. Data refreshes only through the refresh button, after the user's own mutations, and on a full reload. `retry: false` for queries and mutations. web-api-client adds the DataError-based retry rule and any background-error toast later.
- **Alternatives**: The react-server-state skill's defaults (30 s stale time, refetch on focus).
- **Why**: The breakdown says new data comes only through an intentional refresh. The skill's retry rule needs `DataError`, which web-api-client builds.
- **Depends on**: —

### D8 — Shared text helper (WF-8)
- **Question**: What does the shared text helper cover?
- **Decision**: Normalize, count code points and check characters, per shared `text-length`, with three field kinds: single-line, multi-line and password (NFC only, no trim, no control characters). One check returns `EMPTY`, `TOO_SHORT`, `TOO_LONG` or `INVALID_CHARACTER` for a given min and max. Features send the normalized value to the backend. It lives in `core/utils` (no new core folder). Trimming uses the Unicode White_Space set explicitly.
- **Alternatives**: Normalize and count only; each feature does its own character checks.
- **Why**: `text-length` "Clients validate with the same rule" includes the character rule.
- **Depends on**: —

### D9 — Router and query dependencies (WF-9)
- **Question**: Which packages does the routing and query setup add?
- **Decision**: `@tanstack/react-router`, `@tanstack/react-query`, and `@tanstack/router-plugin` (dev dependency, needed for file-based routes). No router or query devtools.
- **Alternatives**: Also add the devtools in dev builds.
- **Depends on**: —

### D10 — App-wide providers (WF-10)
- **Question**: Which providers does `App` mount?
- **Decision**: `QueryClientProvider`, `ToastProvider` (with the translated close label) and `RouterProvider`. A route test helper (`renderAppAt` with a memory history and a fresh QueryClient) is added for later route tests.
- **Alternatives**: Toasts wired later by the first feature that needs them.
- **Why**: Forms and dialogs already report failures with error toasts.
- **Depends on**: D7

### D11 — Form libraries
- **Question**: Who installs the form libraries?
- **Decision**: This change installs React Hook Form and Zod, plus `@hookform/resolvers` to connect them. Web auth uses React Hook Form + Zod with `mode: 'onTouched'`; board list uses them too.
- **Alternatives**: Each feature change installs them when it first needs them.
- **Why**: Auth and board list both build on the foundation, and `package.json` is the file most likely to conflict between parallel changes.
- **Depends on**: —

## Facts

- `AppLayout`, `Sidebar` and `AppBar` already exist in `src/core/ui`. `AppLayout` takes `sidebar`, `appBar`, `panel` and `children`. `Sidebar` requires `mainNav`, `boards` and `account` today. — source: `src/core/ui/layout/AppLayout.tsx`, `src/core/ui/Sidebar.tsx`
- `App.tsx` returns `null`. `ToastProvider` is only mounted on the preview page. — source: `src/app/App.tsx`, `src/preview/main.tsx`
- `.oxlintrc.json` already ignores `src/app/routeTree.gen.ts`. — source: `.oxlintrc.json`
- The layout regions per breakpoint are already specified. — source: `openspec/specs/web-design-system/spec.md`, "Layout regions per breakpoint"
- In Figma the phone top bar differs per page, and the sidebar has "All boards" and "Labels" above the Boards section and the account footer. — source: Figma Board list page (`9:5`), frames "Board list · Desktop 1440", "Phone menu · Phone 390"
- No designs exist for not-found, network error or offline states. — source: CLAUDE.md, Open Items
- JS `trim()` and `\s` differ from Unicode White_Space (JS includes U+FEFF and excludes U+0085). — source: ECMAScript spec, Unicode PropList
- "No offline cache … new data only via intentional refresh". — source: shared `docs/breakdown/chunks/20-web-board-list-ui.md`
- `@hookform/resolvers` isn't named in the tech table. It is the standard bridge for "React Hook Form + Zod", which the table names. — source: CLAUDE.md, Tech Stack

## Out of scope

- Any sidebar, top bar or page content (board list, labels, auth).
- The real session guard, `ensureSession()` and the login redirect (auth-connect, web auth).
- `DataError`, the HTTP client and the retry rule (web-api-client).
- MSW (added by the first change with feature tests).
- The board key check (board list).
- Page titles (`document.title`); each feature sets its own.
- Designs for not-found, pending and route errors.

## Deferred

- How a page reads the main area's scroll position for the raised phone top bar — settle before: implementation of web board list.
