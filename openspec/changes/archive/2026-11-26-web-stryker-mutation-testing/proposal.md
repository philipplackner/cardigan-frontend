# Proposal

## Why

Line coverage says which code the tests run, not whether they would notice if that code were wrong. A mutation score answers that. We want a way to measure it for the web client by hand, to get a baseline. The backend and mobile repos get the same kind of tooling (PIT) in parallel.

## What Changes

- Add Stryker with the Vitest runner as dev dependencies.
- Add a Stryker config that mutates the product source files under `src/` (the coverage scope minus icons), runs both Vitest projects, uses the default mutators, skips static mutants, uses per-test coverage analysis and default concurrency and timeouts, and has no TypeScript checker.
- Add `npm run mutation`. A plain run is a full run that prints a summary table, writes an HTML report to `reports/mutation/mutation.html` and never fails on the score.
- Opt-in per run: `npm run mutation -- --incremental` reuses earlier results, and `MUTATION_MIN_SCORE=<pct>` makes the run fail below that score. Other Stryker CLI options pass through after `--`, for example `--mutate` to limit the run to one directory.
- Ignore `reports/` and Stryker's temp folder `.stryker-tmp/` in git, Prettier and oxlint.
- Document the command in AGENTS.md. `npm test`, `npm run coverage` and the commit gates stay unchanged.

No CI job, no git or agent hooks, no mutation score policy. No shared spec is involved.

## Capabilities

### New Capabilities

- `web-mutation-testing`: The manual terminal command that runs mutation testing on the web client and produces an HTML mutation report.

### Modified Capabilities

None.

## Impact

- **Shared specs**: none. This change is web-only tooling and implements or depends on no requirement in `cardigan-shared-specs`.
- **Dependencies**: new dev dependencies `@stryker-mutator/core` and `@stryker-mutator/vitest-runner` 10.1.1 (approved, D2).
- **Files**: `package.json`, `package-lock.json`, a new `stryker.config.mjs`, `.gitignore`, `.prettierignore`, `.oxlintrc.json`, `AGENTS.md`.
- **Unchanged**: `npm test`, `npm run coverage`, `vitest.config.ts` (unless task 2.1 finds a change is needed), the gates, application code.
