# Design

## Context

See proposal.md for the motivation and decisions.md for every settled choice (D1–D12). The current setup:

- `npm run lint` runs `oxlint` with `.oxlintrc.json`. That config enables the react, typescript, oxc and import plugins, lists the ignore patterns, and has overrides for `*.config.{ts,mjs}`, `src/core/**` and `src/features/**`.
- `src/app/lintBoundaries.test.ts` (Vitest `node` project) copies `.oxlintrc.json` into a temp dir, writes forbidden and allowed fixture files there, runs the oxlint binary with `--format json`, and checks the reported rule codes.
- 5 `oxlint-disable-next-line` comments with reasons exist (i18next.d.ts, router.ts, text.ts ×2, exportFileName.ts).
- A dry run of the recommended presets on the repo reported only 5 errors (3 covered by those comments, plus the 2 lines in D7). It took about 3.4 s.
- `tsconfig.node.json` type-checks `vite.config.ts`, `vitest.config.ts` and `scripts/**/*.ts`. `stryker.config.mjs` is an untyped `.mjs` config.

## Goals / Non-Goals

**Goals:**
- One ESLint flat config that holds the presets (D3) and the 1:1 port of every oxlint rule (D2, D9, D10).
- `npm run lint` is green right after the change (D7).
- The boundary test keeps the same fixtures and the same expectations, only against ESLint.

**Non-Goals:**
- Type-aware linting (`parserOptions.projectService`). It would need a TS program per run.
- Formatting rules or `eslint-config-prettier`. None of the chosen presets contain formatting rules.
- An ESLint cache (`--cache`). Easy to add later if lint gets slow.

## Decisions

### Config file: `eslint.config.mjs` at the repo root
Plain ESM, like `stryker.config.mjs`. It falls under the `*.config.{ts,mjs}` default-export exception.
- *Alternative*: `eslint.config.ts`. ESLint loads TS configs through `jiti`, or through Node's type stripping behind a flag. Either way it is one more moving part, and the file would also have to be added to `tsconfig.node.json`. Not worth it for a config file.

### Config shape
Use `defineConfig` and `globalIgnores` from `eslint/config`. `tseslint.config()` is deprecated in favor of these. Order of blocks:
1. `globalIgnores([...])`: the same paths as `.oxlintrc.json` (D12) plus `.claude/**`. ESLint skips only `node_modules` and `.git` by default and does not read `.gitignore`, so without `.claude/**` it would lint worktrees under `.claude/worktrees/`.
2. Base for `**/*.{ts,tsx,js,mjs}`: `js.configs.recommended`, `tseslint.configs.recommended`, `reactHooks.configs.flat.recommended`. Globals: `globals.browser` for `src/**`, `globals.node` for root config files and `scripts/**`.
3. Shared rule settings:
   - `@typescript-eslint/no-unused-vars`: `error` with `argsIgnorePattern`, `varsIgnorePattern`, `caughtErrorsIgnorePattern` and `destructuredArrayIgnorePattern` all `^_` (D7).
   - `@typescript-eslint/consistent-type-definitions`: `['error', 'type']`.
   - `@typescript-eslint/no-explicit-any`: `error` (already in recommended; stated explicitly because the boundary test depends on it).
   - `import-x/no-default-export`: `error` (D10). Register only the `import-x` plugin, not its presets, so no import rules come in beyond D10 and no resolver is needed.
   - `react-refresh/only-export-components`: `['warn', { allowConstantExport: true }]` (D9), on `**/*.tsx`.
4. Override `**/*.config.{ts,mjs}`: `import-x/no-default-export` off.
5. Override `src/core/**`: `no-restricted-imports` with the same `patterns` as `.oxlintrc.json`: the `group` for `@/app`, `@/features` and their subpaths, and the `regex` for relative climbs. ESLint's `no-restricted-imports` supports `group`, `regex` and `message` in `patterns`, so the port is a copy.
6. Override `src/features/**`: the same for app/features and the Radix groups.

