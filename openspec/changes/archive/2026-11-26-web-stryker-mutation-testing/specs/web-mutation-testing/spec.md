# Spec Delta

## Purpose

Defines the manual terminal command that runs mutation testing on the web client and writes an HTML mutation report. It covers tooling only and sets no mutation score policy.

## ADDED Requirements

### Requirement: Manual mutation testing command
`npm run mutation` SHALL run mutation testing on the web client's product source files and exit when the report is written.

#### Scenario: Run the command
- **WHEN** a developer runs `npm run mutation` and all tests pass on the unmutated code
- **THEN** mutants are generated and tested, a summary with the mutation score is printed, and the command exits with success

#### Scenario: Tests fail before mutating
- **WHEN** a test fails on the unmutated code
- **THEN** the command exits non-zero without testing any mutant

### Requirement: Product source files are mutated
The command SHALL mutate the same product source files that the coverage report measures, minus the icon components. It SHALL NOT mutate test files, test helpers, generated code, the preview playground or the app entry file.

#### Scenario: Excluded files
- **WHEN** a full mutation run finishes
- **THEN** the report contains no file that matches `*.test.ts(x)`, `src/testSetup.ts`, `*.d.ts`, `src/app/routeTree.gen.ts`, `src/core/api/generated/**`, `src/preview/**`, `**/testing/**`, `src/main.tsx` or `src/core/ui/icons/**`

#### Scenario: Components are included
- **WHEN** a full mutation run finishes
- **THEN** the report contains files under `src/features/*/components/` and `src/core/ui/`

### Requirement: Unit and DOM tests kill mutants
Mutants SHALL be tested against the Vitest tests of both the `node` and the `dom` projects. Playwright E2E tests SHALL NOT run.

#### Scenario: Mutant only reached by a unit test
- **WHEN** a mutant in a util is caught only by a `*.test.ts` test
- **THEN** the report marks it as killed

#### Scenario: Mutant only reached by a screen test
- **WHEN** a mutant in a component is caught only by a `*.test.tsx` test
- **THEN** the report marks it as killed

### Requirement: HTML mutation report
Each run SHALL write a browsable HTML report to `reports/mutation/mutation.html` that shows each mutated file's score and each mutant's status, and SHALL print a per-file summary table to the terminal. `reports/` SHALL be ignored by git.

#### Scenario: Report after a run
- **WHEN** `npm run mutation` finishes
- **THEN** `reports/mutation/mutation.html` exists and shows the overall mutation score and the score per file

#### Scenario: Git status after a run
- **WHEN** `npm run mutation` has run on a clean checkout
- **THEN** `git status` shows no changes

### Requirement: Score does not fail a run by default
Without a minimum score, `npm run mutation` SHALL exit with success whenever the run completes, whatever the mutation score.

#### Scenario: Low score
- **WHEN** a run completes with a mutation score of 10% and no minimum is set
- **THEN** the command exits with success

### Requirement: Optional minimum score
`npm run mutation` SHALL accept an optional minimum mutation score for one run through the `MUTATION_MIN_SCORE` environment variable. When the final score is below it, the command SHALL exit non-zero and say the minimum was missed. The report SHALL still be written.

#### Scenario: Minimum met
- **WHEN** a developer runs `MUTATION_MIN_SCORE=60 npm run mutation` and the score is 72%
- **THEN** the command exits with success

#### Scenario: Minimum missed
- **WHEN** a developer runs `MUTATION_MIN_SCORE=80 npm run mutation` and the score is 72%
- **THEN** the command exits non-zero, says the score is under the minimum, and `reports/mutation/mutation.html` is written

### Requirement: Invalid minimum score is rejected
When `MUTATION_MIN_SCORE` is unset or empty, no minimum applies. When it is set to a value that is not a plain decimal number from 0 to 100 (digits with an optional fractional part, as `--lines` in `npm run coverage` accepts), `npm run mutation` SHALL exit non-zero before running any test and name the variable and its value.

#### Scenario: Empty value
- **WHEN** a developer runs `MUTATION_MIN_SCORE= npm run mutation`
- **THEN** the run behaves as if no minimum were set

#### Scenario: Not a plain decimal
- **WHEN** a developer runs `MUTATION_MIN_SCORE=1e1 npm run mutation`
- **THEN** the command exits non-zero, names `MUTATION_MIN_SCORE` and `1e1`, and runs no tests

#### Scenario: Not a number
- **WHEN** a developer runs `MUTATION_MIN_SCORE=abc npm run mutation`
- **THEN** the command exits non-zero, names `MUTATION_MIN_SCORE` and `abc`, and runs no tests

#### Scenario: Out of range
- **WHEN** a developer runs `MUTATION_MIN_SCORE=150 npm run mutation`
- **THEN** the command exits non-zero, names `MUTATION_MIN_SCORE` and `150`, and runs no tests

### Requirement: Full runs by default
A plain `npm run mutation` SHALL test every mutant and SHALL NOT reuse results from an earlier run.

#### Scenario: Two plain runs
- **WHEN** a developer runs `npm run mutation` twice without changing any file
- **THEN** the second run tests every mutant again

### Requirement: Opt-in incremental runs
`npm run mutation -- --incremental` SHALL reuse the results of the previous incremental run for mutants whose source and covering tests did not change, and SHALL store its state under `reports/mutation/`.

#### Scenario: Incremental rerun without changes
- **WHEN** a developer runs `npm run mutation -- --incremental` twice without changing any file
- **THEN** the second run tests no mutant again and reports the same score

#### Scenario: Incremental rerun after a change
- **WHEN** a developer changes one source file between two incremental runs
- **THEN** the second run tests only mutants in the changed file and reuses the earlier results for mutants in every other file

### Requirement: Run can be limited to part of the codebase
`npm run mutation` SHALL accept Stryker options after `--`, including a file pattern that limits which files are mutated.

#### Scenario: One feature
- **WHEN** a developer runs `npm run mutation -- --mutate "src/features/boards/**/*.ts,src/features/boards/**/*.tsx,!src/**/*.test.ts,!src/**/*.test.tsx,!src/**/testing/**"`
- **THEN** only files under `src/features/boards/` are mutated and appear in the report

### Requirement: Mutation testing stays out of the development workflow
No other command, git hook, agent hook or CI job SHALL run mutation testing. `npm test`, `npm run coverage` and the commit gates SHALL NOT run it.

#### Scenario: Plain test run
- **WHEN** a developer runs `npm test`
- **THEN** no mutant is generated and `reports/` is not written
