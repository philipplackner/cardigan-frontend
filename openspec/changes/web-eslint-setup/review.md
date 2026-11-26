# Artifact review (light): web-eslint-setup

**Verdict:** Ready
**Reviewed:** 2026-11-26, schema `careful-planning`, repo kind `code`

| Pass | Blocker | Major | Minor |
|---|---|---|---|
| Testability | 0 | 2 | 2 |
| Security | 0 | 0 | 0 |
| Hidden assumptions | 0 | 1 | 0 |
| Design contract | 0 | 1 | 2 |

## Findings

### T1: Boundary test doesn't require error severity
**Severity:** major · **Status:** applied
**Location:** specs/web-static-analysis/spec.md > Requirement: Boundary rules are guarded by a test; design.md > Boundary test against ESLint
**Current text:** "It SHALL fail when a forbidden fixture is no longer reported with the expected rule, or when an allowed fixture is reported by one of those rules." / design: "Fixtures, `FORBIDDEN`/`ALLOWED` lists and assertions stay the same."
**Failure scenario:** Today's test asserts `severity: 'error'`. ESLint reports `severity: 2` and `ruleId` instead of `code`, so the old assertion can't stay as is. If the implementer drops the severity check to make it pass, a boundary rule downgraded to `warn` passes the test while `npm run lint` (no `--max-warnings`, D5) no longer blocks the violation.
**Fix:** Spec: "It SHALL fail when a forbidden fixture is no longer reported with the expected rule at error severity, or when an allowed fixture is reported by one of those rules at any severity." Add scenario:
```
#### Scenario: A boundary rule is downgraded to a warning
- **WHEN** the config reports a feature importing another feature as a warning instead of an error and `npm test` runs
- **THEN** the boundary test fails
```
Design: replace the last sentence with "Fixtures and `FORBIDDEN`/`ALLOWED` lists stay the same. Forbidden assertions match ESLint messages on `{ ruleId: rule, severity: 2 }`; allowed assertions check `ruleId` only."
Catches: a test that matches only `ruleId`.

### T2: "Constant" in the fast-refresh rule is ambiguous
**Severity:** major · **Status:** applied
**Location:** specs/web-static-analysis/spec.md > Requirement: Fast refresh exports
**Current text:** "The lint commands SHALL report a warning, not an error, when a `.tsx` file exports something other than React components, unless the extra export is a constant."
**Failure scenario:** `allowConstantExport` only allows `const` exports initialized with a primitive literal. A test writer using `export const OPTIONS = { size: 20 }` or `export const format = () => ''` as "a constant" expects no warning and gets one. The text also implies a `.tsx` file exporting only helpers is warned, which the plugin doesn't do.
**Fix:** "The lint commands SHALL report a warning, not an error, when a `.tsx` file that exports at least one React component also exports something else, unless that extra export is a `const` initialized with a string, number, boolean or template literal." Change the constant scenario's WHEN to "a `.tsx` file exports a component and `export const PAGE_SIZE = 20`", and add:
```
#### Scenario: Component file exports an object constant
- **WHEN** a `.tsx` file exports a component and `export const OPTIONS = { size: 20 }`
- **THEN** `npm run lint` reports a warning and still exits with success
```
Catches: `allowConstantExport` left off (number constant warned), or a test expecting object constants to pass.

### T3: Underscore exception has no scenario for parameters and caught errors
**Severity:** minor · **Status:** applied
**Location:** specs/web-static-analysis/spec.md > Requirement: Recommended rule baseline > Scenario: Underscore-prefixed name
**Current text:** "**WHEN** a source file declares a variable `_` or `_unused` that is never used"
**Failure scenario:** Setting only `varsIgnorePattern` passes this scenario but reports `(_event) => {}` and `catch (_error)`, which the requirement allows.
**Fix:** "**WHEN** a source file declares a variable `_unused`, a function parameter `_event` or a caught error `_error` that is never used"
Catches: missing `argsIgnorePattern` or `caughtErrorsIgnorePattern`.

