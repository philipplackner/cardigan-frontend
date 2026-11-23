# Design

## Context

See proposal.md for why. Current state:

- One npm package. `vitest.config.ts` defines two projects, `node` and `dom`, split by test environment. `npm test` runs `vitest run`.
- No coverage provider is installed. No `scripts/` folder exists.
- `tsconfig.node.json` type-checks the config files. `tsconfig.test.json` covers `src/**/*.test.*`.
- Node >= 26, so `node` runs `.ts` files directly through type stripping. `tsconfig.node.json` already sets `erasableSyntaxOnly` and `allowImportingTsExtensions`.
- No CI. Everything here runs locally.

## Goals / Non-Goals

**Goals:**
- One command for coverage of the whole codebase or of chosen directories, and one for coverage of changed lines.
- Argument mistakes fail fast with a clear message instead of producing an empty or wrong report.

**Non-Goals:**
- Any coverage policy, gate or CI job (decisions.md D1, D6, D12).
- Merging Playwright coverage.

## Decisions

### Coverage config lives in `vitest.config.ts`, off by default

The top-level `test.coverage` block sets: provider `v8`; `include: ['src/**/*.{ts,tsx}']`; the excludes from D7; reporters `text-summary`, `html`, `cobertura`; `reportsDirectory: 'coverage'`; `reportOnFailure: false` (set explicitly because `coverage:diff` depends on it). `enabled` stays `false`, so `npm test` is unchanged. The projects inherit it through `extends: true`.

With `include` set, v8 reports files no test loaded as 0%, which the "whole codebase" requirement needs.

### A small wrapper script handles the arguments

`npm run coverage` runs `node scripts/coverage.ts`. The script parses its arguments and starts `vitest run --coverage.enabled` with the right options. Vitest's CLI alone can't do it: a directory needs both a test filter and a narrowed `coverage.include`, and passing both by hand is easy to get wrong.

Arguments:
- Positional: directories, relative to the repository root. The script first normalizes each one: it strips a leading `./` and trailing slashes and turns an absolute path inside the repository into a relative one. A path outside the repository is rejected. Each must exist and be a directory, or the script exits non-zero and names it. A directory `d` becomes the test filter `d/` (trailing slash, so `src/features/board` doesn't also match `src/features/boards`) and `--coverage.include=d/**`. Several directories give several filters and includes. The script always passes `--passWithNoTests`, so a directory without tests reports its files at 0% instead of failing.
- `--lines <pct>` and `--branches <pct>` (also `--lines=<pct>` and `--branches=<pct>`): decimal numbers from 0 to 100 inclusive, for example `80` or `85.5`. They map to `--coverage.thresholds.lines` and `--coverage.thresholds.branches`. Vitest writes the reports before it checks thresholds, and it exits non-zero with a message naming the missed metric.
- Anything else is rejected with the bad argument named.

Argument parsing and the mapping to Vitest arguments sit in a pure function in `scripts/coverageArgs.ts`. A unit test in `scripts/coverageArgs.test.ts` covers it. `scripts/coverage.ts` only checks the file system, spawns Vitest with inherited stdio and passes its exit code through.

To make this work, the `node` project's `include` gains `scripts/**/*.test.ts`, and `tsconfig.node.json` gains `scripts/**/*.ts`. The coverage `include` stays limited to `src/`, so the script is never measured.

Alternatives considered:
- An env var read by `vitest.config.ts`. That hides the scope logic in the config and still needs a wrapper to set it.
- Only documenting the raw Vitest flags. Too easy to get the filter and include out of sync, and a typo gives an empty report instead of an error.

### `coverage:diff` is the same script in diff mode

`coverage:diff` runs `node scripts/coverage.ts --diff`. In diff mode the script accepts the same directories and `--lines`/`--branches` as `coverage`, plus `--compare-branch <ref>` (also `--compare-branch=<ref>`; default `origin/master`). `--compare-branch` without `--diff` is rejected as an unknown option. Both commands share one script, so their arguments can't drift apart.

Flow in diff mode:
0. Before any test runs, check that the compare ref resolves (`git rev-parse --verify --quiet <ref>^{commit}`) and that `uv` is on the `PATH` (`uv --version`). If not, exit non-zero and name the ref or say that `uv` is needed.
1. Delete `coverage/` (recursive, ignore if missing), then run Vitest exactly as `coverage` does. The script deletes the folder itself instead of relying on `coverage.clean`, because Vitest can exit before it cleans, and step 2 must never see a report that this run didn't write.
2. If `coverage/cobertura-coverage.xml` doesn't exist afterwards, the tests failed, so exit with Vitest's code and don't run diff-cover. This relies on `coverage.reportOnFailure: false`, which the config sets explicitly, so a failing test never leaves a report behind. The Vitest exit code alone can't tell a failing test from a missed minimum.
3. Otherwise run:
   ```
   uvx --exclude-newer 2026-11-23 diff-cover==11.0.4 coverage/cobertura-coverage.xml --compare-branch=<ref> --include-untracked --format html:coverage/diff-cover.html
   ```
4. Exit with Vitest's code if it was non-zero (missed minimum), otherwise with diff-cover's.

diff-cover compares against the merge base of `HEAD` and the ref by default. It counts staged and unstaged changes by default, and `--include-untracked` adds new files. It doesn't fail unless `--fail-under` is passed, which the script never passes, so it stays report-only.

The pinned version and the `--exclude-newer` date live in constants next to each other in `scripts/coverageArgs.ts` and are updated together. Pinning only `diff-cover==11.0.4` would still resolve its dependencies (Jinja2, Pygments, chardet, pluggy) to their newest releases on each machine; the date fixes those too. 11.0.4 is the latest release on PyPI on 2026-11-23 and the version pinned for backend and mobile too. Update it by hand on all three.

Alternatives considered: reading the last report without running tests. The user rejected that because a stale report gives wrong numbers. `pipx run` also works, but uv is faster and already used here. A global install doesn't pin a version.

### Ignore files

`coverage/` goes into `.gitignore` and `.prettierignore`. oxlint only lints JS/TS files, and the HTML report's JS assets sit under `coverage/`. Add `coverage/**` to oxlint's `ignorePatterns` as well.

## Risks / Trade-offs

- [`origin/master` is stale when it hasn't been fetched] → AGENTS.md tells developers to run `git fetch` first or pass `--compare-branch`.
- [A scoped `coverage:diff` only knows the files in scope, so changed files outside it don't show up] → Documented: run `coverage:diff` without directories to see every changed file.
- [`--include-untracked` also picks up stray untracked files, such as scratch files in `src/`] → Accepted. Only files in the Cobertura report appear, so files outside the coverage include don't show up.
- [v8 coverage goes through source maps of the React Compiler output, so branch counts in components may differ a little from the source] → Accepted. The numbers are for reading, not enforced.
- [`uv` becomes a prerequisite for `coverage:diff`] → Documented in AGENTS.md. `npm run coverage` doesn't need it. On first use uv downloads diff-cover and, if needed, a Python >= 3.11, so the first run needs network access.
- [Vitest might skip writing a coverage report when `--passWithNoTests` finds no test file] → Task 2.3 checks this with `src/features/cards`. If no report is written, stop and ask before changing the approach.
- [CLI `--coverage.include` might be merged with the config's include instead of replacing it] → Task 2 checks this with a scoped run. If it merges, the script passes the scope through an env var that `vitest.config.ts` reads instead. The behavior doesn't change.
