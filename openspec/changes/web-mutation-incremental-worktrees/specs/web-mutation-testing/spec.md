# Spec Delta

## ADDED Requirements

### Requirement: New worktrees start with the main worktree's results
When a new worktree is created with a checkout, a git hook SHALL copy `reports/mutation/stryker-incremental.json` from the main worktree to the same path in the new worktree. It SHALL act on nothing else, and SHALL NOT make the checkout fail.

#### Scenario: Main worktree has results
- **WHEN** the main worktree has `reports/mutation/stryker-incremental.json` and a developer runs `git worktree add ../feature -b feature`
- **THEN** `../feature/reports/mutation/stryker-incremental.json` is a copy of it, and the first `npm run mutation` there reuses results for unchanged code

#### Scenario: Main worktree has no results
- **WHEN** the main worktree has no incremental file and a developer creates a worktree
- **THEN** no file is copied, nothing is printed, and the worktree is created normally

#### Scenario: Normal checkout
- **WHEN** a developer switches branches with `git checkout` or `git switch` in any worktree
- **THEN** the hook copies nothing

#### Scenario: Copy fails
- **WHEN** the copy can't be written
- **THEN** the worktree is still created and the command exits with success

### Requirement: Claude Code worktrees start with the main worktree's results
When Claude Code creates a worktree, it SHALL copy `reports/mutation/stryker-incremental.json` from the main worktree into the new worktree, as listed in `.worktreeinclude`. No other file under `reports/` SHALL be copied. No code SHALL run for this.

#### Scenario: Claude Code worktree
- **WHEN** the main worktree has `reports/mutation/stryker-incremental.json` and Claude Code creates a worktree
- **THEN** the new worktree has an identical copy of that file, and no `reports/mutation/mutation.html`

#### Scenario: No results in the main worktree
- **WHEN** the main worktree has no incremental file and Claude Code creates a worktree
- **THEN** the worktree is created without one

### Requirement: The hook never overwrites or shares results
The hook SHALL NOT overwrite an existing incremental file in the new worktree, SHALL copy rather than link the file, and SHALL NOT copy results from a worktree back to the main worktree.

#### Scenario: Runs in a worktree
- **WHEN** a developer runs `npm run mutation` in a worktree created with the hook
- **THEN** the main worktree's incremental file is unchanged

### Requirement: The hook is installed with the dependencies
`npm install` and `npm ci` SHALL install the hook, so a fresh clone gets it without an extra step. Installing dependencies SHALL NOT fail because the hook can't be installed, for example where there is no `.git` folder.

#### Scenario: Fresh clone
- **WHEN** a developer clones the repository, runs `npm install` and creates a worktree from the main worktree
- **THEN** the incremental file is copied into the new worktree

#### Scenario: No git folder
- **WHEN** dependencies are installed in a copy of the project without a `.git` folder
- **THEN** the install succeeds and no hook is installed

## RENAMED Requirements

- FROM: `### Requirement: Opt-in incremental runs`
- TO: `### Requirement: Incremental runs by default`

## MODIFIED Requirements

### Requirement: Incremental runs by default
`npm run mutation` SHALL reuse the results of the previous run for mutants whose source and covering tests did not change, and SHALL store its state in `reports/mutation/stryker-incremental.json`. `npm run mutation -- --force` SHALL test every mutant again.

#### Scenario: Incremental rerun without changes
- **WHEN** a developer runs `npm run mutation` twice without changing any file
- **THEN** the second run tests no mutant again and reports the same score

#### Scenario: Incremental rerun after a change
- **WHEN** a developer changes one source file between two runs
- **THEN** the second run tests only mutants in the changed file and reuses the earlier results for mutants in every other file

#### Scenario: First run
- **WHEN** no incremental file exists
- **THEN** the run tests every mutant and writes the incremental file

#### Scenario: Forced full run
- **WHEN** a developer runs `npm run mutation -- --force`
- **THEN** every mutant is tested again and the incremental file is replaced

## REMOVED Requirements

### Requirement: Full runs by default
**Reason**: Incremental runs are now the default (decisions.md D1).
**Migration**: Use `npm run mutation -- --force` for a run that tests every mutant.
