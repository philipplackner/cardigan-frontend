# Artifact review (light): web-test-suite-improvements

**Verdict:** Ready
**Reviewed:** 2026-11-26, schema `careful-planning`, repo kind `code`

| Pass | Blocker | Major | Minor |
|---|---|---|---|
| Testability | 0 | 2 | 2 |
| Security | 0 | 0 | 0 |
| Hidden assumptions | 0 | 1 | 0 |
| Design contract | 0 | 2 | 0 |

## Findings

### T1: Class-name requirement says no mutant is generated, but the design reports them as Ignored
**Severity:** major · **Status:** applied
**Location:** specs/web-mutation-testing/spec.md > Requirement: Class-name mutants are not tested, Scenario: Class string in a component
**Current text:** "Mutation testing SHALL NOT generate or count mutants that only change Tailwind class names" and "**THEN** the report contains no mutant for that expression"
**Failure scenario:** The design's Stryker ignorer still generates these mutants and shows them in the report with status `Ignored` (task 2.2 even checks for that). A test written from the scenario fails on the correct implementation, or an implementer drops the ignorer for a mutator exclusion to make the scenario pass.
**Fix:** Requirement: "Mutation testing SHALL report mutants that only change Tailwind class names (mutants inside a `className` value or inside the arguments of `cn()` or `cva()`) with status `Ignored`, and SHALL NOT count them in the mutation score. Mutants elsewhere in the same file SHALL still be tested." Scenario THEN: "every mutant inside that expression has status `Ignored` in the report, and none is Killed, Survived or NoCoverage". Wrong implementation caught: an ignorer that only matches the `className` attribute node itself but not its descendants, leaving the `isActive && 'bg-accent'` mutants as Survived.

### T2: No scenario catches the rejected global string-literal exclusion
**Severity:** major · **Status:** applied
**Location:** specs/web-mutation-testing/spec.md > Requirement: Class-name mutants are not tested, Scenario: Logic next to a class name
**Current text:** "**WHEN** the same component calls `onSelect(id)` in a click handler / **THEN** the report still contains mutants for that handler"
**Failure scenario:** Turning off the `StringLiteral` mutator globally (the alternative design.md rejects) passes all three scenarios, since `onSelect(id)` has no string. i18n keys, query keys and error codes silently stop being mutated.
**Fix:** Add a scenario: "#### Scenario: Strings outside class names / - **WHEN** the same component passes `aria-label={t('board.close')}` or a query key string / - **THEN** the report contains string-literal mutants for those strings, with a status other than `Ignored`". Wrong implementation caught: `mutator.excludedMutations: ['StringLiteral']`.

### T3: "Purely visual components" in the requirement is open-ended
**Severity:** minor · **Status:** applied
**Location:** specs/web-mutation-testing/spec.md > Requirement: Product source files are mutated
**Current text:** "minus purely visual components without logic and the app root component"
**Failure scenario:** The requirement lets an implementer exclude any component they judge to be visual, while the scenario lists only six. A later change could drop a component with logic and still claim compliance.
**Fix:** "minus the purely visual components listed in the scenario below (`BlankPage`, `Logo`, `Brand`, `Spinner`, `BoardListSkeletons`, `BoardSkeleton`) and the app root component `src/app/App.tsx`"

### T4: Mutation spec has no scenario for a preview-only component that a feature starts using
**Severity:** minor · **Status:** applied
**Location:** specs/web-mutation-testing/spec.md > Requirement: Product source files are mutated
**Current text:** "**WHEN** a full mutation run finishes and no feature uses `BottomSheet`, … from `src/core/ui/`"
**Failure scenario:** The coverage delta has "Design components used by a feature", but the mutation delta doesn't. If a feature starts using `Popover` and only `vitest.config.ts` is updated, nothing in the mutation spec fails (D6 needs both lists updated).
**Fix:** Add: "#### Scenario: Design components used by a feature / - **WHEN** a full mutation run finishes / - **THEN** every `src/core/ui/` component a feature renders appears in the report, except `Logo`, `Brand` and `Spinner`"

### A1: Which Stryker score column counts toward the per-unit target is not stated
**Severity:** major · **Status:** applied
**Location:** design.md > "Module" for the mutation target; tasks.md > 3.1, 4.10, 5.6, 7.2
**Current text:** "The score per unit is the folder row in the clear-text table and in `reports/mutation/mutation.html`."
**Failure scenario:** Stryker shows two scores per row: `% score` (total) and `% covered` (excludes no-coverage mutants). One implementer reads `% covered` for boards or app and declares 80% met while the total is below it; core's hand sum uses the total formula, so units are measured on different bases.
**Fix:** "The score per unit is the `% Mutation score / total` column of the folder row (detected / (detected + undetected), where undetected includes NoCoverage), never the `covered` column. Core uses the same formula, summed over its subfolders."

