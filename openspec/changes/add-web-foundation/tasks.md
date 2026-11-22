# Tasks

## 1. Dependencies

- [x] 1.1 Check that `@tanstack/react-router`, `@tanstack/router-plugin`, `@tanstack/react-query`, `react-hook-form`, `zod` and `@hookform/resolvers` support React 19, Vite 8 and TypeScript 6; stop and report if one doesn't. Verify: each package's peer dependencies and release notes checked
- [x] 1.2 Install them (router plugin as dev dependency, no devtools) and commit `package.json` + `package-lock.json` as `chore(deps): ...`. Verify: all five gates pass

## 2. Text helper

- [x] 2.1 List the break vectors for `normalizeText`, `countCodePoints` and `checkText` (design.md "Tests") and write `src/core/utils/text.test.ts`, one test per distinct angle, covering every scenario of shared `text-length`. Verify: the tests fail before the helper exists
- [x] 2.2 Implement `src/core/utils/text.ts` with KDoc-style doc comments and remove `src/core/utils/.gitkeep`. Verify: `npm test` passes the text tests

## 3. Query client

- [x] 3.1 Add `src/core/api/queryClient.ts` with `createQueryClient`, `queryClient` and `createTestQueryClient` per design.md. Verify: `queryClient.test.ts` asserts staleTime Infinity, no refetch on focus/reconnect/mount, no retries for queries and mutations, `networkMode: 'always'` for queries and mutations, default gcTime

## 4. Shell building blocks in core/ui

- [x] 4.1 Make `Sidebar`'s `mainNav`, `boards`/`boardsAction` and `account` optional; omit the empty blocks. Update the preview's sidebar usage if needed. Verify: `Sidebar.test.tsx` covers brand-only and fully filled sidebars; preview page still renders
- [x] 4.2 Add `AppBarSlotProvider`, `AppBarSlotTarget` and `AppBarSlot` in `src/core/ui/layout/AppBarSlot.tsx` and export them from `@/core/ui`. Verify: `AppBarSlot.test.tsx` shows slot content in the target, nothing (no height) when empty, and the content changes when the page changes

## 5. Router and app wiring

- [x] 5.1 Add the router plugin to `vite.config.ts` before `react()` and `src/app/routeTree.gen.ts` to `.prettierignore`. Verify: `npm run dev` generates `routeTree.gen.ts`
- [x] 5.2 Add `src/app/BlankPage.tsx`, `src/app/router.ts` (`createAppRouter`, `RouterContext`, `Register` augmentation), `routes/__root.tsx`, `routes/_authenticated.tsx`, the temporary `routes/_authenticated/index.tsx` and `src/app/shell/AppShell.tsx` per design.md, with `appName` and `mainNavigation` added to `common` translations. Verify: `npm run typecheck` and `npm run build` pass; the committed `routeTree.gen.ts` matches the build output
- [x] 5.3 Mount `QueryClientProvider`, `ToastProvider` (translated close label) and `RouterProvider` in `src/app/App.tsx`. Add `src/app/rootErrorHandlers.ts` (`createRootErrorHandlers(isDev)`) and pass its `onCaughtError`/`onUncaughtError` to `createRoot` in `src/main.tsx`. Verify: `npm run dev` shows the empty shell at `/` on desktop and phone widths; `rootErrorHandlers.test.ts` shows both handlers log with `isDev` true and stay silent with `isDev` false
- [x] 5.4 Add `src/app/renderAppAt.tsx` and route tests: `/` renders the shell with the sidebar; an unknown path renders blank and keeps the URL; a throwing route leaves `main` empty, keeps the sidebar, and navigating to `/` afterwards renders inside the same shell; a page's `AppBarSlot` content shows in the bar region. Verify: `npm test` passes the route tests
- [x] 5.5 Check the lint boundary test still passes with the new `src/app` and `core` files. Verify: `npm run lint` and `lintBoundaries.test.ts` pass

## 6. Integration check

- [x] 6.1 Run all five gates from a clean checkout (`npm ci`, `typecheck`, `lint`, `format:check`, `test`, `build`). Verify: all pass
- [x] 6.2 In a browser, open `/` at 390, 834 and 1440 px and an unknown path; check with the keyboard that Tab reaches nothing unexpected in the empty shell. Verify: the shell regions match `web-design-system` "Layout regions per breakpoint" and the unknown path stays in the address bar

## Workflow follow-up

- Tell web auth, board list, board view and labels which files they add or edit (design.md "Route files", "Shell composition").
- Archive the change after review.
