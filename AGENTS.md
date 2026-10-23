# Cardigan Web

Cardigan is a kanban app for developers. This repo is the React web client. It talks to the Cardigan Spring Boot backend over a REST API under `/api/v1`. A Compose Multiplatform app (Android, iOS) uses the same backend and the same designs. It lives in a different repo.

This file is the project's system prompt. The `react-*` skills in `.claude/skills/` hold the detailed rules and code patterns. This file gives the big picture, the decisions specific to this project, and how to work here. **When this file and a skill disagree, this file wins.** Mention the conflict when you hit it, so the skill can be fixed.

---

## Tech Stack

| Area | Choice |
|---|---|
| App type | Client-side SPA. No SSR, no React Server Components, no Next.js. |
| Build | Vite, TypeScript (strict), npm. Node version pinned in `.nvmrc`. |
| UI | React 19 with the React Compiler enabled |
| Routing | TanStack Router, file-based, in `src/app/routes` |
| Server state | TanStack Query v5 |
| API contract | Zod schemas and types **generated** from the backend's OpenAPI spec (see [API Contract](#api-contract)) |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS v4 with tokens from Figma, shadcn/ui components on Radix primitives in `core/ui` |
| Icons | SVGs exported from Figma, as React components in `core/ui/icons` |
| Fonts | Geist and Geist Mono, self-hosted |
| Drag & drop | dnd-kit, with its keyboard sensor and screen reader announcements |
| i18n | react-i18next, English only for now |
| Lint / format | oxlint (with import boundaries), Prettier |
| Tests | Vitest, React Testing Library, user-event, MSW, Playwright |

**Current state:** the repo is still the Vite scaffold (`App.tsx` with a default export, no router, no Tailwind, no tests, no Prettier). Build the layout from `react-project-structure` before building features. Add each dependency in the change that first needs it, and ask before adding one that isn't in the table above.

---

## Architecture

The full rules are in `react-project-structure`. In short:

```
src/
  main.tsx
  app/              router, route files, providers, app shell. The only place that knows every feature.
  core/
    api/            HTTP client, DataError, QueryClient, generated API code, shared schemas
    auth/           session, fetchWithAuth, refresh, auth calls
    ui/             design system: components, icons, theme tokens
    i18n/           i18next setup, translations shared by several features
    utils/
  features/<feature>/
    api/  components/  hooks/  utils/  types.ts
```

- Features never import each other. Shared code moves to `core` when a second feature needs it.
- Import boundaries are oxlint rules, and a test checks that the rules still catch violations.
- Root/Screen split with view-model hooks, as in `react-presentation-mvi`.
- Server data lives only in the TanStack Query cache. Shareable state lives in the URL.

### Features

| Feature | Covers | Figma page |
|---|---|---|
| `auth` | log in, register, session expired, log out | Log in & register |
| `boards` | board list (grid, phone list), new/rename/delete board, board view (columns, quick add, drag & drop, column menu, search, label filter) | Board list, Board view |
| `cards` | card detail (side panel / full screen), card labels, unsaved changes | Card detail |
| `labels` | labels page, new/edit/delete label | Labels |
| `transfer` | export from the board menu, import dialog | Import & export |

Don't create another feature folder without asking.

---

## Figma: The Single Source of Truth for UI

**Figma is the only source for how the UI looks and behaves.** Layout, spacing, colors, type, components, states, copy and responsive behavior all come from Figma. Never invent UI.

### When Figma can't be read

If a Figma MCP call fails (not authenticated, rate limited, node not found, timeout, empty result), **stop and tell the user exactly which call failed and for which node.** Then wait. Don't build the UI from memory, from another screen, from shadcn defaults, or from a guess at what it probably looks like. Don't build a "temporary" version to replace later.

### When something isn't designed

If a screen, state or component you need isn't in Figma (for example a rate-limit error, a network error, an offline state, a 404 page), **stop and ask.** List the missing states. Build them only once a design exists or the user tells you which existing pattern to reuse.

The same applies when Figma conflicts with the API contract or with a decision in this file. Ask, don't pick.

### Where to find things

