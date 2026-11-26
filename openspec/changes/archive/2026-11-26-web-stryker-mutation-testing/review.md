# Artifact review (light): web-stryker-mutation-testing

**Verdict:** Ready
**Reviewed:** 2026-11-23, schema `careful-planning`, repo kind `code`

| Pass | Blocker | Major | Minor |
|---|---|---|---|
| Testability | 0 | 1 | 2 |
| Security | 0 | 0 | 0 |
| Hidden assumptions | 0 | 0 | 0 |
| Design contract | 0 | 2 | 0 |

## Findings

### D1: `--mutate` example breaks because Stryker splits the option on commas
**Severity:** major · **Status:** applied
**Location:** specs/web-mutation-testing/spec.md > Run can be limited to part of the codebase > One feature (same example in tasks.md 3.1 via AGENTS.md, and in decisions.md D13)
**Current text:** "`npm run mutation -- --mutate \"src/features/boards/**/*.{ts,tsx},!src/**/*.test.{ts,tsx},!src/**/testing/**\"`"
**Failure scenario:** Stryker's CLI parses `--mutate` as a comma-separated list, so the brace globs are cut into `src/features/boards/**/*.{ts`, `tsx}`, `!src/**/*.test.{ts` and so on. Those match nothing or the wrong files, and the run either mutates nothing or mutates test files. The same broken command would be copied into AGENTS.md.
**Fix:** Replace the example everywhere outside decisions.md with brace-free patterns:
`npm run mutation -- --mutate "src/features/boards/**/*.ts,src/features/boards/**/*.tsx,!src/**/*.test.ts,!src/**/*.test.tsx,!src/**/testing/**"`
In the design.md risk list add: "Patterns passed to `--mutate` must not contain commas, because Stryker splits the option on commas. No `{ts,tsx}` braces." decisions.md D13 keeps the old example. That is a contradiction to fix by hand, since this review doesn't edit decisions.md.

### D2: `stryker.config.mjs` with a default export fails `npm run lint`
**Severity:** major · **Status:** applied
**Location:** design.md > Ignore files (and > Stryker with the Vitest runner, configured in `stryker.config.mjs`)
**Current text:** "`reports/` and `.stryker-tmp/` go into `.gitignore` and `.prettierignore`, and `reports/**` and `.stryker-tmp/**` into oxlint's `ignorePatterns`."
**Failure scenario:** `.oxlintrc.json` sets `import/no-default-export` to error and only turns it off for `*.config.ts`. oxlint also lints `.mjs`, so `export default config` in `stryker.config.mjs` breaks the lint gate. Task 2.1 would catch it, but the plan doesn't say how to fix it, so the implementer has to invent a change to the lint config.
**Fix:** Add to design.md > Ignore files: "In `.oxlintrc.json`, widen the `import/no-default-export` override from `*.config.ts` to `*.config.{ts,mjs}` so `stryker.config.mjs` can use `export default`." Add the same step to tasks.md 1.2 or 2.1.

### T1: Spec and design disagree on which `MUTATION_MIN_SCORE` values are valid
**Severity:** major · **Status:** applied
**Location:** specs/web-mutation-testing/spec.md > Invalid minimum score is rejected
**Current text:** "When `MUTATION_MIN_SCORE` is set to anything other than a number from 0 to 100, `npm run mutation` SHALL exit non-zero before running any test and name the variable and its value."
**Failure scenario:** The spec rejects an empty value ("anything other than a number"), while design.md and task 2.3 treat empty as unset and exit 0. "A number" also leaves `1e1`, `0x10` and ` 60 ` open: `Number()` accepts all three, so an implementation with `Number()` passes the spec's tests but disagrees with `--lines` in `npm run coverage`, which uses `/^\d+(\.\d+)?$/`.
**Fix:** "When `MUTATION_MIN_SCORE` is unset or empty, no minimum applies. When it is set to a value that is not a plain decimal number from 0 to 100 (digits with an optional fractional part, as `--lines` in `npm run coverage` accepts), `npm run mutation` SHALL exit non-zero before running any test and name the variable and its value." Add a scenario: "**WHEN** a developer runs `MUTATION_MIN_SCORE=1e1 npm run mutation` **THEN** the command exits non-zero, names `MUTATION_MIN_SCORE` and `1e1`, and runs no tests." Add a scenario for empty: "**WHEN** a developer runs `MUTATION_MIN_SCORE= npm run mutation` **THEN** the run behaves as if no minimum were set." Catches: an implementation that parses with `Number()`.

