# Artifact review (light): scaffold-project-structure

**Verdict:** Ready
**Reviewed:** 2026-11-13, schema `careful-planning`, repo kind `code`

| Pass | Blocker | Major | Minor |
|---|---|---|---|
| Testability | 0 | 1 | 1 |
| Security | 0 | 0 | 0 |
| Hidden assumptions | 0 | 1 | 0 |
| Design contract | 1 | 2 | 0 |

## Findings

### D1: Task 4.1 can't pass lint while `src/App.tsx` still has a default export
**Severity:** blocker · **Status:** applied
**Location:** tasks.md > 4.1, 4.4, 5.1
**Current text:** "add the `import` plugin, `import/no-default-export`, ... verify `npm run lint` passes on the current code"
**Failure scenario:** At task 4.1, `src/App.tsx` is still `export default App` (it only moves in 5.1). `import/no-default-export` reports it, lint fails, and the 4.4 commit is blocked by the "never commit with a failing gate" rule. The implementer either reorders ad hoc, disables the rule, or commits App's move inside the lint commit.
**Fix:** Move the App relocation ahead of the lint rules. In tasks.md, add before 4.1: "4.0 Move `App` to `src/app/App.tsx` as `export function App()` returning `null`, update `src/main.tsx` to import it via `@/app/App`, delete `src/App.tsx`; verify `npm run dev` serves a blank page with no console errors and `npm run build` passes". Reduce 5.1 to the folder creation, and change the 5.3 commit message to `refactor: scaffold core and feature folders`. In design.md > Commits, change the order to "tooling first (TS, Prettier, Vitest, App move, oxlint plus its test), then folders, then Tailwind/compiler/proxy, then README".

### D2: No task configures the `@/` alias in `vite.config.ts`
**Severity:** major · **Status:** applied
**Location:** tasks.md > 1.2, 3.1, 5.1; design.md > Path alias
**Current text:** tasks.md 5.1: "update `src/main.tsx` to import it via `@/app/App` ... (this also proves the `@/` alias resolves in Vite)"
**Failure scenario:** Task 1.2 adds `paths` only to tsconfig and 3.1 only to Vitest. Nothing adds `resolve: { tsconfigPaths: true }` to `vite.config.ts`, so `tsc -b` passes and `vite build` fails with "Failed to resolve import @/app/App" at 5.1 (or 4.0 after D1).
**Fix:** Append to task 1.2: "; add `resolve: { tsconfigPaths: true }` to `vite.config.ts` (fallback per design.md > Path alias)". In task 3.1 replace "`@/` resolution" with "`resolve: { tsconfigPaths: true }`, same as `vite.config.ts`".

### D3: `tsconfig.test.json` inherits the app's `tsBuildInfoFile` and drops `vite/client` types
**Severity:** major · **Status:** applied
**Location:** design.md > TypeScript; tasks.md > 1.2
**Current text:** "`tsconfig.test.json`: extends the app config, includes only test files, sets `types: [\"node\"]`."
**Failure scenario:** `extends` copies `tsBuildInfoFile: ./node_modules/.tmp/tsconfig.app.tsbuildinfo`, so `tsc -b` writes both projects to one buildinfo file. Each build overwrites the other's state, giving stale or flipping `typecheck` results. Separately, `types: ["node"]` replaces `["vite/client"]`, so the first test that imports a module using `import.meta.env` or a `.css`/`.svg` import fails typecheck.
**Fix:** Replace the bullet with: "`tsconfig.test.json`: extends the app config, sets its own `tsBuildInfoFile: ./node_modules/.tmp/tsconfig.test.tsbuildinfo`, includes only test files, sets `types: [\"vite/client\", \"node\"]`." Mirror the same values in task 1.2.

