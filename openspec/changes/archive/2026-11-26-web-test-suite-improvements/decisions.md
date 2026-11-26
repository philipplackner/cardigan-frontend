# Decisions: web-test-suite-improvements

Confirmed with Philipp Lackner (through the orchestrator session cardiganapp-65) on 2026-11-26.

## Summary

Use the existing coverage (Vitest v8) and mutation (Stryker) tooling to close the weak spots in the web test suite. For this change only, every measured file reaches 80% line coverage, and five units (app, core, features/auth, features/boards, features/transfer) each reach an 80% mutation score on a full run. A few areas where mutation testing or coverage gives no useful signal leave the measurement for good. The 80% numbers stay inside this change and are not documented as a lasting rule.

## Decisions

### D1 — Coverage target
- **Question**: How should "80% coverage across all measured files" be read?
- **Decision**: Every measured file reaches 80% line coverage. Branch coverage is not part of the target.
- **Alternatives**: Every file with lines and branches; overall total only (already met).
- **Why**: The overall total is already 96.7% lines, so only a per-file reading creates real work. The user chose lines only.
- **Depends on**: —

### D2 — Mutation target
- **Question**: How should the "80% mutation score" target be read?
- **Decision**: Every module reaches an 80% mutation score, not every file. Measured on a full `npm run mutation -- --force` run.
- **Alternatives**: Overall score only; overall plus no file at 0%; every file at 80%.
- **Why**: The user's own answer, decided once for web and mobile.
- **Depends on**: —

### D3 — What counts as a module on web
- **Question**: Which web folders count as a "module" for D2?
- **Decision**: Five units: `src/app/`, `src/core/` as one unit, `src/features/auth/`, `src/features/boards/` (including `boardView/`), `src/features/transfer/`. Empty folders (`features/cards`, `features/labels`) have no mutants and don't count.
- **Alternatives**: app plus each core area plus each feature (8 units); the same with `boardView` separate (9 units).
- **Why**: The user chose the coarse mapping.
- **Depends on**: D2

### D4 — Excluded from mutation testing
- **Question**: Which areas should be excluded from mutation testing?
- **Decision**: All four candidates:
  - The 10 design-system components that only the preview playground uses: `BottomSheet`, `Checkbox`, `DropIndicator`, `FilterButton`, `LabelChip`, `LabelRow`, `Option`, `Panel`, `Popover`, `Swatch` (all in `src/core/ui/`).
  - Purely visual components: `BoardSkeleton`, `BoardListSkeletons`, `Logo`, `Brand`, `Spinner`, `BlankPage`.
  - `src/app/App.tsx` (provider wiring only).
  - Mutants inside Tailwind class names (`className`, `cn()`, `cva()`), everywhere, through a small local Stryker ignorer plugin.
- **Alternatives**: Keep any of them in.
- **Why**: They carry no logic, or no feature uses them yet.
- **Depends on**: —

### D5 — Excluded from coverage
- **Question**: Which files should leave coverage (and mutation) measurement?
- **Decision**: All three candidates:
  - Move `src/app/renderAppAt.tsx` (a test helper used only by `routes.test.tsx`) into `src/app/testing/`, which both tools already exclude.
  - Exclude `src/core/ui/icons/` from coverage, so coverage matches mutation.
  - Exclude the 10 preview-only components from D4 from coverage too.
- **Alternatives**: Keep any of them measured.
- **Why**: These are not product code under test, or not used by any feature yet.
- **Depends on**: D4

### D6 — Re-including preview-only components
- **Question**: What happens once a feature starts using an excluded preview-only component?
- **Decision**: The components are excluded by explicit file name in `vitest.config.ts` and `stryker.config.mjs`. AGENTS.md gets a one-line note: the change where a feature first uses an excluded component removes it from both lists and adds its tests. No numbers are documented.
- **Alternatives**: File list only, no rule; exclude for this change's calculation only.
- **Why**: Keeps the exclusion from outliving its reason.
- **Depends on**: D4, D5

### D7 — Equivalent mutants
- **Question**: How should mutants that no test can kill be handled?
- **Decision**: Refactor product code so the mutant can't exist. Behavior stays the same.
- **Alternatives**: Leave them as survived; disable each with a `// Stryker disable` comment and a reason.
- **Why**: User's choice. Keeps the score honest without suppression comments.
- **Depends on**: D8

### D8 — Product code changes
- **Question**: May the work change product code, or tests only?
- **Decision**: Tests are the main work. Removing dead code and small testability refactors are allowed, each in its own commit, with behavior unchanged and existing tests passing.
- **Alternatives**: Tests only.
- **Why**: Mutants reveal dead branches that only a code change can remove.
- **Depends on**: —

### D9 — Incremental mutation runs
- **Question**: Is incremental mutation testing on by default?
- **Decision**: Yes, already (`incremental: true` in `stryker.config.mjs`, spec requirement "Incremental runs by default"). Nothing to change.
- **Alternatives**: —
- **Why**: Fact from the config.
- **Depends on**: —

### D10 — Where the 80% numbers live
- **Question**: Where may the targets be written down?
- **Decision**: Only in this change's artifacts. No threshold in the configs, AGENTS.md, CLAUDE.md, skills or main specs. Spec deltas only change which files the tools measure.
- **Alternatives**: —
- **Why**: Set by the orchestrated request: a one-time goal.
- **Depends on**: —

## Facts

- Coverage on 2026-11-26: 196 files, 891 tests, lines 96.67%, branches 90.11%, functions 94.46%, statements 94.92% — source: `npm run coverage`
- After D5, files under 80% lines: `src/app/App.tsx` 0%, `src/core/ui/layout/AppLayout.tsx` 64.3%, `src/core/ui/Button.tsx` 71.4% — source: `coverage/cobertura-coverage.xml`
- Mutation score on 2026-11-26: 76.35% (2987 detected of 3912; 783 survived, 142 no coverage, 276 ignored static) — source: `npm run mutation` with an extra JSON reporter
- Estimated per-unit score with D4 applied (class-name ignore estimated line by line, so core will come out higher): app 91.7%, core ~57.8% (~145 kills short, almost all in `core/ui`), features/auth 89.5%, features/boards 80.3%, features/transfer 85.3% — source: `reports/mutation/mutation.json`
- Largest gaps: `useBoardViewModel.ts` 132 undetected, `TextArea.tsx` 40, `boardViewReducer.ts` 30, `AppLayout.tsx` 26, `Card.tsx` 26, `BoardListScreen.tsx` 25, `Toast.tsx` 22, `DropZone.tsx` 22 — source: `reports/mutation/mutation.json`
- The 10 preview-only components are imported only by `src/core/ui/index.ts`, `src/preview/**` and each other — source: grep over `src/`
- No shared spec in cardigan-shared-specs covers test tooling — source: `openspec list --specs --store cardigan-shared-specs`

## Out of scope

- A branch coverage target
- Coverage or mutation gates in hooks, CI or configs
- E2E (Playwright) tests
- The empty `cards` and `labels` features
- Documenting the 80% numbers anywhere outside this change

## Deferred

None.