### T4: Core climbing into app by relative path has no scenario or fixture
**Severity:** minor · **Status:** applied
**Location:** specs/web-static-analysis/spec.md > Requirement: Core import boundary > Scenario: Core imports the app; tasks.md > 3.1
**Current text:** "**WHEN** a file under `src/core/` imports `@/app/App`"
**Failure scenario:** The requirement covers relative paths into app, but no scenario or fixture does. A regex ported as `^(\.\./)+features(/|$)` passes every test.
**Fix:** Scenario: "**WHEN** a file under `src/core/` imports `@/app/App` or `../../app/App`". Task 3.1, append: "Add a forbidden fixture `src/core/utils/coreClimbsIntoApp.ts` with `export { App } from '../../app/App'`."
Catches: a regex that drops `app`.

### A1: ESLint lints dot-folders and ignores `.gitignore`, so worktrees under `.claude/worktrees/` get linted
**Severity:** major · **Status:** applied
**Location:** specs/web-static-analysis/spec.md > Requirement: Analyzed files; design.md > Config shape, item 1
**Current text:** "ESLint already skips `node_modules`." / "They SHALL NOT analyze generated API code (`src/core/api/generated/**`), …"
**Failure scenario:** The repo has an empty, not-ignored `.claude/worktrees/` (where Claude Code places worktrees). ESLint flat config ignores only `node_modules` and `.git` by default, doesn't read `.gitignore`, and the planned ignore patterns are root-anchored. With a worktree present, `npm run lint` in the main checkout lints the worktree's `src/core/api/generated/`, `coverage/` HTML scripts and `.stryker-tmp/` sandboxes. ESLint 10 also looks up the nearest `eslint.config.mjs` per file, so a worktree without `node_modules` can make the whole run fail to load its config. The gate then fails for reasons unrelated to the code being committed.
**Fix:** Add `.claude/**` to the ignored paths (`.prettierignore` already ignores `.claude`). Spec, Analyzed files: append "…, Stryker's temp folder (`.stryker-tmp/**`), the `.claude/` folder (agent config and worktrees) or `node_modules`." and add:
```
#### Scenario: Worktrees under .claude are skipped
- **WHEN** a file under `.claude/worktrees/` breaks a rule
- **THEN** `npm run lint` does not report it
```
Design item 1: "`globalIgnores([...])`: the same paths as `.oxlintrc.json` (D12) plus `.claude/**`. ESLint skips only `node_modules` and `.git` by default and does not read `.gitignore`."
**Note:** This adds a path to the list D12 calls "the same paths as oxlint". decisions.md is not edited here; confirm the D12 change yourself if you accept this.

### D1: The BOM escape was saved as an invisible literal BOM
**Severity:** major · **Status:** applied
**Location:** tasks.md > 2.4; proposal.md > What Changes (also decisions.md > D7, not edited here)
**Current text:** "write the literal BOM in the regex as `<U+FEFF character>` (D7)" — the backticks contain the raw U+FEFF byte sequence, not the text `﻿`.
**Failure scenario:** The instruction reads as "replace the BOM with the BOM". An implementer either changes nothing (lint fails on `no-irregular-whitespace`) or falls back to an `eslint-disable` comment, which D7 rejected.
**Fix:** tasks.md 2.4: "In `src/preview/TransferPlayground.tsx:66`, replace the literal U+FEFF character in the regex with the escape sequence `﻿` (D7)." proposal.md: "…and the BOM in the preview playground regex is written as the escape `﻿` instead of the literal character." D7 has the same invisible character; fix it there yourself.

