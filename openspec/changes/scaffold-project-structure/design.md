# Design

## Context

See proposal.md for why. The repo is the Vite 8 / React 19.3 / TypeScript 6 / oxlint 1.89 template. `tsconfig.app.json` isn't strict and has no path alias. `.oxlintrc.json` has two React rules. There is no Prettier, no test runner, no `.nvmrc`. All scope and tooling choices are fixed in decisions.md (D1–D15). This document only describes how they fit together.

## Goals / Non-Goals

**Goals:**
- All five gates (`typecheck`, `lint`, `format:check`, `test`, `build`) exist and pass on the skeleton.
- Import boundaries fail lint on day one, and a test proves it.
- A new feature file can be dropped into its folder without touching config.

**Non-Goals:**
- Anything a feature or a later infrastructure change owns (router, Query, i18n, MSW, Playwright, OpenAPI, tokens, hosting). See decisions.md, Out of scope.

## Decisions

### Folder skeleton

```
src/
  main.tsx                 imports ./index.css, renders <App /> from @/app/App
  index.css                @import "tailwindcss"; @import "./core/ui/theme/theme.css";
  app/
    App.tsx                export function App() { return null }
    lintBoundaries.test.ts
    testEnvironment.test.ts
  core/
    api/  api/generated/  auth/  i18n/  utils/  ui/  ui/icons/
    ui/theme/theme.css     empty @theme block, the place Figma tokens go later
  features/{auth,boards,cards,labels,transfer}/
    api/  components/  hooks/  utils/
```

Every folder without a real file gets a `.gitkeep` (D2). `ui/theme/` holds `theme.css`, so it needs none. `App` returns `null` instead of an empty fragment. Both render nothing, and `null` is the more common idiom.

### TypeScript

- `tsconfig.app.json`: add `strict`, `noUncheckedIndexedAccess`, `baseUrl`-free `paths: { "@/*": ["./src/*"] }`. Keep the existing flags. Exclude `src/**/*.test.ts(x)`.
- `tsconfig.test.json`: extends the app config, sets its own `tsBuildInfoFile: ./node_modules/.tmp/tsconfig.test.tsbuildinfo`, includes only test files, sets `types: ["vite/client", "node"]`. No Vitest globals: tests import `describe`/`it`/`expect` from `vitest`.
- `tsconfig.node.json`: add `vitest.config.ts` to `include`.
- `tsconfig.json` references all three. `typecheck` is `tsc -b`, so one command covers app, tests and config. `build` stays `tsc -b && vite build`.

Alternative: a single tsconfig with test types. Rejected because Node types would leak into app code (the skill requires the split).

### Path alias

Vite 8 resolves tsconfig `paths` natively with `resolve: { tsconfigPaths: true }`, set in both `vite.config.ts` and `vitest.config.ts`. That keeps the alias in one place. If that option doesn't behave as expected during apply, fall back to `resolve.alias` with `fileURLToPath(new URL('./src', import.meta.url))` in both Vite and Vitest config. No `vite-tsconfig-paths` package.

### oxlint

`.oxlintrc.json`:

- `plugins`: `react`, `typescript`, `oxc`, `import`.
- Root rules: keep the two React rules, add `import/no-default-export: "error"`, `typescript/consistent-type-definitions: ["error", "type"]`, `typescript/no-explicit-any: "error"`.
- `ignorePatterns`: `src/core/api/generated/**`, `src/app/routeTree.gen.ts` (does not exist yet, harmless and saves editing later), `dist/**`.
- `overrides`, copied from the skill:
  - `src/core/**`: no `@/app`, `@/features` and no relative climb into `app` or `features`.
  - `src/features/**`: no `@/app`, `@/features`, no relative climb into `app`, no `@radix-ui/*`.
  - `*.config.ts`: turn off `import/no-default-export` (Vite and Vitest require a default export).

oxlint overrides replace options instead of merging. Each folder lists all its patterns in full.

### Lint-boundary test

`src/app/lintBoundaries.test.ts`, following the skill:

1. Create a temp dir (`fs.mkdtempSync` under `os.tmpdir()`), copy `.oxlintrc.json` into it.
2. Write one fixture file per case at its `src/...` path.
3. Run `node_modules/.bin/oxlint --format json` from the repo with `cwd` set to the temp dir, via `execFileSync`. oxlint exits non-zero when it finds errors, so read stdout from the thrown error too.
4. Group diagnostics by file. Assert each forbidden fixture has a diagnostic whose `code` is the expected rule (`eslint(no-restricted-imports)` or the style rule) with `severity: "error"`. Assert each allowed fixture has no diagnostic for any of the rules under test (`no-restricted-imports`, `import/no-default-export`, `typescript/consistent-type-definitions`, `typescript/no-explicit-any`). Fixtures re-export what they import (`export { a } from '...'`) so they trigger no unrelated rules such as `no-unused-vars`, which oxlint enables by default.

Fixtures:

