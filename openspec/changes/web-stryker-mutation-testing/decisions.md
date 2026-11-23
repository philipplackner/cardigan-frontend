# Decisions: web-stryker-mutation-testing

Confirmed with Philipp Lackner on 2026-11-23. The answers were collected by the orchestrator session (cardigan-f2), which asked the user one batch of questions for the backend, mobile and web repos and relayed the web answers here. There was no direct interview in this session.

## Summary

Add Stryker mutation testing to the web client as a manual command that writes an HTML mutation report. It sets the starting point for measuring mutation scores. It is not part of the development workflow. Full runs by default; incremental runs and a minimum score are opt-in per run.

## Decisions

### D0 — Overall scope
- **Question**: What should this change cover?
- **Decision**: One command the user runs by hand that produces an HTML mutation testing report. No CI, no agent hooks, no git hooks, no thresholds that fail runs unless the user asks for one. Only the starting point for measuring mutation scores.
- **Alternatives**: Make mutation testing part of the workflow or gates.
- **Why**: User, via the orchestrator.
- **Depends on**: —

### D1 — Test runner plugin
- **Question**: Which Stryker test runner?
- **Decision**: `@stryker-mutator/vitest-runner`.
- **Alternatives**: The generic command runner running `vitest run`.
- **Why**: Supports per-test coverage, so each mutant runs only the tests that reach it.
- **Depends on**: —

### D2 — New dev dependencies
- **Question**: Which packages may be added?
- **Decision**: `@stryker-mutator/core` and `@stryker-mutator/vitest-runner` 10.1.1. Approved. No `@stryker-mutator/typescript-checker`.
- **Alternatives**: Also add the TypeScript checker.
- **Why**: Peer ranges cover Vitest 5.1 and Node 26. The checker is not used (D8).
- **Depends on**: D1, D8

### D3 — Files to mutate
- **Question**: Which files are mutated?
- **Decision**: The coverage scope minus icons: `src/**/*.{ts,tsx}` without test files, `src/testSetup.ts`, `*.d.ts`, `src/app/routeTree.gen.ts`, `src/core/api/generated/**`, `src/preview/**`, `**/testing/**`, `src/main.tsx` and `src/core/ui/icons/**`.
- **Alternatives**: The coverage scope with icons; logic only (no components).
- **Why**: Numbers line up with coverage. Icons are SVG markup with nothing to test. Components hold real behavior here.
- **Depends on**: —

### D4 — Test suites that run
- **Question**: Which tests try to kill mutants?
- **Decision**: Both Vitest projects, `node` and `dom`. Playwright E2E never runs.
- **Alternatives**: `node` only.
- **Why**: Hooks and components are only exercised by `dom` tests.
- **Depends on**: —

### D5 — Mutator set
- **Question**: Which mutators?
- **Decision**: Stryker's default set.
- **Alternatives**: Default minus `StringLiteral`; ignore Tailwind `className` strings.
- **Why**: An honest baseline. Accepted trade-off: many surviving string mutants in components.
- **Depends on**: —

### D6 — Static mutants
- **Question**: Run static mutants?
- **Decision**: No, `ignoreStatic: true`.
- **Alternatives**: Run them.
- **Why**: Each one reruns every test file. Accepted trade-off: module-level constants are not measured.
- **Depends on**: —

### D7 — Incremental mode
- **Question**: Should runs reuse earlier results?
- **Decision**: Opt-in. Off by default, so a plain `npm run mutation` is a full run. `npm run mutation -- --incremental` turns it on for that run, with the state file at `reports/mutation/stryker-incremental.json`.
- **Alternatives**: On by default with `--force` for a full run; off with no option.
- **Why**: A plain run always gives a complete, comparable result. Backend and mobile use the same opt-in model.
- **Depends on**: D10

### D8 — TypeScript checker
- **Question**: Use Stryker's TypeScript checker?
- **Decision**: No.
- **Alternatives**: On with `tsconfig.app.json`.
- **Why**: Avoids a dependency and much slower runs. Accepted trade-off: some type-invalid mutants survive as noise.
- **Depends on**: —

### D9 — Concurrency and timeouts
- **Question**: How many workers and which timeouts?
- **Decision**: Stryker defaults: concurrency one less than the CPU cores, `timeoutMS` 5000, `timeoutFactor` 1.5.
- **Alternatives**: A fixed concurrency; half the cores.
- **Why**: The run is manual and may use the whole machine.
- **Depends on**: —

### D10 — Report location
- **Question**: Where do reports go?
- **Decision**: `reports/mutation/mutation.html` plus a terminal table. `reports/` is ignored by git, Prettier and oxlint. No JSON report.
- **Alternatives**: `coverage/mutation/`; `mutation/`.
- **Why**: Stryker's default. `coverage:diff` deletes `coverage/` before each run, which would delete the report and the incremental file.
- **Depends on**: —

### D11 — Thresholds
- **Question**: Should the score ever fail a run?
- **Decision**: Optional and off by default. `thresholds.break` is `null`, so a plain run never fails on the score. A minimum can be set for one run with the env var `MUTATION_MIN_SCORE` (a number from 0 to 100), for example `MUTATION_MIN_SCORE=60 npm run mutation`. The default colour bands (high 80, low 60) stay.
- **Alternatives**: No minimum at all; a fixed `break` value in the config.
- **Why**: User. Stryker 10.1.1's CLI has no option for thresholds, so the config reads an env var. Backend and mobile get an optional `-Pmutation.minScore` with the same meaning.
- **Depends on**: D0

### D12 — Script name
- **Question**: What is the command called?
- **Decision**: `npm run mutation`.
- **Alternatives**: `npm run test:mutation`; `npm run stryker`.
- **Why**: Matches `npm run coverage` in style.
- **Depends on**: —

### D13 — Limiting a run to part of the codebase
- **Question**: How is a run limited to some files?
- **Decision**: No wrapper script. Stryker CLI options pass through after `--`, for example `npm run mutation -- --mutate "src/features/boards/**/*.{ts,tsx},!src/**/*.test.{ts,tsx},!src/**/testing/**"`. Documented in AGENTS.md.
- **Alternatives**: A wrapper with directory arguments like `npm run coverage`; full runs only.
- **Why**: No extra code. Accepted trade-off: a hand-written `--mutate` replaces the config's excludes.
- **Depends on**: —

### D14 — Coverage analysis
- **Question**: Which coverage analysis mode?
- **Decision**: `perTest`.
- **Alternatives**: `all`; `off`.
- **Why**: Fastest, and the report shows which tests kill each mutant.
- **Depends on**: D1

### D15 — Documentation and gates
- **Question**: What changes in docs and the workflow?
- **Decision**: Add the command and its options to the Commands table in AGENTS.md. `npm test`, `npm run coverage` and the commit gates stay unchanged.
- **Alternatives**: —
- **Why**: Same as the coverage change. Follows from D0.
- **Depends on**: D0

## Deferred

None.
