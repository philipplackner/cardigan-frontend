# Tasks

## 1. Setup

- [x] 1.1 Add `@stryker-mutator/core` and `@stryker-mutator/vitest-runner` 10.1.1 as dev dependencies and verify `npm ls @stryker-mutator/core @stryker-mutator/vitest-runner` shows them without peer warnings
- [x] 1.2 Add `reports/` and `.stryker-tmp/` to `.gitignore` and `.prettierignore`, and `reports/**` and `.stryker-tmp/**` to oxlint's `ignorePatterns`. Widen oxlint's `import/no-default-export` override from `*.config.ts` to `*.config.{ts,mjs}`. Verify `npm run lint` and `npm run format:check` pass

## 2. Mutation command

- [x] 2.1 Add `stryker.config.mjs` as in design.md and the `mutation` npm script. Run `npm run mutation -- --mutate "src/core/utils/text.ts,src/features/boards/components/DeleteBoardDialog.tsx"` and verify: it exits 0, `reports/mutation/mutation.html` exists, mutants in `text.ts` are killed by its `*.test.ts` and mutants in `DeleteBoardDialog.tsx` by a `*.test.tsx` (so both Vitest projects run). If the run fails in the sandbox or a project's tests don't run, stop and report to the user before changing any config. Verify `npm run lint`, `npm run format:check` and `npm run typecheck` still pass with the new config file
- [x] 2.2 Verify a failing test stops the run: break one assertion temporarily, run the small `--mutate` run from 2.1, check it exits non-zero before testing mutants, then restore the test
- [x] 2.3 Verify `MUTATION_MIN_SCORE` with the small run from 2.1: unset and empty both exit 0 whatever the score; a value below the score exits 0; `100` (unless the score is 100%) exits non-zero, logs that the score is under the threshold, and the HTML report is still written; `abc`, `-1`, `150`, `60%` and `1e1` each exit non-zero before the dry run with a message naming `MUTATION_MIN_SCORE` and the value
- [x] 2.4 Verify incremental mode with the small run from 2.1: two plain runs both test every mutant and write no incremental file; two `-- --incremental` runs write `reports/mutation/stryker-incremental.json` and the second one tests no mutant and reports the same score; after editing `text.ts`, a third `--incremental` run retests only `text.ts` mutants. Revert the edit
- [x] 2.5 Run a full `npm run mutation` and verify: it exits 0 whatever the score; the report lists files from `src/features/*/components/` and `src/core/ui/` and no file matching the excludes in the spec; `git status` is clean afterwards. Write down the run time, mutant count, score and number of timeouts for the user
- [x] 2.6 Verify `npm test` and `npm run coverage` are unchanged: delete `reports/`, run both, and check `reports/` was not created and no mutant was generated

## 3. Documentation

- [ ] 3.1 Add `npm run mutation` to the Commands table in AGENTS.md, with notes: it's manual and not a gate; a plain run is a full run; where the report is; `-- --incremental` for faster reruns; `MUTATION_MIN_SCORE=<pct>` for a one-off minimum; the `--mutate` example with negated test and `testing/` patterns, written without `{ts,tsx}` braces because Stryker splits `--mutate` on commas; the full run time from 2.5; that the `mutate` list in `stryker.config.mjs` mirrors the coverage excludes and must be kept in sync. Leave the gates line unchanged. Verify every documented command runs as written