| Fixture | Expected |
|---|---|
| `src/core/x.ts` imports `@/features/boards/api/a` | error |
| `src/core/x.ts` imports `@/app/App` | error |
| `src/core/x.ts` imports `../../features/boards/a` | error |
| `src/core/x.ts` imports `@/core/utils/a` | allowed |
| `src/features/boards/x.ts` imports `@/features/cards/a` | error |
| `src/features/boards/x.ts` imports `@/app/App` | error |
| `src/features/boards/api/x.ts` imports `../../../app/App` | error |
| `src/features/boards/x.ts` imports `@radix-ui/react-dialog` | error |
| `src/features/boards/components/x.ts` imports `../api/a`, `@/core/ui/a` | allowed |
| `src/app/x.ts` imports `@/features/boards/a` | allowed |
| a file with `export default` | `import/no-default-export` |
| a file with `interface` | `typescript/consistent-type-definitions` |
| a file with `any` | `typescript/no-explicit-any` |
| `foo.config.ts` with `export default` | allowed |

Fixtures don't need the imported files to exist. `no-restricted-imports` only looks at the specifier. The test needs `node` types, so it's covered by `tsconfig.test.json`.

### Vitest

`vitest.config.ts` (separate from `vite.config.ts`, so the Babel and Tailwind plugins don't run in unit tests): `environment: 'node'`, `include: ['src/**/*.test.{ts,tsx}']`, `resolve: { tsconfigPaths: true }`. The time zone is pinned by setting `process.env.TZ = 'Europe/Berlin'` at the top of `vitest.config.ts`. Workers inherit the env, and Node reads `TZ` at use. Berlin is non-UTC and has DST, which catches more date bugs than a fixed offset. `src/app/testEnvironment.test.ts` asserts `new Date(0).getTimezoneOffset() !== 0` and stays, so a config edit that drops the pin fails the gate.

Alternative: `cross-env TZ=... vitest` in the script. Rejected: an extra package and every runner (IDE, CLI) must use the script.

Scripts: `test` = `vitest run`, `test:watch` = `vitest`.

### Prettier

`prettier` as dev dependency. `.prettierrc.json` is set to the style already in the repo: `{ "semi": false, "singleQuote": true }` (current files have no semicolons, single quotes, trailing commas, which is Prettier 3's default). `.prettierignore`: `dist`, `node_modules`, `package-lock.json`, `src/core/api/generated`, `src/app/routeTree.gen.ts`, `openspec`, `.claude`. Excluding `openspec` and `.claude` keeps the gate on project code. Scripts: `format` = `prettier --write .`, `format:check` = `prettier --check .`.

### Tailwind v4

`tailwindcss` and `@tailwindcss/vite`. The plugin goes in `vite.config.ts`. `src/index.css` imports Tailwind and `core/ui/theme/theme.css`. No tokens, no fonts (D4).

### React Compiler

`@rolldown/plugin-babel`, `@babel/core`, `babel-plugin-react-compiler` (D15):

```ts
plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()]
```

`@types/babel__core` only if `tsc` complains about the config. Check that the compiler runs by building and looking for the `react/compiler-runtime` import (or `_c(`) in a component in the build output. With `App` returning `null` there's nothing to memoize, so this check moves to the first real component. For now, check the build succeeds with the plugin active.

### Vite proxy

```ts
const apiProxy = { '/api': { target: 'http://localhost:8080', changeOrigin: true } }
server: { proxy: apiProxy }, preview: { proxy: apiProxy }
```

### Node and scripts

`.nvmrc` holds `26`. `package.json` gets `"engines": { "node": ">=26" }`. Scripts after the change: `dev`, `build`, `preview`, `typecheck`, `lint`, `format`, `format:check`, `test`, `test:watch`.

### Commits

Following AGENTS.md (one logical change per commit, all gates green). The gates only exist once their tooling is in, so the order is: tooling first (TS, Prettier, Vitest, App move, oxlint plus its test), then folders, then Tailwind/compiler/proxy, then README. The App move comes before the oxlint rules because `import/no-default-export` would flag the old `src/App.tsx`. A commit can only claim the gates that exist at that point. Each commit runs every gate that exists so far.

## Risks / Trade-offs

- [`tsconfigPaths` in Vite 8 doesn't resolve as expected] → Fall back to an explicit `resolve.alias` (see Path alias).
- [An oxlint rule name differs in 1.89 or needs a plugin enabled] → The lint-boundary test fails right away. Fix the config, not the test.
- [Prettier reformats existing files] → Run `format` once in the Prettier commit, so later diffs stay clean.
- [React Compiler can't be proven on an empty app] → Accepted. The first component change checks the compiled output.
- [`.gitkeep` files linger after code lands] → Remove each when its folder gets a real file. Review catches leftovers.
- [Skill vs AGENTS.md conflict] → None found. The skill's `react-routing` `routeTree.gen.ts` excludes are added ahead of the router, which is harmless config only.
