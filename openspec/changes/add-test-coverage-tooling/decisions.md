# Decisions: add-test-coverage-tooling

Confirmed with Philipp Lackner on 2026-11-23. The answers were collected by the orchestrator session (cardigan-3c), which asked the user one batch of questions for the backend, mobile and web repos and relayed the web answers here. There was no direct interview in this session. A second round settled D13 and the untracked-files part of D9 after the first draft.

## Summary

Add the tooling to generate test coverage reports for the web client from the terminal: for the whole codebase or for chosen directories, plus a diff-cover report for only the lines changed against a base branch. This change sets up tooling only. It does not write down a coverage policy, adds no shared spec and enforces no thresholds.

## Decisions

### D1 — Overall scope
- **Question**: What should this change cover?
- **Decision**: Only the setup needed to generate coverage reports from the terminal. No coverage policy, no shared spec, no enforced thresholds or rules.
- **Alternatives**: Also define a coverage policy (targets, gates) in a spec.
- **Why**: User: "I just want the related setup so we can start generating a report from the terminal."
- **Depends on**: —

### D2 — Coverage provider
- **Question**: Which Vitest coverage provider?
- **Decision**: v8 (`@vitest/coverage-v8`). Approved as a new dev dependency.
- **Alternatives**: istanbul (`@vitest/coverage-istanbul`).
- **Why**: Vitest default, fast, no extra Babel instrumentation next to the React Compiler plugin.
- **Depends on**: —

### D3 — Report formats
- **Question**: Which report formats?
- **Decision**: Cobertura XML + HTML + a terminal summary (text-summary).
- **Alternatives**: LCOV instead of Cobertura; all formats.
- **Why**: diff-cover reads Cobertura. HTML is for browsing locally.
- **Depends on**: D2

### D4 — Scoping to part of the codebase
- **Question**: How is coverage for part of the codebase chosen?
- **Decision**: Directory arguments to one script, e.g. `npm run coverage -- src/features/boards src/core/ui`. No argument means the whole codebase.
- **Alternatives**: Fixed named scripts per area; whole codebase only.
- **Why**: Directories are the natural equivalent of the Kotlin modules here (one npm package, no workspaces; the Vitest projects split by environment, not by area).
- **Depends on**: —

### D5 — Thresholds
- **Question**: Should coverage fail the command?
- **Decision**: Nothing fails by default. The coverage script takes an optional minimum line percentage and an optional minimum branch percentage; when given, the command fails if the metric isn't met. Nothing enforces them. diff-cover is report-only.
- **Alternatives**: Global thresholds; a diff-cover minimum; both.
- **Why**: Policy is out of scope (D1), but a one-off check from the terminal is useful.
- **Depends on**: D1

### D6 — Gates
- **Question**: Should coverage become part of the commit gates?
- **Decision**: No. A separate `npm run coverage`. `npm test` stays as it is and the gates in AGENTS.md don't change. Documenting the new commands in AGENTS.md is fine.
- **Alternatives**: `npm test` always collects coverage; add diff-cover to the gates.
- **Why**: Keeps the gates fast. Policy is out of scope (D1).
- **Depends on**: D1

### D7 — Include and exclude
- **Question**: Which files count?
- **Decision**: Include `src/**/*.{ts,tsx}`. Exclude test files, `src/testSetup.ts`, `*.d.ts`, `src/app/routeTree.gen.ts`, `src/core/api/generated/**`, `src/preview/**`, `**/testing/**` and `src/main.tsx`.
- **Alternatives**: Also exclude i18n string files and icons; Vitest defaults only.
- **Why**: Numbers reflect product code, not generated code, playgrounds or test helpers.
- **Depends on**: —

### D8 — Test kinds
- **Question**: Which tests count toward coverage?
- **Decision**: Both Vitest projects, `node` and `dom`.
- **Alternatives**: Only `node`; later also Playwright E2E.
- **Why**: Realistic coverage across unit and integration tests.
- **Depends on**: —

### D9 — diff-cover base
- **Question**: What does diff-cover compare against?
- **Decision**: `origin/master` by default, overridable by an argument. Staged and unstaged changes count (diff-cover's default), and untracked files count too (`--include-untracked`).
- **Alternatives**: Local `master`; leave untracked files out.
- **Why**: Matches what gets merged; the override covers offline work. A new file not yet added to git is still part of the work.
- **Depends on**: —

### D10 — Installing and running diff-cover
- **Question**: How is diff-cover (a Python tool) installed and run?
- **Decision**: `uvx diff-cover==<pinned version>` inside an npm script, `coverage:diff`. diff-cover is https://github.com/Bachmann1234/diff_cover.
- **Alternatives**: `pipx run`; a documented global install; an npm-native tool.
- **Why**: No global install, reproducible version, uv is already on the machine.
- **Depends on**: D3

### D11 — diff-cover output
- **Question**: What does the diff report produce?
- **Decision**: Terminal output + an HTML report under `coverage/`.
- **Alternatives**: Terminal only; terminal + Markdown.
- **Why**: Easy local review.
- **Depends on**: D10

### D13 — `coverage:diff` runs coverage first
- **Question**: Does `coverage:diff` read the last report or produce a new one?
- **Decision**: It runs coverage first, with the same tests, directory arguments and `--lines`/`--branches` as `npm run coverage`, and then runs diff-cover on the fresh report.
- **Alternatives**: Read the last Cobertura report without running tests.
- **Why**: It never reads a stale report. Matches backend and mobile, where `./gradlew diffCoverage` builds the report first.
- **Depends on**: D4, D5, D10

### D12 — CI
- **Question**: Run coverage in CI?
- **Decision**: Local only.
- **Alternatives**: A GitHub Actions workflow on PRs.
- **Why**: The repo has no CI.
- **Depends on**: —

## Facts

- One npm package with `package-lock.json`, no workspaces — source: `package.json`
- Vitest 5.1.0, no `@vitest/coverage-*` package installed — source: `node_modules/vitest/package.json`, `node_modules/@vitest/`
- Two Vitest projects split by environment: `node` (`src/**/*.test.ts`) and `dom` (jsdom, `src/**/*.test.tsx`) — source: `vitest.config.ts`
- No CI: there is no `.github/` folder — source: repo root
- `uv`, `pipx` and `python3` are installed locally, diff-cover is not — source: `which`
- Latest diff-cover on PyPI is 11.0.4 (requires Python >= 3.11) — source: https://pypi.org/pypi/diff-cover/json
- The gates are `typecheck`, `lint`, `format:check`, `test` and `build` — source: `AGENTS.md` "Testing"

## Out of scope

- A coverage policy: targets, enforced thresholds, shared spec
- Adding coverage to `npm test` or to the commit gates
- CI
- Playwright E2E coverage

## Deferred

None.
