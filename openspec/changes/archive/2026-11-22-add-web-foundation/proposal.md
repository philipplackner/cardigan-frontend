# Proposal

## Why

Web auth, web board list and web board view all need a router, a query cache, an app shell to render into and one shared text rule. Today `App.tsx` returns `null` and none of these exist. Building them once, before the three feature changes, avoids three changes setting up the same base in parallel and conflicting in `package.json` and `src/app`.

## What Changes

- **Routing** (D1, D2, D5, D6, D9): TanStack Router with file-based routes in `src/app/routes` and the Vite plugin. A root route, a pathless `_authenticated` layout route that renders the shell, and a temporary empty index route at `/`. Login and register (added by `web-auth-connect`) sit outside the shell. `_authenticated` has no guard yet; auth-connect adds it. Not-found, pending and route errors show a blank area; errors log to the console in development only.
- **App shell** (D3, D4): the `_authenticated` route renders `AppLayout` with an empty sidebar frame (brand only) and a phone top-bar slot that each page fills with its own `AppBar`. `Sidebar`'s `mainNav`, `boards` and `account` become optional so feature changes can fill them one by one.
- **Server state** (D7): TanStack Query with one QueryClient. Data stays fresh until an intentional refresh, the user's own change or a reload. No refetch on focus, reconnect or mount. No automatic retries for now. Requests made offline fail at once instead of being held until the network returns.
- **Providers** (D10): `App` mounts `QueryClientProvider`, `ToastProvider` and `RouterProvider`. A `renderAppAt` helper renders the whole router at a URL for route tests.
- **Text helper** (D8): one helper in `core/utils` that normalizes, counts code points and checks characters per the shared text-length rule, for single-line, multi-line and password fields.
- **Form libraries** (D11): React Hook Form, Zod and `@hookform/resolvers` are installed for web auth and board list.

Not breaking. Users see an empty shell at `/` until the feature changes land.

## Shared specs this change implements or depends on

From `cardigan-shared-specs`:

- `text-length`, "Text is normalized before validation" — implemented by the text helper.
- `text-length`, "Passwords are normalized without trimming" — implemented by the password field kind.
- `text-length`, "Length is counted in Unicode code points" — implemented by the text helper.
- `text-length`, "Invalid characters are rejected" — implemented on the client by the character check.
- `text-length`, "Clients validate with the same rule" — the helper is the web's single place for this rule.
- `text-length`, "Backend stores and returns normalized text" — depended on: features send the normalized value and show what the backend returns.
- `api-errors`, "One field error per field" — depended on: `checkText` reports the first broken rule in this order.

## Capabilities

### New Capabilities

- `web-app-shell`: which pages render inside the app shell, how pages fill the phone top bar, what unknown URLs, pending pages and route errors show, and when server data is refetched on web.

### Modified Capabilities

None. The shell uses the regions from `web-design-system` "Layout regions per breakpoint" unchanged.

## Impact

- **Dependencies**: `@tanstack/react-router`, `@tanstack/react-query`, `react-hook-form`, `zod`, `@hookform/resolvers`; dev: `@tanstack/router-plugin`.
- **Code**: `vite.config.ts` (router plugin), `src/main.tsx` (dev-only error logging), `src/app/App.tsx`, new `src/app/router.ts`, `src/app/routes/`, committed `src/app/routeTree.gen.ts`, `src/core/api/queryClient.ts`, `src/core/utils/text.ts`, `src/core/ui/Sidebar.tsx` (optional slots), a top-bar slot in `src/core/ui/layout`, test helpers in `src/app`.
- **Later changes**: web auth and board list build screens and sidebar pieces without mounting them; board list builds the account footer from auth's session. `web-auth-connect` adds `/login`, `/register`, the guard and the login redirect. `web-boards-connect` replaces the index route with the board list, adds `/boards/$boardId` and fills the sidebar. Labels adds `/labels` and its nav item. web-api-client adds the retry rule.
