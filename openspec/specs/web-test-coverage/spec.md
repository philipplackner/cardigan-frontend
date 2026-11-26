# web-test-coverage Specification

## Purpose
Defines the terminal commands that produce test coverage reports for the web client: for the whole codebase, for chosen directories, and for only the lines changed against a base branch. It covers tooling only and sets no coverage policy.

## Requirements

### Requirement: Coverage for the whole codebase
`npm run coverage` without arguments SHALL run every Vitest test in both the `node` and `dom` projects and report coverage for all product source files under `src/`, including files no test loads.

#### Scenario: Run without arguments
- **WHEN** a developer runs `npm run coverage`
- **THEN** the tests of both projects run and the report covers every product source file under `src/`

#### Scenario: Untested file
- **WHEN** a product source file under `src/` is not loaded by any test
- **THEN** the report lists it with 0% coverage

### Requirement: Generated code, playgrounds and test helpers are not measured
The coverage report SHALL leave out test files, the test setup file, type declaration files, the generated route tree, generated API code, the preview playground, `testing/` helper folders, the app entry file, the icon components, and design-system components that only the preview playground uses.

#### Scenario: Generated API code
- **WHEN** coverage runs for the whole codebase
- **THEN** no file under `src/core/api/generated/` and not `src/app/routeTree.gen.ts` appear in the report

#### Scenario: Test helpers and playground
- **WHEN** coverage runs for the whole codebase
- **THEN** no `*.test.ts(x)` file, no file under a `testing/` folder and no file under `src/preview/` appear in the report

#### Scenario: Entry, setup and declaration files
- **WHEN** coverage runs for the whole codebase
- **THEN** `src/main.tsx`, `src/testSetup.ts` and no `*.d.ts` file appear in the report

#### Scenario: Icons
- **WHEN** coverage runs for the whole codebase
- **THEN** no file under `src/core/ui/icons/` appears in the report

#### Scenario: Preview-only design components
- **WHEN** coverage runs for the whole codebase and no feature uses `BottomSheet`, `Checkbox`, `DropIndicator`, `FilterButton`, `LabelChip`, `LabelRow`, `Option`, `Panel`, `Popover` or `Swatch` from `src/core/ui/`
- **THEN** none of those component files appear in the report

#### Scenario: Design components used by a feature
- **WHEN** coverage runs for the whole codebase
- **THEN** every `src/core/ui/` component a feature renders appears in the report

### Requirement: Coverage for chosen directories
`npm run coverage` SHALL accept one or more directory paths. It SHALL then run only the tests inside those directories and report only on product source files inside them.

#### Scenario: One feature
- **WHEN** a developer runs `npm run coverage -- src/features/boards`
- **THEN** only tests under `src/features/boards/` run and the report contains only files under `src/features/boards/`

#### Scenario: Several directories
- **WHEN** a developer runs `npm run coverage -- src/features/boards src/core/ui`
- **THEN** the report contains files from both directories and from no other directory

#### Scenario: Directory name is a prefix of another
- **WHEN** a developer passes `src/features/board` and a sibling folder `src/features/boards` exists
- **THEN** files under `src/features/boards/` are not part of the run

### Requirement: Directories without tests are still reported
When the chosen directories contain no test files, `npm run coverage` SHALL still exit with success and report their product files at 0%.

#### Scenario: Directory without tests
- **WHEN** a developer runs `npm run coverage -- src/features/cards` and no test file exists under it
- **THEN** the command exits with success and the report lists the files under `src/features/cards/` at 0%

### Requirement: Directory paths are normalized
Directory arguments are relative to the repository root. The script SHALL normalize each path (strip a leading `./` and trailing slashes, and turn an absolute path inside the repository into a relative one) before using it. A path outside the repository SHALL be rejected as invalid.

#### Scenario: Leading `./`
- **WHEN** a developer runs `npm run coverage -- ./src/features/boards`
- **THEN** the run and report are the same as for `src/features/boards`

#### Scenario: Path outside the repository
- **WHEN** a developer passes `/tmp` or `../other-repo`
- **THEN** the command exits non-zero, names the path, and runs no tests

### Requirement: Invalid coverage arguments are rejected
`npm run coverage` and `npm run coverage:diff` SHALL fail before running any test when a directory argument doesn't exist, a threshold value is not a number from 0 to 100, or an option is unknown. `npm run coverage:diff` SHALL also fail before running any test when the compare ref does not resolve to a commit, or when `uv` is not on the `PATH`. The error SHALL name the bad argument or ref, or say that `uv` is needed.

#### Scenario: Typo in a directory
- **WHEN** a developer runs `npm run coverage -- src/features/bords`
- **THEN** the command exits non-zero, names `src/features/bords`, and runs no tests

#### Scenario: Bad threshold
- **WHEN** a developer passes a line threshold of `abc` or `150`
- **THEN** the command exits non-zero and names the threshold

#### Scenario: Unknown compare ref
- **WHEN** a developer runs `npm run coverage:diff -- --compare-branch=mastr`
- **THEN** the command exits non-zero, names `mastr`, and runs no tests