File: [Cardigan Designs](https://www.figma.com/design/MALwbOph7Uj2QtiTy21JaQ/Cardigan-Designs?node-id=0-1) · file key `MALwbOph7Uj2QtiTy21JaQ`

**Start at the Overview page.** It explains how the file is organized, links every page, and lists the UI decisions. Then open the page for the feature you're working on. Each feature has its own page:

| Page | Node | What's there |
|---|---|---|
| Overview | `0:1` | Index: how to read the file, page list, UI decisions |
| Foundations | `9:2` | Color tokens (light and dark), 20-color label palette, type, spacing, radius, breakpoints |
| Design System | `9:3` | All components with variants, slots and properties |
| Log in & register | `9:4` | Log in, register, live password rules, errors, loading |
| Board list | `9:5` | Board grid and phone list, new board, rename, delete, empty and error states |
| Board view | `9:6` | Columns, quick add, drag & drop, column menu, search, label filter |
| Card detail | `9:7` | Side panel on tablet/desktop, full screen on phone, labels, unsaved changes |
| Labels | `9:8` | Labels page, new/edit/delete dialogs, empty and loading states |
| Import & export | `9:9` | Export from the board menu, import dialog with drop zone, errors, key clash |

Page node IDs are stable. Frame IDs inside pages change as designs change, so look them up with `get_metadata` on the page instead of copying them into code or docs.

### How to read the file

- Each screen page groups frames into **sections by flow**. Frames are named **`State · Size`**, for example `Wrong email or password · Phone 390`.
- Three sizes: **phone 390**, **tablet portrait 834**, **desktop 1440**. Tablet landscape uses the desktop layout.
- Every screen is built from Design System instances. Implement the component in `core/ui` once and reuse it, don't rebuild it per screen.
- Colors, spacing and radius are Figma variables. The dark theme is the same frames with the Color collection switched to Dark mode.
- **Annotations on frames** explain behavior. Follow them. Notes marked as **app-only** apply to the mobile app, not to the web.
- The UI decisions on the Overview page are product decisions. Don't work around them. The one deliberate addition is keyboard drag & drop (see [Accessibility](#accessibility)).
- The breakpoints on Foundations are marked "(proposal)". Use them, but define them in one place in the theme, because they may change.

### Workflow

1. `create_session` with the file key before the first Figma call of a task.
2. `get_metadata` on the feature's page to find the frames for every state and size you need.
3. Load the `figma:figma-design-to-code` skill, then call `get_design_context` for each frame. Check the result with `get_screenshot`.
4. Use `get_variable_defs` for tokens. Theme tokens in `core/ui/theme` follow the Figma variable names (`background/surface`, `text/muted`, `accent/default`, ...).
5. Treat generated markup as a reference. Map it to `core/ui` components and token classes. Never paste raw hex values, pixel values or absolute positioning from it.
6. Look at **every size** of a screen before building it. Responsive behavior comes from comparing the phone, tablet and desktop frames.
7. Copy text in the designs is the source for the English translation strings.

### Code Connect

When a `core/ui` component lands, add a Code Connect mapping from its Figma component to the code component (load `figma:figma-code-connect`). Later `get_design_context` calls then return our component names. If writing the mapping fails because of permissions, tell the user and continue without it.

### Icons

Icons are exported from Figma as SVG and live as React components in `src/core/ui/icons/`. Replace hard-coded fills and strokes with `currentColor` so the color comes from the text color. Add an icon when a feature first needs it. Features render icons only through `Icon` and `IconButton` from `core/ui`.

---

## Project Decisions

### Backend and hosting

- **Same origin.** In production one host serves the SPA and proxies `/api` to the Spring backend. There is no CORS. Locally, the Vite dev server proxies `/api` to the backend (default `http://localhost:8080`).
- The API base path is `/api/v1`. All routes are `/api/v1/<plural-resource>`.
- Every path that isn't `/api/**` must serve `index.html` (SPA fallback).
- The hosting config sets the security headers from `react-security` (CSP with `script-src 'self'`, `frame-ancestors 'none'`, HSTS, referrer policy). Keep the app compatible: no inline scripts, no `eval`, no third-party scripts.

### API contract

The backend generates its OpenAPI spec from code and commits it as a snapshot. Mobile clients generate type-safe code from it. This client does the same.

- The backend repo is at `/Users/philipplackner/IdeaProjects/cardigan`. Use only this path for the backend, never another checkout or a guessed location. Its committed spec snapshot lives in `app/src/test/resources/openapi/`.
- A copy of the spec is committed at `api/openapi.json`. `npm run api:sync` copies it from the backend's snapshot folder. Contract changes therefore show up in this repo's diff.
- Read the backend repo when you need context (its `AGENTS.md`, controllers, DTOs, error codes), but never change files there.
- Zod schemas and TS types are **generated** from that file into `src/core/api/generated/`. Never edit generated files. Regenerate with `npm run api:generate`. The generator isn't chosen yet. Propose one and ask before adding it.
- Feature `api/` modules use the generated schemas and keep the rest of `react-data-layer`: plain API functions, hand-written mappers from DTOs to domain types, domain types in `types.ts`, `DataError` for failures.
- **Never invent an endpoint, field, enum value or error code.** If the spec doesn't have what a screen needs, stop and tell the user what's missing. The backend may not have built it yet.
- Errors come back as ProblemDetail with a `code` property. `dataErrorFromResponse` reads `code`, and features map known codes to messages. Each operation in the spec lists the codes it can return.
- IDs are UUID strings. Instants are ISO date-time strings in UTC, mapped to `Date` in the mappers.
- When MSW handlers are written before an endpoint is deployed, they follow the spec, not a guess.

### Authentication

Scope is **register, login, refresh, logout only**. No email verification, no password reset, no change password, no account or settings screen (log out lives in a menu, as in Figma). Don't build anything beyond that unless asked.

- **Access token:** short-lived JWT, held **in memory only** in `core/auth`, sent as `Authorization: Bearer`. Never in `localStorage`, `sessionStorage`, IndexedDB or a readable cookie.
- **Refresh token:** set by the backend as an **httpOnly, Secure, SameSite=Strict cookie** scoped to the auth path. JavaScript never sees it. Restoring the session after a reload and refreshing after a `401` both call the refresh endpoint and rely on the browser sending the cookie.
- Refresh tokens rotate on every use. Serialize refreshes across tabs with the Web Locks API and broadcast logout with a `BroadcastChannel`, as in `react-security`.
- On logout or a failed refresh: clear the token, clear the Query cache, remove user-scoped storage, go to login. The "Session expired" state in Figma is shown when the session ended without an explicit logout.
- **Backend dependency:** the cookie-based refresh for web needs a backend change (cookie for web, body token for mobile). Until the spec shows it, don't build the refresh flow against a guessed contract. Ask.
- Public auth endpoints are rate limited per email. A `429` comes with code `RATE_LIMIT_EXCEEDED` and a `Retry-After` header. There is no design for this state yet, so ask before building its UI.

### Theme

Light and dark always follow the system setting. There is no theme switch in the app. Tokens swap through CSS variables under `prefers-color-scheme`. No `dark:` variants in components.

### i18n

English only for now, but all user-facing text goes through react-i18next with typed keys, as in `react-ui-components`. No language switcher. Don't add other languages unless asked.

### Monitoring

No error reporting service and no analytics yet. The reporting points from `react-error-handling` stay in place and log to the console in development only. Don't add a third-party script or SDK without asking.

### Browser support

Current and previous major versions of Chrome, Edge, Firefox and Safari, including Safari on iOS and Chrome on Android.

---

## Accessibility

The rules in `react-ui-components` and `react-screen-architecture` apply. Specific to this project:

- Figma decides that cards move between columns **by drag & drop only**. We implement it with dnd-kit's **keyboard sensor** and **screen reader announcements**, so keyboard and screen reader users can move cards too. Don't add other move UI (a "Move to…" menu) without a design.
- Known gap, accepted for now: users who can't drag and can't use a keyboard (some switch-access users) have no way to move cards.
- Every screen works with keyboard only. Dialogs, menus and popovers come from `core/ui` (Radix).

---

## Testing

All test types are expected. See `react-unit-testing` and `react-integration-testing` for the details.

| Type | Where | What's real |
|---|---|---|
| Unit | next to the file | Pure logic: reducers, mappers, schemas, utils. No DOM, no I/O, fake time, pinned non-UTC time zone. |
| Screen | next to the Screen | Screen and its children, rendered with props only |
| Feature | next to the Root | Root, view-model, queries, API functions, HTTP client, mappers. Network faked with MSW. |
| Route | `src/app` | The whole router at a URL, guards, loaders, not-found. Network faked with MSW. |
| E2E | `e2e/` | The built app in real browsers against a **locally running backend** |

- Write unit tests the adversarial way: list the break vectors first, then one test per distinct angle.
- MSW handlers return JSON shaped like the spec's DTOs, built with fixtures.
- No `vi.mock` of project modules.
- **E2E tests run against a local backend only.** Never against Supabase or any deployed environment. They are not a merge gate. Run them only when the user asks or before a release. Each test creates its own user through register → login.

### Commands

| Command | What it does |
|---|---|
| `npm run api:sync` | Copy the OpenAPI spec from `/Users/philipplackner/IdeaProjects/cardigan/app/src/test/resources/openapi/` |
| `npm run api:generate` | Generate schemas and types from `api/openapi.json` |
| `npm run e2e` | Playwright against the local backend (it must be running on `localhost:8080`) |

Scripts that don't exist yet get added in the change that sets up the tool.

**The gates:** `typecheck`, `lint` (including import boundaries), `format:check`, `test` and `build` must all pass before a commit.

---

## Git Workflow

- **Commit automatically** as soon as a logical chunk of work is done **and** all five gates pass. Don't batch several chunks into one commit, and don't wait until the end of the session.
- **Never commit** when a gate fails or hasn't been run. Fix it first, or tell the user what is broken.
- Conventional Commits with a scope where it fits: `feat(boards): ...`, `fix(auth): ...`, `refactor: ...`, `test(cards): ...`, `build: ...`, `docs: ...`, `chore(deps): ...`. Imperative mood, lowercase, no trailing period.
- One logical change per commit. Auth changes (`core/auth`, the HTTP client's auth handling) go into their own commits.
- Regenerated API code goes into its own commit together with the spec change that caused it.
- Commit locally only. **Never push.** The user pushes.
- Never amend or rewrite existing commits, never skip hooks (`--no-verify`), never commit `.env.local` or other secrets.

---

## Decision Rules

- **Never assume a decision the user hasn't made.** If something isn't specified, ask. Don't silently pick a default.
- **Never make product or design decisions.** That includes screens, states, layout, copy, validation rules and limits, what happens after an action, and anything else users see. Figma and the API spec answer these. If they don't, ask.
- Ask before adding a dependency, a third-party service or script, a new feature folder, or a new `core` folder.
- **If you think a different approach would be better than one the user decided on, propose it.** Explain the trade-off briefly, then keep following the existing decision until the user agrees to change it.
- Raise known trade-offs when they become relevant instead of solving them silently. Examples: a Figma design that conflicts with the API contract, a state that has no design, a breaking change in the spec, an accessibility gap.
- If a skill's example conflicts with this file, follow this file and mention the conflict.

---

## Open Items

Ask before building anything that depends on these:

- The backend's OpenAPI snapshot. The backend is still the Spring Initializr skeleton and doesn't have the snapshot folder yet. Until it exists, there is no contract to generate from.
- The backend change for the web refresh cookie.
- Designs for: rate limit (`429`), network error, offline, not-found page.
- Whether refresh and logout get a rate limit (still open on the backend).
- The OpenAPI code generator.
- Final breakpoints.

---

## Skill Map

| Skill | Use it when |
|---|---|
| `react-project-structure` | Setting up the layout, adding a feature or a `core` module, wiring providers, adding a dependency, changing lint boundaries |
| `react-routing` | Adding a page or route, links, path or search params, loaders, auth guards, not-found and error pages |
| `react-presentation-mvi` | Creating a screen, Root/Screen split, view-model hooks, reducers, forms |
| `react-screen-architecture` | Deciding where state lives, effects, Suspense, lists, responsive layout, focus, page titles, animations |
| `react-ui-components` | Building any component that isn't a Root/Screen, design system work, tokens, icons, translations, accessibility |
| `react-data-layer` | Calling an endpoint, API functions, schemas, mappers, domain types, environment config |
| `react-server-state` | Queries, mutations, cache keys, invalidation, optimistic updates, pagination |
| `react-error-handling` | DataError, mapping statuses and error codes, error messages, error pages, retries |
| `react-security` | Login, register, logout, tokens, refresh, 401s, protected routes, redirects, XSS, storage, env variables |
| `react-unit-testing` | Tests for reducers, mappers, schemas, utils and other pure logic |
| `react-integration-testing` | Screen, feature, route and API tests with MSW, and Playwright E2E |
| `figma:figma-design-to-code` | Before every `get_design_context` call |
| `figma:figma-code-connect` | Mapping a new `core/ui` component to its Figma component |
