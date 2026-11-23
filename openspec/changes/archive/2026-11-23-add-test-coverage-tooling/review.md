# Artifact review (light): add-test-coverage-tooling

**Verdict:** Ready
**Reviewed:** 2026-11-23, schema `careful-planning`, repo kind `code`

| Pass | Blocker | Major | Minor |
|---|---|---|---|
| Testability | 0 | 1 | 2 |
| Security | 0 | 1 | 0 |
| Hidden assumptions | 0 | 2 | 1 |
| Design contract | 0 | 1 | 1 |

## Findings

### T1: `coverage:diff` arguments and prerequisites are not checked before the tests run
**Severity:** major · **Status:** applied
**Location:** specs/web-test-coverage/spec.md > Requirement: Invalid coverage arguments are rejected
**Current text:** "`npm run coverage` SHALL fail before running any test when a directory argument doesn't exist, a threshold value is not a number from 0 to 100, or an option is unknown. The error SHALL name the bad argument."
**Failure scenario:** `npm run coverage:diff -- --compare-branch=mastr`, a clone where `origin/master` was never fetched, or a machine without `uv` runs the full suite first and then fails inside diff-cover or with a spawn `ENOENT`. Nothing in the spec says `coverage:diff` validates anything, so a script that only validates in `coverage` mode passes every scenario. It also goes against the design goal that argument mistakes should fail fast.
**Fix:** Replace the requirement text with:
> `npm run coverage` and `npm run coverage:diff` SHALL fail before running any test when a directory argument doesn't exist, a threshold value is not a number from 0 to 100, or an option is unknown. `npm run coverage:diff` SHALL also fail before running any test when the compare ref does not resolve to a commit, or when `uv` is not on the `PATH`. The error SHALL name the bad argument or ref, or say that `uv` is needed.

Add these scenarios:
> #### Scenario: Unknown compare ref
> - **WHEN** a developer runs `npm run coverage:diff -- --compare-branch=mastr`
> - **THEN** the command exits non-zero, names `mastr`, and runs no tests
>
> #### Scenario: uv missing
> - **WHEN** `uv` is not on the `PATH` and a developer runs `npm run coverage:diff`
> - **THEN** the command exits non-zero, says `uv` is needed, and runs no tests

It catches a script that checks the ref only after Vitest has finished. Carry into design.md ("Flow in diff mode", new step 0: `git rev-parse --verify --quiet <ref>^{commit}` and a `uv --version` check) and into task 3.3.

### S1: Only the top-level diff-cover version is pinned, not its dependencies
**Severity:** major · **Status:** applied
**Location:** design.md > `coverage:diff` is the same script in diff mode (step 3); specs/web-test-coverage/spec.md > Requirement: Same diff-cover version for everyone
**Current text:** "`uvx diff-cover==11.0.4 coverage/cobertura-coverage.xml ...`" and "`npm run coverage:diff` SHALL run a pinned diff-cover version"
**Failure scenario:** `uvx diff-cover==11.0.4` resolves diff-cover's dependencies (Jinja2, Pygments, chardet, pluggy) to their newest releases when each machine first runs it. A compromised or broken release of one of them then runs code on a developer's machine. Two developers can also end up with different dependency sets, which breaks the "same version for everyone" goal.
**Fix:** In design.md step 3, use:
> `uvx --exclude-newer <pin date> diff-cover==11.0.4 coverage/cobertura-coverage.xml --compare-branch=<ref> --include-untracked --format html:coverage/diff-cover.html`
>
> The pin date (`2026-11-23`) lives next to the version constant in `scripts/coverageArgs.ts`, and both are updated together.

In the spec requirement, write: "`npm run coverage:diff` SHALL run a pinned diff-cover version with its dependencies resolved as of a fixed date, and SHALL need no global install apart from `uv`." Add the flag to task 3.1's argument list.

### A1: Path forms for directory arguments are not defined
**Severity:** major · **Status:** applied
**Location:** specs/web-test-coverage/spec.md > Requirement: Coverage for chosen directories; design.md > A small wrapper script handles the arguments
**Current text:** "`npm run coverage` SHALL accept one or more directory paths."
**Failure scenario:** `npm run coverage -- ./src/features/boards` passes the existence check. It then becomes the filter `./src/features/boards/` and the include `./src/features/boards/**`. Neither matches Vitest's file paths, so no tests run or the report is empty. This is the exact failure the design means to prevent. Absolute paths and running from a subfolder (npm runs scripts from the package root, not the shell's directory) have the same problem, and two implementers would handle them differently.
**Fix:** Add to the requirement:
> Directory paths are relative to the repository root. The script SHALL normalize each path (strip a leading `./` and trailing slashes, and turn an absolute path inside the repository into a relative one) before using it. A path outside the repository SHALL be rejected as invalid.