#### Scenario: uv missing
- **WHEN** `uv` is not on the `PATH` and a developer runs `npm run coverage:diff`
- **THEN** the command exits non-zero, says `uv` is needed, and runs no tests

### Requirement: Coverage reports are written to the coverage folder
Each coverage run SHALL print a summary of line, branch, function and statement coverage to the terminal and SHALL write a Cobertura XML report and a browsable HTML report to `coverage/`, replacing the previous run's reports. `coverage/` SHALL be ignored by git.

#### Scenario: Reports after a run
- **WHEN** `npm run coverage` finishes
- **THEN** the terminal shows the four percentages and `coverage/` holds a Cobertura XML file and an HTML report

#### Scenario: Git status after a run
- **WHEN** `npm run coverage` has run on a clean checkout
- **THEN** `git status` shows no changes

### Requirement: Coverage does not fail by default
Without threshold options, `npm run coverage` SHALL exit with success whenever all tests pass, whatever the coverage percentage. It SHALL exit non-zero when a test fails.

#### Scenario: Low coverage
- **WHEN** line coverage is 10% and all tests pass
- **THEN** the command exits with success

#### Scenario: Failing test
- **WHEN** a test fails during `npm run coverage`
- **THEN** the command exits non-zero

### Requirement: Optional minimum coverage
`npm run coverage` SHALL accept an optional minimum line percentage and an optional minimum branch percentage. When one is given and the measured value for the reported files is below it, the command SHALL exit non-zero and say which minimum was missed. Reports SHALL still be written.

#### Scenario: Line minimum met
- **WHEN** a developer runs coverage with a line minimum of 80 and line coverage is 85%
- **THEN** the command exits with success

#### Scenario: Branch minimum missed in a directory
- **WHEN** a developer runs coverage for `src/core/ui` with a branch minimum of 90 and branch coverage there is 70%
- **THEN** the command exits non-zero, says the branch minimum was missed, and the reports are in `coverage/`

### Requirement: Test runs and gates are unchanged
`npm test` SHALL NOT collect coverage, and the commit gates SHALL NOT include any coverage command.

#### Scenario: Plain test run
- **WHEN** a developer runs `npm test`
- **THEN** no coverage is collected and `coverage/` is not written

### Requirement: Changed-line coverage runs coverage first
`npm run coverage:diff` SHALL first run coverage exactly as `npm run coverage` would with the same directory and minimum arguments, and SHALL then build the changed-line report from that fresh run. It SHALL never use a report from an earlier run.

#### Scenario: Stale report present
- **WHEN** `coverage/` holds a report from an earlier run and a developer runs `npm run coverage:diff`
- **THEN** the tests run again and the diff report reflects the current code

#### Scenario: Scoped diff
- **WHEN** a developer runs `npm run coverage:diff -- src/features/boards`
- **THEN** only tests under `src/features/boards/` run and the diff report covers only changed files in that directory

#### Scenario: Failing test
- **WHEN** a test fails during `npm run coverage:diff`
- **THEN** the command exits non-zero and produces no diff report

#### Scenario: Minimum missed
- **WHEN** a developer passes a line minimum to `npm run coverage:diff` and it is missed
- **THEN** the diff report is still printed and written, and the command exits non-zero

### Requirement: Coverage of changed lines
`npm run coverage:diff` SHALL show coverage for only the lines changed since the merge base of `HEAD` and `origin/master`, including committed, staged, unstaged and untracked changes. It SHALL print to the terminal and write an HTML report to `coverage/`.

#### Scenario: Branch with changes
- **WHEN** a developer runs `npm run coverage:diff` on a branch with changes in `src/`
- **THEN** the terminal lists each changed source file with its changed-line coverage and missing line numbers, and an HTML diff report is in `coverage/`

#### Scenario: Uncommitted changes count
- **WHEN** a changed line in `src/` is only staged or only in the working tree
- **THEN** it is part of the diff report

#### Scenario: Untracked file counts
- **WHEN** a new source file under `src/` has not been added to git
- **THEN** its lines are part of the diff report

### Requirement: Diff base can be overridden
`npm run coverage:diff` SHALL accept a different branch or ref to compare against instead of `origin/master`.

#### Scenario: Compare with local master
- **WHEN** a developer runs `npm run coverage:diff -- --compare-branch=master`
- **THEN** the report covers the lines changed against local `master`

### Requirement: Changed-line coverage is report-only
`npm run coverage:diff` SHALL NOT fail because of a low changed-line coverage percentage. Only the optional minimums from the coverage run can fail it.

#### Scenario: Uncovered changes
- **WHEN** none of the changed lines are covered
- **THEN** the command exits with success and shows 0% for the changed lines

### Requirement: Same diff-cover version for everyone
`npm run coverage:diff` SHALL run a pinned diff-cover version with its dependencies resolved as of a fixed date, and SHALL need no global install apart from `uv`.

#### Scenario: Fresh machine with uv
- **WHEN** a developer with `uv` but without diff-cover runs `npm run coverage:diff`
- **THEN** the command fetches the pinned diff-cover version and produces the report
