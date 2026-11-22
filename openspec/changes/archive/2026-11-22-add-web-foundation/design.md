# Design

## Context

See proposal.md for why. The repo already has the design system (`src/core/ui`), i18n (`src/core/i18n`, `src/app/i18n.ts`), the `transfer` feature, a dev preview entry (`preview.html`, `src/preview`) and the lint boundary test. `AppLayout` already implements the breakpoint regions; `Sidebar` and `AppBar` match Figma. There is no router, no query client, no `core/api` code beyond an empty `generated/` folder, and no MSW. `.oxlintrc.json` already ignores `src/app/routeTree.gen.ts`.

## Goals / Non-Goals

**Goals:**
- A route tree that `web-auth-connect`, `web-boards-connect` and labels can each add route files to, without touching each other's files.
- A shell whose sidebar parts and phone top bar the feature changes fill in independently.
- One text helper that every form uses for the shared text-length rule.

**Non-Goals:**
- Session handling, guards, HTTP client, `DataError` (auth-connect, web-api-client).
- Any visible content in the shell.

## Decisions

### Route files

```
src/app/
  App.tsx               QueryClientProvider > ToastProvider > RouterProvider
  router.ts             createAppRouter(queryClient, history?), RouterContext, Register augmentation
  routeTree.gen.ts      generated, committed
  routes/
    __root.tsx          createRootRouteWithContext<RouterContext>(); component Outlet; notFoundComponent BlankPage
    _authenticated.tsx  component AppShell (no beforeLoad)
    _authenticated/
      index.tsx         temporary; renders nothing in the main area
  shell/
    AppShell.tsx        AppLayout + Sidebar frame + top-bar slot + Outlet
  BlankPage.tsx         default pending, error and not-found component
  rootErrorHandlers.ts  dev-only onCaughtError/onUncaughtError for createRoot
  renderAppAt.tsx       test helper
```

- Plugin in `vite.config.ts` before `react()`: `tanstackRouter({ target: 'react', routesDirectory: './src/app/routes', generatedRouteTree: './src/app/routeTree.gen.ts', autoCodeSplitting: true })`. `routeTree.gen.ts` is also added to `.prettierignore`.
- `createAppRouter` sets `context: { queryClient }`, `defaultPreload: 'intent'`, `defaultPreloadStaleTime: 0`, and `BlankPage` as default pending and error component (D6). `BlankPage` doesn't log.
- Route errors are caught by TanStack Router's React error boundary, and React 19's default `onCaughtError` and `onUncaughtError` log to the console in production too. So `src/main.tsx` passes `onCaughtError` and `onUncaughtError` to `createRoot`, built by `createRootErrorHandlers(isDev)` in `src/app/rootErrorHandlers.ts`. Both log with `console.error` only when `import.meta.env.DEV` and do nothing otherwise.
- Later changes add files only: `routes/login.tsx`, `routes/register.tsx` (`web-auth-connect`), `routes/_authenticated/index.tsx` replaced and `routes/_authenticated/boards/$boardId.tsx` (`web-boards-connect`), `routes/_authenticated/labels.tsx` (labels). `web-auth-connect` adds `beforeLoad` to `_authenticated.tsx` (D2). The web auth, board list and board view UI changes mount nothing in `src/app`.
- `__root.tsx` renders `Outlet` only, so not-found outside the shell is a blank page. A `notFound()` thrown inside `_authenticated` renders blank inside the shell.
- Alternative: code-based routes. Rejected: CLAUDE.md and the routing skill set file-based routes.

### Shell composition

`AppShell` in `src/app/shell` renders `AppLayout` with:
- `sidebar`: `<Sidebar brandName=… navLabel=… />` with no `mainNav`, `boards` or `account` yet. `Sidebar` makes those props optional and omits the empty blocks (the Boards heading only renders when `boards` or `boardsAction` is given; the account footer only when `account` is given).
- `appBar`: the top-bar slot target (below).
- `children`: `<Outlet />`.

Connect changes edit `AppShell` to pass feature components (for example the board list's sidebar pieces and `sidebarAccount`, fed from auth's `useSession()`, in `web-boards-connect`). `src/app` may import every feature, so features stay independent (D4). Brand name and nav label come from the `common` translation namespace (new keys `appName`, `mainNavigation`), copy taken from Figma (brand "Cardigan").

### Phone top-bar slot (D3)

A small pair in `src/core/ui/layout/AppBarSlot.tsx`:
- `AppBarSlotProvider` holds the target DOM element in state (callback ref). `AppLayout`'s `appBar` slot renders `<AppBarSlotTarget />`.
- `<AppBarSlot>{bar}</AppBarSlot>` renders its children into the target with `createPortal`. When no page renders one, the target is empty and takes no height.
- The target is in `AppLayout`'s phone-only bar region, so it is only visible on phones. A page's `AppBar` is rendered once, not duplicated per breakpoint.

Alternatives: sticky bar in the main area (scrolls with the content and breaks the raised state); route `staticData` config (the bar would need every page's actions as data and callbacks the route can't own).

### Query client (D7)

`src/core/api/queryClient.ts`:

```ts
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: Infinity, refetchOnWindowFocus: false, refetchOnReconnect: false, refetchOnMount: false, retry: false, networkMode: 'always' },
      mutations: { retry: false, networkMode: 'always' },
    },
  })
}
export const queryClient = createQueryClient()
```

`gcTime` stays at the library default of 5 minutes, so data no mounted page uses is dropped after 5 minutes and loaded again on the next visit (spec "Server data reloads only on intent"). Keeping it forever would grow memory with every board opened in a long session. web-api-client replaces `retry: false` for queries with its DataError rule.

`networkMode: 'always'` so a request made offline fails at once and is never held for later. The library default (`'online'`) pauses requests while the browser is offline and sends them when the network returns, which would run a change minutes after the user gave up on it and reload data on reconnect.

`createTestQueryClient()` lives next to it with the same defaults and `gcTime: Infinity` so tests don't leave timers.

### Text helper (D8)

`src/core/utils/text.ts`, pure functions:

```ts
export type TextKind = 'singleLine' | 'multiLine' | 'password'
export type TextError = 'EMPTY' | 'TOO_SHORT' | 'TOO_LONG' | 'INVALID_CHARACTER'

export function normalizeText(value: string, kind: TextKind): string
export function countCodePoints(value: string): number
export function checkText(value: string, rule: { kind: TextKind; min?: number; max?: number }):
  { value: string; error: TextError | null }
```

- `normalizeText`: for non-passwords `\r\n` and lone `\r` → `\n`, then `normalize('NFC')`, then trim with `/^\p{White_Space}+|\p{White_Space}+$/gu`. Passwords: `normalize('NFC')` only. Not `trim()`: it differs from White_Space on U+FEFF and U+0085.
- `countCodePoints`: iterate the string (`for…of` steps by code point). Lone surrogates count as one each.
- `checkText` normalizes first, then checks in this order: unpaired surrogate or forbidden control character → `INVALID_CHARACTER`; length 0 → `EMPTY`; below `min` → `TOO_SHORT`; above `max` → `TOO_LONG`. Forbidden: U+0000–U+001F, except tab, LF and CR in `multiLine`. `isWellFormed()` detects unpaired surrogates (supported in all target browsers).
- The character check runs on the normalized value, like the backend. A tab or line break at the edge of a single-line value is trimmed away and never fails. A single tab on its own normalizes to `""` and returns `EMPTY`. A tab inside the text returns `INVALID_CHARACTER`. Empty text can't contain an invalid character, so the order of `EMPTY` and `INVALID_CHARACTER` never matters. `INVALID_CHARACTER` before `TOO_SHORT` and `TOO_LONG` follows shared `api-errors` › One field error per field.
- It returns the normalized `value`, which features send to the backend.
- `EMPTY` is returned for empty text even when `min` is unset; a feature with an optional field skips the check for empty input.
- Alternative: a Zod refinement in core. Rejected: the helper must also be usable outside forms (import key clash, quick add), and features can wrap it in their Zod schemas.

### Dependencies (D9, D11)

`npm install @tanstack/react-router @tanstack/react-query react-hook-form zod @hookform/resolvers` and `npm install -D @tanstack/router-plugin`. Check each supports React 19, Vite 8 and TypeScript 6 before installing. No devtools. All in one commit, because `package.json` conflicts most often.

### Tests

- `text.test.ts` (unit, node): break vectors from shared `text-length` scenarios plus U+FEFF/U+0085, ZWJ emoji, lone high/low surrogate, NUL in multi-line, tab inside vs. at the edge of a single-line field, CRLF counting, password keeping spaces, decomposed é.
- `queryClient.test.ts` (unit): defaults as decided, including `networkMode: 'always'`.
- `rootErrorHandlers.test.ts` (unit): both handlers log with `isDev` true and stay silent with `isDev` false.
- Route tests in `src/app` with `renderAppAt(path)` (memory history, fresh test QueryClient, `ToastProvider`): `/` renders the shell; an unknown path renders blank and keeps the URL; a route that throws leaves `main` empty, keeps the sidebar, and navigating to `/` afterwards renders inside the same shell; `AppBarSlot` content appears in the bar region. Test-only routes are not added to the real tree; the error case uses a test router built from the real root plus a throwing child.
- `Sidebar` test for the optional slots; `AppBarSlot` test.

## Risks / Trade-offs

- [Generated route tree in git causes merge conflicts between parallel feature changes] → It is regenerated by `vite build`/dev; on conflict, take either side and rerun `npm run build`. Note it in each feature change's tasks.
- [`retry: false` makes transient network errors visible at once] → Accepted until web-api-client adds the retry rule.
- [Blank pages give no feedback on unknown URLs or errors] → Accepted until designs exist (CLAUDE.md Open Items).
- [Portal-based top bar renders one frame late on first mount] → The target exists before any page renders, because the provider wraps the layout; verify in the route test that the bar appears without a flash.
- [`_authenticated` without a guard shows the shell to signed-out users] → Nothing is in it yet; auth-connect adds the guard before any data is shown.

## Open Questions

- How a page reads the main area's scroll position for the raised top bar on phones. Settle in web board list; it can be a hook the shell exposes and doesn't change this change's specs.