### D1: Group 4 sets a per-file zero-survivor bar that goes beyond D2 and differs from group 5
**Severity:** major · **Status:** applied
**Location:** tasks.md > 4. Core, intro
**Current text:** "Each task is verified with a scoped `npm run mutation -- --mutate \"<file>\"` showing no surviving or no-coverage mutant except ones handled in 4.9."
**Failure scenario:** Combined with 4.9, every core mutant must be killed or refactored away, a de facto 100% per-file target. D2 settles on 80% per module, and group 5 uses "at least 80% each". Implementers will write contrived tests or make product refactors for non-equivalent mutants, beyond D8's "small testability refactors".
**Fix:** "Each task is verified with a scoped mutation run (command as in 4.10). Every remaining Survived or NoCoverage mutant is either equivalent and handled in 4.9, or noted under the task as not worth a test. 4.10 decides whether more tests are needed."

### D2: `--mutate` replaces the config list, so the scoped commands miss the new exclusions
**Severity:** major · **Status:** applied
**Location:** tasks.md > 1.3, 4.10, 5.6 (and the AGENTS.md `--mutate` example)
**Current text:** "Verify with a scoped run (`npm run mutation -- --mutate \"src/core/ui/**/*.tsx,src/app/**/*.tsx,!src/**/*.test.tsx,!src/**/testing/**\"`) that none of those files is in the report." / "Run `npm run mutation -- --mutate` for all of `src/core/` with the excludes"
**Failure scenario:** AGENTS.md states `--mutate` replaces the configured list. The 1.3 command lists none of the new negations, so `App.tsx`, `Logo.tsx` etc. will appear and the check can't pass, or proves nothing about the config. In 4.10 and 5.6, "with the excludes" copied from the AGENTS.md example mutates the preview-only and skeleton files and skews the core and boards scores.
**Fix:** 1.3: "Verify in the full `--force` run of 3.1 that none of those files is in the report." 4.10 and 5.6: spell out the full command including every negation from 1.3 (e.g. for boards: `--mutate "src/features/boards/**/*.ts,src/features/boards/**/*.tsx,!src/**/*.test.ts,!src/**/*.test.tsx,!src/**/testing/**,!src/features/boards/components/BoardListSkeletons.tsx,!src/features/boards/boardView/components/BoardSkeleton.tsx"`). 2.3: add to the AGENTS.md notes that a scoped `--mutate` must also repeat the visual-component and preview-only negations.

## Trust boundaries

- Local Stryker plugin (`scripts/stryker/classNameIgnorer.mjs`): runs with the same trust as `stryker.config.mjs`, repo-controlled. No new exposure.
- Tests with MSW for HTTP: in-process fakes, no network. Nothing to stop.
- Worktree copy of `stryker-incremental.json`: unchanged by this change.
- No user input, auth, storage or production code paths gain new behavior (refactors are behavior-preserving per D7/D8). No security findings.

## Coverage

Checked: both spec deltas (2 modified requirements, 1 added requirement, 11 scenarios), proposal, design, tasks, decisions; main specs `web-mutation-testing` and `web-test-coverage`; `stryker.config.mjs`, `vitest.config.ts`, `tsconfig.node.json`, AGENTS.md mutation notes. Confirmed every file named in tasks exists. No artifacts missing. Not read: the test files and product components themselves, Stryker's ignorer source (descendant handling taken from its docs), `cardigan-shared-specs` (decisions.md states no shared spec covers test tooling).

## Applied changes

All seven findings applied as recommended.

- `specs/web-mutation-testing/spec.md`: T1 (requirement and scenario reworded to `Ignored`, not counted), T2 (new scenario "Strings outside class names"), T3 (visual components named in the requirement), T4 (new scenario "Design components used by a feature").
- `design.md`: A1 (total score column, never `covered`), D1 (survivors get a test where a meaningful one exists, else equivalent or left as survived), D2 (scoped `--mutate` commands repeat every exclusion).
- `tasks.md`: A1 (3.1, 7.2 name the total column), D1 (group 4 intro), D2 (1.3 checked in the 3.1 full run, full `--mutate` commands in 4.10 and 5.6, AGENTS.md note added to 2.3).
- `proposal.md`: carried over T1 wording.
- No non-standard artifacts in the change folder. No contradictions with decisions.md. No accepted risks.
- `openspec validate web-test-suite-improvements --strict`: valid.