### T2: "Affected by that change" is not checkable
**Severity:** minor · **Status:** applied
**Location:** specs/web-mutation-testing/spec.md > Opt-in incremental runs > Incremental rerun after a change
**Current text:** "**THEN** the second run tests only mutants affected by that change"
**Failure scenario:** A run that retests every mutant in the changed file's whole feature, or every mutant in the project, could be argued to pass.
**Fix:** "**THEN** the second run tests only mutants in the changed file and reuses the earlier results for mutants in every other file". Catches: an incremental setup that silently does a full run.

### T3: "Only when a developer starts it by hand" can't fail a test
**Severity:** minor · **Status:** applied
**Location:** specs/web-mutation-testing/spec.md > Manual mutation testing command
**Current text:** "It SHALL only run when a developer starts it by hand."
**Failure scenario:** No test can observe this sentence. The requirement "Mutation testing stays out of the development workflow" already states the checkable form, so the two can drift.
**Fix:** Delete the sentence. The requirement becomes: "`npm run mutation` SHALL run mutation testing on the web client's product source files and exit when the report is written."

## Trust boundaries

- `MUTATION_MIN_SCORE` env var: local developer input read in the config. Bad values only change the exit code, and the spec rejects them. Stopped (see T1 for the exact rule).
- `--mutate` and other CLI options after `--`: local developer input passed to Stryker. It can only pick files to mutate in the developer's own checkout. No realistic attack.
- New npm dev dependencies (`@stryker-mutator/core`, `@stryker-mutator/vitest-runner`): supply chain. Version approved and pinned through the lockfile. Same exposure as any other dev dependency, nothing the spec could add.
- HTML report: contains source code, written to the git-ignored `reports/`. Never published, no CI. No exposure.

## Coverage

All 11 requirements and 17 scenarios in the delta spec were checked. All five artifacts are present. Read: decisions.md, proposal.md, the delta spec, design.md, tasks.md, `openspec/config.yaml`, AGENTS.md, CLAUDE.md, `vitest.config.ts`, `package.json`, `.gitignore`, `.prettierignore`, `.oxlintrc.json`, `tsconfig.node.json`, `scripts/coverageArgs.ts` and the requirement list of `openspec/specs/web-test-coverage`. The files named in task 2.1 (`src/core/utils/text.ts`, `DeleteBoardDialog.tsx`) and their tests exist. No other active change. No shared spec involved. Not checked: Stryker 10.1.1 and the Vitest runner's actual behavior with Vitest 5 `projects` (the design already plans to verify this in task 2.1). D1 relies on how Stryker's CLI parses `--mutate`; task 3.1's "run every documented command as written" confirms it either way.

## Applied changes

All five findings applied as proposed.

- `specs/web-mutation-testing/spec.md`: removed the "only by hand" sentence (T3); rewrote the invalid-minimum rule and added the "Empty value" and "Not a plain decimal" scenarios (T1); made the incremental-after-change outcome checkable (T2); replaced the `--mutate` example with brace-free patterns (D1).
- `design.md`: the `minScoreFromEnv` rule now names the `coverageArgs.ts` regex and lists `1e1` and ` 60 ` as rejected (T1); added the oxlint override change (D2); added the `--mutate` comma risk (D1).
- `tasks.md`: 1.2 widens the oxlint override (D2); 2.3 also checks `1e1` (T1); 3.1 requires a brace-free `--mutate` example (D1). No checkbox changed.
- Contradiction with decisions.md: D13's example `--mutate "src/features/boards/**/*.{ts,tsx},..."` uses the brace patterns that break. It was not edited here. Fix it by hand or leave it as historical.
- `proposal.md` needed no change. No non-standard artifacts in the change folder.
- `openspec validate web-stryker-mutation-testing --strict` passes.