Add a scenario:
> #### Scenario: Leading `./`
> - **WHEN** a developer runs `npm run coverage -- ./src/features/boards`
> - **THEN** the run and report are the same as for `src/features/boards`

Add `./` and absolute-path inputs to the test list in task 2.1.

### A2: A directory with no tests fails or passes depending on the implementation
**Severity:** major · **Status:** applied
**Location:** specs/web-test-coverage/spec.md > Requirement: Coverage for chosen directories, and Requirement: Coverage does not fail by default
**Current text:** "`npm run coverage` SHALL accept one or more directory paths. It SHALL then run only the tests inside those directories" / "SHALL exit with success whenever all tests pass"
**Failure scenario:** `src/features/cards`, `src/features/labels`, `src/app/routes`, `src/app/shell` and `src/core/i18n` have no test files today. `npm run coverage -- src/features/cards` makes Vitest exit 1 with "No test files found" and write no report. Under the "exit with success whenever all tests pass" rule that is arguably wrong, and a developer asking what that folder's coverage is (0%) gets an error instead. In diff mode, the missing Cobertura file is then read as a failing test.
**Fix:** Add to "Coverage for chosen directories":
> When the chosen directories contain no test files, the command SHALL still exit with success and report their product files at 0%.

with the scenario:
> #### Scenario: Directory without tests
> - **WHEN** a developer runs `npm run coverage -- src/features/cards` and no test file exists under it
> - **THEN** the command exits with success and the report lists the files under `src/features/cards/` at 0%

In design.md, add `--passWithNoTests` to the Vitest arguments for scoped runs.

### A3: "changed against origin/master" doesn't say from which point
**Severity:** minor · **Status:** applied
**Location:** specs/web-test-coverage/spec.md > Requirement: Coverage of changed lines
**Current text:** "`npm run coverage:diff` SHALL show coverage for only the lines changed against `origin/master`"
**Failure scenario:** If `origin/master` has moved on since the branch was cut, a two-dot diff also lists master's new commits as changes on this branch. diff-cover uses the merge base by default, but the spec doesn't say so, so a test of the behavior can't be written.
**Fix:** "`npm run coverage:diff` SHALL show coverage for only the lines changed since the merge base of `HEAD` and `origin/master`, including committed, staged, unstaged and untracked changes."

### D1: A stale report can still reach diff-cover
**Severity:** major · **Status:** applied
**Location:** design.md > `coverage:diff` is the same script in diff mode, steps 1–2
**Current text:** "1. Run Vitest exactly as `coverage` does. `coverage.clean` deletes the old reports first. 2. If `coverage/cobertura-coverage.xml` doesn't exist afterwards, the tests failed"
**Failure scenario:** Vitest cleans `coverage/` only once the coverage provider starts. If Vitest exits before that, for example on a config error, a bad CLI option or a startup crash, the old `cobertura-coverage.xml` is still there. The script then runs diff-cover on an earlier run's report, which breaks "SHALL never use a report from an earlier run".
**Fix:** Replace step 1 with:
> 1. Delete `coverage/` (recursive, ignore if missing), then run Vitest exactly as `coverage` does. The script deletes the folder itself, so step 2 never sees a report that this run didn't write.

Add to task 3.3: "a Vitest startup failure with an old report in `coverage/` exits non-zero without running diff-cover".

### T2: Threshold format is open to interpretation
**Severity:** minor · **Status:** applied
**Location:** design.md > A small wrapper script handles the arguments; task 2.1
**Current text:** "`--lines <pct>` and `--branches <pct>`: numbers from 0 to 100."
**Failure scenario:** One implementation accepts `--lines=80` and `85.5`, another rejects them as an unknown option or as not a number. `--compare-branch` explicitly gets both spellings, which makes developers expect the same for `--lines`.
**Fix:** "`--lines <pct>` and `--branches <pct>` (also `--lines=<pct>` and `--branches=<pct>`): decimal numbers from 0 to 100 inclusive, for example `80` or `85.5`." Add both spellings and a decimal value to the test list in task 2.1. It catches a parser that only splits on spaces.

