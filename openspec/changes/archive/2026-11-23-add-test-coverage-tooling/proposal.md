# Proposal

## Why

There is no way to see how much of the web client the tests cover. We want to generate coverage reports from the terminal, for the whole codebase or for one area, and see coverage for only the lines a branch changed. The backend and mobile repos get the same kind of tooling in parallel.

## What Changes

- Add `@vitest/coverage-v8` as a dev dependency and configure coverage in `vitest.config.ts`: Cobertura XML, HTML and a terminal summary, written to `coverage/`.
- Add `npm run coverage`. Without arguments it runs all Vitest tests (`node` and `dom` projects) and reports on the whole codebase. With directory arguments it runs only the tests in those directories and reports only on their files.
- The coverage script takes an optional minimum line percentage and an optional minimum branch percentage. When given, the command fails if the result is below them. Nothing passes them by default.
- Add `npm run coverage:diff`. It first runs coverage exactly like `npm run coverage` (same directory and minimum arguments), then runs a pinned diff-cover through `uvx` (dependencies resolved as of a fixed date) on the fresh Cobertura report. It shows coverage for changed lines only (committed, staged, unstaged and untracked), compared with the merge base of `origin/master` by default. Report-only. Prints to the terminal and writes an HTML report under `coverage/`.
- Ignore `coverage/` in git and Prettier.
- Document the new commands in AGENTS.md. `npm test` and the commit gates stay unchanged.

No coverage policy is defined. No shared spec is involved.

## Capabilities

### New Capabilities

- `web-test-coverage`: The terminal commands that produce test coverage reports for the web client, for the whole codebase, for chosen directories and for changed lines only.

### Modified Capabilities

None.

## Impact

- **Shared specs**: none. This change is web-only tooling and implements or depends on no requirement in `cardigan-shared-specs`.
- **Dependencies**: new dev dependency `@vitest/coverage-v8` (same version line as `vitest`). diff-cover is not an npm dependency; it runs through `uvx`, so `uv` becomes a prerequisite for `coverage:diff` only.
- **Files**: `package.json`, `vitest.config.ts`, a small coverage script and its unit test under `scripts/`, `tsconfig.node.json`, `.gitignore`, `.prettierignore`, `.oxlintrc.json`, `AGENTS.md`.
- **Unchanged**: `npm test`, the gates, application code.