`@typescript-eslint/no-restricted-imports` is not used. The core rule covers these import specifiers, and type-only imports should be caught the same way.

### Disable comments
Each `// oxlint-disable-next-line <rule> -- <reason>` becomes `// eslint-disable-next-line <eslint rule id> -- <reason>`: `@typescript-eslint/consistent-type-definitions` (2×) and `no-control-regex` (3×). ESLint supports the `-- reason` suffix. Keep ESLint's default for unused disable comments (a warning). Making it an error would be a new rule choice, which is out of scope here.

### Boundary test against ESLint
Rewrite `src/app/lintBoundaries.test.ts` to use ESLint's Node API instead of spawning a binary:
- `new ESLint({ cwd: <repo root>, overrideConfigFile: 'eslint.config.mjs' })`, then `eslint.lintText(source, { filePath })` for each fixture. Fixture paths are virtual (`src/core/coreImportsFeature.ts`, `foo.config.ts`, …), so no temp dir and no files are written. That keeps the test fast and stops leftover fixture files from ever being linted by `npm run lint`.
- The `RULES` map changes to ESLint rule IDs: `no-restricted-imports`, `import-x/no-default-export`, `@typescript-eslint/consistent-type-definitions`, `@typescript-eslint/no-explicit-any`. Fixtures and `FORBIDDEN`/`ALLOWED` lists stay the same. Forbidden assertions match ESLint messages on `{ ruleId: rule, severity: 2 }`; allowed assertions check `ruleId` only.
- *Alternative*: keep the temp dir and spawn `node_modules/.bin/eslint --format json`. That's closer to today's code, but slower and needs the config copied plus plugin resolution from the temp dir.

### Scripts and docs
- `package.json`: `"lint": "eslint ."` and `"lint:fix": "eslint . --fix"` (D11). No `--max-warnings` (D5).
- Dependencies: add the 7 approved dev dependencies at the versions in D8–D10, remove `oxlint`. Delete `.oxlintrc.json`.
- `AGENTS.md`: tech stack row "Lint / format" → "ESLint (with import boundaries), Prettier". The "Import boundaries are oxlint rules" line → ESLint. The gates text stays unchanged (D6).
- `README.md`: the `npm run lint` row describes ESLint, and a `npm run lint:fix` row is added.
- The project skills in `.claude/skills/` describe oxlint: `react-project-structure` (the "Enforcing with oxlint" section, the override-replace note, the boundary test steps, the commands table), plus `react-data-layer` and `react-routing` (the ignore notes and the `oxlint-disable` examples). Update them to ESLint as part of removing oxlint (D2). Otherwise agents would keep writing `oxlint-disable` comments. The note that overrides replace a rule's options instead of merging them also holds for ESLint flat config, so it stays, reworded.

## Risks / Trade-offs

- [`eslint-plugin-react-hooks` 7 recommended includes React Compiler rules that may flag future code more strictly than oxlint did] → Intended (D3). The dry run on today's code reported none.
- [`import-x` peers on `@typescript-eslint/utils` and `eslint-import-resolver-node`] → `@typescript-eslint/utils` comes with `typescript-eslint`, and npm installs peers automatically. `no-default-export` needs no resolver. After `npm install`, check that `npm ls` reports no peer errors.
- [oxlint's default checks that the presets don't include are no longer run] → Accepted (D12). The presets are the agreed baseline.
- [Lint is slower: about 3.4 s instead of well under 1 s] → Acceptable for a commit gate. `--cache` is the fix if it grows.
- [`lintText` with a virtual `filePath` might fall under `globalIgnores` or match the overrides differently than real files] → The fixture paths sit under `src/core`, `src/features`, `src/app` and the root, none of them ignored. The test's allowed and forbidden sets prove matching both ways.
- [Prettier could reformat the new config] → Run `npm run format` on the new and changed files. The `format:check` gate catches the rest.

## Migration Plan

Single commit on the feature branch (`build: replace oxlint with eslint`). Developers run `npm install` once. Rollback is a revert of that commit.
