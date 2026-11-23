# Tasks

## 1. Coverage for the whole codebase

- [x] 1.1 Add `@vitest/coverage-v8` as a dev dependency on the same version as `vitest`, and verify `npm ls @vitest/coverage-v8` shows it without peer warnings
- [x] 1.2 Add the `test.coverage` block to `vitest.config.ts` (provider, include, excludes, reporters, `coverage/` directory, disabled by default). Verify that `npx vitest run --coverage.enabled` prints the text summary, writes `coverage/cobertura-coverage.xml` and `coverage/index.html`, lists an untested `src/` file at 0%, and leaves out generated, preview, `testing/`, test and `main.tsx` files
- [x] 1.3 Add `coverage/` to `.gitignore` and `.prettierignore` and `coverage/**` to oxlint's `ignorePatterns`. Verify `git status` is clean and `npm run lint` and `npm run format:check` pass after a coverage run
- [x] 1.4 Verify `npm test` still collects no coverage: delete `coverage/`, run `npm test`, and check `coverage/` was not created

## 2. Coverage script with directories and minimums

- [x] 2.1 Write `scripts/coverageArgs.ts` (pure parsing and mapping to Vitest arguments) adversarially, with `scripts/coverageArgs.test.ts` covering: no arguments, one and several directories, trailing slashes in input, a leading `./`, absolute paths inside and outside the repository, prefix-sibling directories, `--lines`/`--branches` in both the `--lines 80` and `--lines=80` spellings with valid values, decimals, 0, 100, negative, above 100, non-numeric and missing values, `--passWithNoTests` always passed, and unknown options. Add `scripts/**/*.test.ts` to the `node` project and `scripts/**/*.ts` to `tsconfig.node.json`, and verify `npm test` and `npm run typecheck` pass
- [x] 2.2 Write `scripts/coverage.ts` (checks that directories exist, spawns `vitest run --coverage.enabled`, passes the exit code through) and add the `coverage` npm script. Verify `npm run coverage -- src/features/bords` fails, names the path and runs no tests
- [x] 2.3 Verify the scoped run: `npm run coverage -- src/features/boards src/core/ui` runs only tests in those folders and the Cobertura and HTML reports contain only their files, `npm run coverage -- ./src/features/boards` gives the same result as without `./`, and `npm run coverage -- src/features/cards` (no tests) exits 0 and lists its files at 0%. If the CLI include is merged with the config's include instead of replacing it, switch to passing the scope through an env var as described in design.md and run the check again
- [x] 2.4 Verify minimums: `npm run coverage -- --lines 0` succeeds, `npm run coverage -- src/core/ui --branches 100` exits non-zero naming branches (unless it really is at 100%) and the reports are still in `coverage/`, and a run without minimums succeeds whatever the percentages

## 3. Changed-line coverage

- [x] 3.1 Extend `scripts/coverageArgs.ts` with `--diff` and `--compare-branch` (both spellings, default `origin/master`, rejected without `--diff`) and the diff-cover argument list (pinned 11.0.4 with `--exclude-newer 2026-11-23`, `--include-untracked`, HTML at `coverage/diff-cover.html`, no `--fail-under`). Extend `scripts/coverageArgs.test.ts` to cover these, including a missing ref value, and verify `npm test` passes
- [x] 3.2 Add the diff flow to `scripts/coverage.ts` (check the ref and `uv` before any test runs, delete `coverage/`, run Vitest, skip diff-cover when no Cobertura report exists, otherwise run diff-cover, combine the exit codes as in design.md) and the `coverage:diff` npm script. Verify on this branch with an uncommitted edit to a tested `src/` file and a new untracked tested file that the terminal lists both with their missing lines and that `coverage/diff-cover.html` is written. If diff-cover 11 rejects `--format html:…`, use the HTML option it documents
- [x] 3.3 Verify: a stale report in `coverage/` is replaced by a fresh run; `npm run coverage:diff -- src/features/boards` runs only that folder's tests; `-- --compare-branch=master` uses local `master`; the exit code is 0 when changed lines are uncovered; a missed `--lines` minimum still prints the diff report and exits non-zero; a failing test exits non-zero without running diff-cover; a Vitest startup failure with an old report in `coverage/` exits non-zero without running diff-cover; `-- --compare-branch=mastr` exits non-zero naming `mastr` before any test runs; with `uv` removed from the `PATH` the command exits non-zero saying `uv` is needed before any test runs

## 4. Documentation

- [x] 4.1 Add `coverage` and `coverage:diff` to the Commands table in AGENTS.md, with: the directory and `--lines`/`--branches` arguments for both, that `coverage:diff` runs the tests itself and counts untracked files, that `uv` is needed for `coverage:diff`, to `git fetch` first or pass `--compare-branch`, and that a scoped diff hides changed files outside the scope. Leave the gates line unchanged. Verify every documented command runs as written