### T3: The exclude scenarios don't cover every excluded path
**Severity:** minor · **Status:** applied
**Location:** specs/web-test-coverage/spec.md > Requirement: Generated code, playgrounds and test helpers are not measured
**Current text:** "no `*.test.ts(x)` file, no file under a `testing/` folder and no file under `src/preview/` appear in the report"
**Failure scenario:** A config that forgets `src/main.tsx`, `src/testSetup.ts` or `*.d.ts` (for example `src/app/i18next.d.ts`) still passes both scenarios.
**Fix:** Add the scenario:
> #### Scenario: Entry, setup and declaration files
> - **WHEN** coverage runs for the whole codebase
> - **THEN** `src/main.tsx`, `src/testSetup.ts` and no `*.d.ts` file appear in the report

### D2: The proposal's file list misses the oxlint config
**Severity:** minor · **Status:** applied
**Location:** proposal.md > Impact > Files
**Current text:** "`package.json`, `vitest.config.ts`, a small coverage script under `scripts/`, `tsconfig.node.json`, `.gitignore`, `.prettierignore`, `AGENTS.md`."
**Failure scenario:** design.md and task 1.3 also change `.oxlintrc.json`. Someone checking scope against the proposal would see that edit as out of scope.
**Fix:** "`package.json`, `vitest.config.ts`, a small coverage script and its unit test under `scripts/`, `tsconfig.node.json`, `.gitignore`, `.prettierignore`, `.oxlintrc.json`, `AGENTS.md`."

## Trust boundaries

- **PyPI through `uvx` (third-party code run locally):** an attacker publishes a malicious release of a diff-cover dependency. The spec pins only diff-cover itself, so this isn't stopped. See S1.
- **Arguments passed to the script, then to Vitest, git and uvx:** shell metacharacters in a directory or ref could inject commands if the script spawns through a shell. The arguments come from the developer on their own machine, so there is no privilege boundary to cross. No finding, but `spawn` with an argument array (no `shell: true`) is the natural choice.
- **`--include-untracked` reading untracked files:** a stray file could hold secrets. Reports stay local in the git-ignored `coverage/` folder, and only files in the Cobertura report show up. Stopped.
- **HTML reports with source code:** stay in git-ignored `coverage/` and are never published (no CI, D12). Stopped.

## Coverage

Checked all 12 requirements and 23 scenarios in `specs/web-test-coverage/spec.md`, plus proposal.md, design.md, tasks.md and decisions.md (D1–D13, no contradictions found). Read `openspec/config.yaml`, `AGENTS.md` (testing and commands), `vitest.config.ts`, `package.json`, `tsconfig.node.json`, `tsconfig.app.json`, `tsconfig.test.json`, `.gitignore`, `.prettierignore`, `.oxlintrc.json` and one existing unit test. No shared spec is involved, and no other active change exists. Main specs (`web-*`) were not read in detail because none of them covers tooling.

Not verified in a light review: how Vitest 5.1 merges a CLI `--coverage.include` with the config value (design already has a fallback and task 2.3 checks it), exactly when Vitest cleans the reports directory, and diff-cover 11.0.4's `--format html:` syntax (task 3.2 checks it).

## Applied changes

All nine findings were applied as recommended on 2026-11-23.

- `specs/web-test-coverage/spec.md`: T1, S1, A1, A2, A3, T3. The A1 normalization rule became its own requirement, "Directory paths are normalized", with a "Path outside the repository" scenario, because `openspec validate --strict` flagged the combined requirement as too long.
- `design.md`: T1 (step 0 preflight), D1 (script deletes `coverage/`), S1 (`--exclude-newer` and its constant), A1 (path normalization), A2 (`--passWithNoTests`, plus a risk entry for the no-test-file case), A3 (merge base), T2 (threshold format).
- `tasks.md`: the matching checks were added to 2.1, 2.3, 3.1, 3.2 and 3.3. No checkboxes changed.
- `proposal.md`: D2 (file list), plus the S1 and A3 wording in the `coverage:diff` bullet.

`decisions.md` was not edited and no fix contradicts it. There are no non-standard artifacts in the change folder. No risks were accepted. `openspec validate add-test-coverage-tooling --strict` passes.
