# Design

## Context

See proposal.md for the why and decisions.md for every settled choice and the measured numbers.

Current tooling:
- `vitest.config.ts` measures coverage with v8.
- `stryker.config.mjs` mutates the same files, minus the icons. It runs incrementally (`reports/mutation/stryker-incremental.json`) with `ignoreStatic: true` and no score threshold.
- AGENTS.md says the two file lists mirror each other.
- Project test rules (AGENTS.md, `react-unit-testing`, `react-integration-testing`):
  - Adversarial unit tests.
  - DOM tests with Testing Library and user-event.
  - MSW for HTTP.
  - No `vi.mock` of project modules.

## Goals / Non-Goals

**Goals:**
- Reach the two one-time targets from decisions.md D1–D3 with tests that check outcomes, not just execute code.
- Make the measured file sets match D4–D6.
- Keep the targets out of every lasting file (D10).

**Non-Goals:**
- No per-unit score script or report. The numbers are read from Stryker's existing output.
- No new test dependencies.
- No changes to the commit gates.

## Decisions

### Exclusions as explicit file lists
- **`vitest.config.ts` `coverage.exclude`** gains:
  - `src/core/ui/icons/**`
  - the 10 preview-only component files, by name
- **`stryker.config.mjs` `mutate`** gains negated entries for:
  - the same 10 files
  - `src/app/App.tsx`, `src/app/BlankPage.tsx`
  - `src/core/ui/Logo.tsx`, `src/core/ui/Brand.tsx`, `src/core/ui/Spinner.tsx`
  - `src/features/boards/components/BoardListSkeletons.tsx`
  - `src/features/boards/boardView/components/BoardSkeleton.tsx`
- **Why explicit names:** a folder or naming convention would also catch future components by accident, and D6 needs one place to remove each file from.
- **Comments:** the existing "Keep in sync" comment in `stryker.config.mjs` becomes: Stryker mutates the coverage list minus visual components and the app root.
- **Alternative considered:** moving the preview-only components into their own folder. Rejected because it moves public `core/ui` files only to suit the tools.

### Class-name ignorer as a local Stryker plugin
- **File:** `scripts/stryker/classNameIgnorer.mjs`. It declares an `Ignorer` plugin (`PluginKind.Ignore`) named `class-names`.
- **Config:** `stryker.config.mjs` lists it in `plugins` (next to the default `@stryker-mutator/*`) and in `ignorers: ['class-names']`.
- **What it ignores:** `shouldIgnore(path)` returns a reason for these, and for all their descendants (Stryker checks ancestors):
  - a JSX attribute named `className`
  - a call whose callee is `cn` or `cva`
- **Score:** Stryker counts ignored mutants as `Ignored`, so they don't affect the score. This is what D4 asks for.
- **Why `.mjs`:** it loads the same way `stryker.config.mjs` does. A `.ts` plugin would depend on Node type stripping inside Stryker's plugin loader.
- **Test:** a `scripts/stryker/classNameIgnorer.test.ts` in the `node` project builds small Babel paths and checks:
  - `className` strings are ignored
  - `cn(...)` and `cva(...)` arguments, including conditionals inside them, are ignored
  - a sibling `onClick` handler is not ignored
  - a function called `cnx` is not ignored
- **Alternatives considered:**
  - Excluding the `StringLiteral` mutator globally. Rejected because it also drops real string mutants (i18n keys, query keys, error codes).
  - `// Stryker disable` comments in every component. Rejected because of the comment rule and the number of places.

### Moving `renderAppAt.tsx`
It moves to `src/app/testing/renderAppAt.tsx`, and `src/app/routes.test.tsx` imports it from there. The existing `**/testing/**` exclusions then cover it in both tools without a config change.

### "Module" for the mutation target
The five units from D3 are measured from a full `npm run mutation -- --force` run. The score per unit is the `% Mutation score / total` column of the folder row in the clear-text table and in `reports/mutation/mutation.html`: detected / (detected + undetected), where undetected includes NoCoverage. Never use the `covered` column.

`src/core/` has no single folder row because its subfolders are separate rows. Its score is the sum over `core/api`, `core/auth`, `core/i18n`, `core/ui` and `core/utils`, with the same formula: detected / (detected + undetected). The tasks note that sum so it can be checked by hand. No script is added (Non-Goal).

### How tests get written
- **Survived and no-coverage mutants** get a test that fails on the mutant where a meaningful test exists. The rest are either equivalent (D7) or left as survived, as long as the unit reaches its target. Group tests per component or hook, and extend the existing `*.test.ts(x)` file where one exists.
- **`core/ui` components** get DOM tests that assert what the user can observe:
  - roles, names and states
  - focus movement
  - callbacks
  - auto-resize in TextArea
  - toast timing with fake timers
  - drag-and-drop events in DropZone
  - menu keyboard navigation
- **View models and reducers** (`useBoardViewModel`, `boardViewReducer`, `useRenameBoardDialogViewModel`) get unit tests for the actions and edge cases the survivors point to: boundaries, ordering, error paths.
- **Coverage:**
  - `App.tsx` gets a DOM test that renders it and finds the router's first screen.
  - `AppLayout` and `Button` get tests for their untested branches.
- **Equivalent mutants (D7):** when a mutant can't be killed, the product code is rewritten so the mutant disappears. Examples: drop a redundant default, merge a condition that can't differ. This is done in its own `refactor:` commit, with the existing tests green before and after. Dead code found the same way is removed (D8).

### Order of work
1. Tooling changes (exclusions, ignorer, move).
2. A fresh `--force` baseline, so the per-unit gaps are measured on the final file set.
3. Tests per unit, largest gap first (`core`, then `features/boards`).
4. A final `--force` run and a coverage run to verify.

During step 3, use incremental runs scoped with `--mutate` to iterate quickly. `--mutate` replaces the configured file list, so each scoped command repeats every exclusion from the config, including the visual and preview-only components.

## Risks / Trade-offs

- **Logic inside `cn()` is ignored.** For example `cn(isActive && 'bg-accent')`: a wrong `isActive` that only changes styling goes unnoticed. → Accepted by D4. Where a condition also drives behavior, that behavior is tested outside the class name.
- **The preview-only exclusion outlives its reason.** → D6 note in AGENTS.md, and the spec scenarios say the exclusion only holds while no feature uses the component.
- **The ignorer breaks after a Stryker upgrade.** The ignorer API is part of `@stryker-mutator/api`. → Its own test fails, and a `--force` run would show class-name mutants again.
- **Incremental results drift from a full run.** For example, timeouts are reused. → Both the baseline and the final check use `--force`.
- **Tests chase mutants instead of behavior.** → Each test asserts user-visible or contract behavior per the testing skills. A mutant that only a contrived test could kill is treated as equivalent (D7).
- **`features/boards` sits right at 80%.** Refactors in core could move it. → The tasks add boards tests for margin and recheck it in the final run.

## Migration Plan

None. The change is tooling and tests only. Rollback is a revert of the commits.