### D2: Task 2.2 expects 5 errors, but the ported rules add more before task 2.3
**Severity:** minor · **Status:** applied
**Location:** tasks.md > 2.2
**Current text:** "Verify `npm run lint` runs ESLint and lists only the 5 known errors from decisions.md (Facts)."
**Failure scenario:** The dry run used the presets only. `@typescript-eslint/consistent-type-definitions` isn't in them, and the two augmented `interface`s in `src/app/i18next.d.ts` and `src/app/router.ts` still carry `oxlint-disable` comments until 2.3. The implementer sees up to 7 errors and may change the config to match the stated count.
**Fix:** "Verify `npm run lint` runs ESLint and lists the 5 known errors from decisions.md (Facts), plus `@typescript-eslint/consistent-type-definitions` at `src/app/i18next.d.ts` and `src/app/router.ts` (their disable comments are rewritten in 2.3), and nothing else."

### D3: Proposal omits the project skills that design and tasks change
**Severity:** minor · **Status:** applied
**Location:** proposal.md > What Changes; Impact > Files
**Current text:** "Update AGENTS.md and README from oxlint to ESLint." / Files list ends with "`AGENTS.md`, `README.md`."
**Failure scenario:** Design and task 5.3 edit three `.claude/skills/*/SKILL.md` files. A reviewer of the proposal doesn't expect them, and a later scope check flags them as out of scope.
**Fix:** "Update AGENTS.md, README and the project skills `react-project-structure`, `react-data-layer` and `react-routing` from oxlint to ESLint." Append to Files: "`.claude/skills/react-project-structure/SKILL.md`, `.claude/skills/react-data-layer/SKILL.md`, `.claude/skills/react-routing/SKILL.md`."

## Trust boundaries
- npm dependencies (supply chain): 7 new dev packages at approved versions, lockfile committed. The spec doesn't need to say more for dev tooling. No finding.
- `eslint.config.mjs` runs as code at lint time: repo-controlled, same trust as `vite.config.ts`. No finding.
- `npm run lint:fix` writes source files: developer-invoked, limited to rule autofixes. No finding.
- Boundary test `lintText` with virtual paths: in memory, no files written. Removes today's temp-dir writes. No finding.

## Coverage
- All 11 requirements and 29 scenarios in specs/web-static-analysis/spec.md checked. All five schema artifacts present.
- Read: decisions.md, proposal.md, design.md, tasks.md, the delta spec, openspec/config.yaml, AGENTS.md (tech stack and architecture parts), .oxlintrc.json, src/app/lintBoundaries.test.ts, package.json, .gitignore, .prettierignore, the oxlint disable-comment sites.
- Not read: the three `.claude/skills` files in full, README.md beyond the oxlint grep, vitest.config.ts. No shared-store specs (the proposal states none apply; confirmed no main spec covers lint).
- The review was requested as `web-static-analysis`; that is the spec inside change `web-eslint-setup`, which was reviewed.
- Not verified by running ESLint: whether `consistent-type-definitions` reports interfaces inside `declare module` (D2 is worded to hold either way).

## Applied changes
All 8 findings applied as recommended. `openspec validate web-eslint-setup --strict` passes.

- `specs/web-static-analysis/spec.md`: T1 (error severity + downgrade scenario), T2 (fast-refresh wording + object-constant scenario), T3 (underscore scenario), T4 (relative core-to-app scenario), A1 (`.claude/` ignored + worktree scenario).
- `design.md`: T1 (assertions on `ruleId` + `severity: 2`), A1 (`globalIgnores` adds `.claude/**`).
- `tasks.md`: D1 (2.4 uses `﻿`), D2 (2.2 expected errors), T1 + T4 (3.1 assertions and new fixture), A1 (2.5 checks `.claude/worktrees/` is skipped).
- `proposal.md`: D1 (`﻿`), D3 (skills in What Changes and Files), A1 (ignore `.claude/`).

**Contradictions with decisions.md (not edited):**
- A1 adds `.claude/**` to the ignored paths. D12 says ESLint ignores "the same paths as oxlint today". Update D12 to include `.claude/**`.
- D7 still contains the literal U+FEFF character where `﻿` was meant. Fix the text in D7.

No non-standard artifacts in the change folder. No accepted risks.