### T1: "Each allowed fixture reports nothing" fails on oxlint's default rules
**Severity:** major · **Status:** applied
**Location:** design.md > Lint-boundary test, step 4 and Fixtures
**Current text:** "Assert each forbidden fixture reports `no-restricted-imports` (or the expected style rule), and each allowed fixture reports nothing."
**Failure scenario:** oxlint enables `correctness` rules by default. A fixture `import { a } from '@/core/utils/a'` reports `eslint(no-unused-vars)` (checked against oxlint 1.89 in this repo), so every allowed fixture fails. The likely workaround, filtering to "no errors", would also hide a boundary rule accidentally set to `warn`.
**Fix:** Replace step 4 with: "Group diagnostics by file. Assert each forbidden fixture has a diagnostic whose `code` is the expected rule (`eslint(no-restricted-imports)` or the style rule) with `severity: \"error\"`. Assert each allowed fixture has no diagnostic for any of the rules under test (`no-restricted-imports`, `import/no-default-export`, `typescript/consistent-type-definitions`, `typescript/no-explicit-any`). Fixtures re-export what they import (`export { a } from '...'`) so they trigger no unrelated rules." Catches: a boundary override set to `"warn"`, which lint would let through.

### A1: Rule severity for the new style rules is unstated
**Severity:** major · **Status:** applied
**Location:** design.md > oxlint, "Root rules"; tasks.md > 4.1
**Current text:** "add `import/no-default-export`, `typescript/consistent-type-definitions: [\"error\", \"type\"]`, `typescript/no-explicit-any`."
**Failure scenario:** Only one rule has a severity. If `import/no-default-export` or `no-explicit-any` is set to `warn` (the level of the existing `only-export-components`), `oxlint` exits 0 and the gate never blocks a violation.
**Fix:** "add `import/no-default-export: \"error\"`, `typescript/consistent-type-definitions: [\"error\", \"type\"]`, `typescript/no-explicit-any: \"error\"`." Merged with T1 for the test side.

### T2: Time zone check is deleted after it passes
**Severity:** minor · **Status:** applied
**Location:** tasks.md > 3.1
**Current text:** "verify a throwaway test asserting `new Date(0).getTimezoneOffset() !== 0` passes, then delete it"
**Failure scenario:** If the `process.env.TZ` line is later moved or the pool changes so workers don't inherit it, tests silently run in UTC on CI machines and nothing fails.
**Fix:** "add `src/app/testEnvironment.test.ts` asserting `new Date(0).getTimezoneOffset() !== 0` and keep it". Catches: a config edit that drops the TZ pin.

## Trust boundaries

- Dev/preview `/api` proxy to `localhost:8080`: Vite binds to localhost by default and the change doesn't set `host`, so it isn't exposed to the network. No gap.
- New dev dependencies (Prettier, Vitest, Tailwind, Babel, React Compiler): build-time only, pinned via lockfile, `npm ci` in 8.1. No realistic gap for a scaffold.
- Lint-boundary test runs a binary: `execFileSync` with a fixed path and no shell, fixtures are static. No gap.
- Production CSP (`script-src 'self'`): Tailwind and the React Compiler add no inline scripts. No gap.

## Coverage

Read: decisions.md, proposal.md, design.md, tasks.md, `.openspec.yaml`, `openspec/config.yaml`, AGENTS.md, the `react-project-structure` skill's lint and code-style sections, `package.json`, all tsconfigs, `.oxlintrc.json`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`. Checked that `@vitejs/plugin-react` 6.1.2 exports `reactCompilerPreset`, Vite 8 has `resolve.tsconfigPaths`, and oxlint 1.89 enables `no-unused-vars` by default.

Specs are skipped by decision (D11), so there are no SHALL/WHEN-THEN scenarios. The testability pass covered the lint-boundary test design and task verification steps instead. No other active changes. No shared-spec dependency. Not read: the other `react-*` skills, the backend repo.

## Applied changes

All six fixes applied as recommended. `openspec validate scaffold-project-structure --strict` passes.

- **tasks.md:** 1.2 (test tsconfig buildinfo and types, Vite `tsconfigPaths`), 3.1 and 3.2 (Vitest `tsconfigPaths`, kept time zone test, dropped `--passWithNoTests`), new 4.0 (App move with its own `refactor:` commit), 4.1 (explicit `"error"` severities), section 5 reduced to folders (old 5.1 removed, 5.2/5.3 renumbered to 5.1/5.2, commit message `refactor: scaffold core and feature folders`).
- **design.md:** Folder skeleton (`testEnvironment.test.ts`), TypeScript, Path alias, oxlint root rules, Lint-boundary test step 4, Vitest, Commits.
- **proposal.md, decisions.md:** unchanged. No fix contradicts decisions.md.
- No non-standard artifacts in the change folder. No accepted risks.
