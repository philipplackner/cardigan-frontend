# Design

## Context

See proposal.md for why. Current state:

- One npm package, Node 26, TypeScript 6, Vitest 5.1. `vitest.config.ts` defines two projects: `node` (`*.test.ts`, 29 files: reducers, utils, schemas, config tests) and `dom` (`*.test.tsx` in jsdom, 37 files: screen, feature and route tests). A full `npm test` takes about 5 seconds on 18 cores.
- `vite.config.ts` runs the TanStack Router plugin and the React Compiler through Babel. `vitest.config.ts` doesn't load `vite.config.ts`, so tests don't run the React Compiler.
- About 220 product source files under `src/`, most of them components. `src/core/api/generated/` is still empty. No MSW yet.
- `npm run coverage` already defines which files count as product code (`vitest.config.ts`, `coverage.include`/`exclude`).
- Stryker 10.1.1's CLI has options for `--incremental`, `--incrementalFile`, `--force`, `--mutate` and `--concurrency`, but none for `thresholds`. It loads `stryker.config.mjs` from the repo root by default. With `thresholds.break` set and missed, it logs an error, writes the reports and exits with code 1.
- No CI. Everything here runs locally.

## Goals / Non-Goals

**Goals:**
- One manual command that gives a mutation score and an HTML report for the product code.
- Incremental runs and a minimum score available per run, both off by default.

**Non-Goals:**
- Any score policy, gate, CI job or hook (D0).
- Running Playwright.
- A wrapper script with directory arguments like `coverage` (D13).

## Decisions

### Stryker with the Vitest runner, configured in `stryker.config.mjs`

Dev dependencies: `@stryker-mutator/core` and `@stryker-mutator/vitest-runner`, both 10.1.1 (D1, D2).

The config is an ES module because it reads `MUTATION_MIN_SCORE` (D11). A JSDoc `@type {import('@stryker-mutator/api/core').PartialStrykerOptions}` gives editor checking. `@stryker-mutator/api` comes in with core, so no extra dependency.

```js
const config = {
  testRunner: 'vitest',
  vitest: { configFile: 'vitest.config.ts' },
  coverageAnalysis: 'perTest',
  mutate: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/testSetup.ts',
    '!src/**/*.d.ts',
    '!src/app/routeTree.gen.ts',
    '!src/core/api/generated/**',
    '!src/preview/**',
    '!src/**/testing/**',
    '!src/main.tsx',
    '!src/core/ui/icons/**',
  ],
  ignoreStatic: true,
  incremental: false,
  incrementalFile: 'reports/mutation/stryker-incremental.json',
  reporters: ['clear-text', 'progress', 'html'],
  htmlReporter: { fileName: 'reports/mutation/mutation.html' },
  thresholds: { high: 80, low: 60, break: minScoreFromEnv() },
  tempDirName: '.stryker-tmp',
  ignorePatterns: ['dist', 'coverage', 'reports'],
}
```

Per-setting decisions:
- `mutate`: the coverage excludes plus `src/core/ui/icons/**` (D3). The list is copied, not imported from `vitest.config.ts`, so the Stryker config doesn't load the Vitest config. AGENTS.md says to keep both in sync.
- Both Vitest projects run because the runner uses `vitest.config.ts` as is (D4).
- Default mutators, no `mutator.excludedMutations` (D5). `ignoreStatic: true` (D6). No `checkers` (D8). `concurrency`, `timeoutMS`, `timeoutFactor` left at defaults (D9). `coverageAnalysis: 'perTest'` (D14).
- `incremental: false` with `incrementalFile` set, so `npm run mutation -- --incremental` turns it on and the state file lands in `reports/mutation/` (D7). `--force` works with `--incremental` as Stryker documents; AGENTS.md doesn't need to mention it beyond one line.
- `clear-text` prints the per-file table, `progress` shows progress during a long run, `html` writes the report. No JSON or dashboard reporter (D10).

Alternatives considered:
- Command runner with `vitest run`: no per-test coverage, so every mutant reruns all 66 test files.
- `stryker.config.json`: can't read an env var, and Stryker's CLI has no thresholds option.

### Minimum score from `MUTATION_MIN_SCORE`

`minScoreFromEnv()` sits in the config file:
- Unset or empty string: returns `null`, so `break` is off (D11).
- A plain decimal matching `/^\d+(\.\d+)?$/` (the same pattern as `scripts/coverageArgs.ts`) from 0 to 100 inclusive (`60`, `72.5`, `0`, `100`): returns it as a number.
- Anything else (`abc`, `-1`, `150`, `60%`, `1e1`, ` 60 `): throws `Error('MUTATION_MIN_SCORE must be a number from 0 to 100, got "<value>"')`. Stryker fails to load the config, prints the message and exits non-zero before the dry run.

It accepts the same values as `--lines` in `npm run coverage` so the two read the same way. Backend and mobile use `-Pmutation.minScore` with the same meaning.

The function stays in the config file instead of a separate module with a unit test. It is a few lines, and task 2.3 checks every case by running the command.

Alternatives considered: a wrapper script that turns a `--min-score` argument into a generated config. More code for the same result.

### npm script

`"mutation": "stryker run"` (D12). Stryker options pass through after `--` (D13). No wrapper script.

### Ignore files

`reports/` and `.stryker-tmp/` go into `.gitignore` and `.prettierignore`, and `reports/**` and `.stryker-tmp/**` into oxlint's `ignorePatterns`. Stryker's sandbox copy under `.stryker-tmp/` contains test files, so Vitest must not pick them up either; its `include` patterns are anchored to `src/` and `scripts/`, so it doesn't.

In `.oxlintrc.json`, widen the `import/no-default-export` override from `*.config.ts` to `*.config.{ts,mjs}` so `stryker.config.mjs` can use `export default`.

## Risks / Trade-offs

- [The Vitest runner may not handle Vitest 5 `projects` with two environments, or may run only one project] → Task 2.1 checks that a mutant only reached by a `*.test.tsx` test is killed, and one only reached by a `*.test.ts` test too. If not, stop and report before changing the Vitest config.
- [Stryker instruments the source with Babel before Vite transforms it. The TanStack Router plugin or the `tsconfigPaths` resolver may not handle the instrumented files in the sandbox] → Task 2.1 runs a small `--mutate` run first. Failures go back to the user before any workaround.
- [Full run time is unknown. Many component mutants, `dom` tests in jsdom. Full runs are the default (D7)] → Task 2.5 measures one full run and reports the time to the user. `--mutate` and `--incremental` give shorter runs.
- [Default mutators produce many surviving string mutants in components (class names, ARIA values)] → Accepted for an honest baseline (D5).
- [Without the TypeScript checker, some type-invalid mutants survive] → Accepted (D8).
- [A hand-written `--mutate` replaces the config's exclude list, so test files can get mutated] → AGENTS.md shows a full example with the negated patterns.
- [Stryker's CLI splits `--mutate` on commas, so `{ts,tsx}` brace patterns break] → Patterns passed to `--mutate` must not contain commas. AGENTS.md uses one pattern per extension.
- [The incremental file can go stale after rebases or dependency updates] → Incremental is opt-in, and a plain run ignores the file.
- [Timeouts under full CPU load are counted as killed and can inflate the score] → Accepted with default timeouts (D9). Task 2.5 reports the number of timeouts.
