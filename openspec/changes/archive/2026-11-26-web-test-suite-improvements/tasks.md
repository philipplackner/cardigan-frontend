# Tasks

Targets for this change only (decisions.md D1–D3, never written into a lasting file):
- **Coverage:** every measured file reaches at least 80% line coverage.
- **Mutation:** each of these units scores at least 80% on a full `npm run mutation -- --force` run: `src/app/`, `src/core/` (summed over its subfolders), `src/features/auth/`, `src/features/boards/`, `src/features/transfer/`.

## 1. Measured file sets

- [x] 1.1 Move `src/app/renderAppAt.tsx` to `src/app/testing/renderAppAt.tsx` and update the import in `src/app/routes.test.tsx`. Verify `npm test` passes and the file no longer appears in `coverage/cobertura-coverage.xml` after `npm run coverage`.
- [x] 1.2 In `vitest.config.ts` `coverage.exclude`, add `src/core/ui/icons/**` and the 10 preview-only component files by name (`BottomSheet`, `Checkbox`, `DropIndicator`, `FilterButton`, `LabelChip`, `LabelRow`, `Option`, `Panel`, `Popover`, `Swatch`). Verify with `npm run coverage` that none of them is in the report and `App.tsx`, the skeletons, `Logo`, `Brand`, `Spinner` and `BlankPage` still are.
- [x] 1.3 In `stryker.config.mjs` `mutate`, add negated entries for:
  - the same 10 files
  - `src/app/App.tsx`, `src/app/BlankPage.tsx`
  - `src/core/ui/Logo.tsx`, `src/core/ui/Brand.tsx`, `src/core/ui/Spinner.tsx`
  - `src/features/boards/components/BoardListSkeletons.tsx`
  - `src/features/boards/boardView/components/BoardSkeleton.tsx`

  Update the sync comment to say Stryker mutates the coverage list minus visual components and the app root. Verify in the full `--force` run of 3.1 that none of those files is in the report (a scoped `--mutate` run can't check this, because it replaces the configured list).

## 2. Class-name ignorer

- [x] 2.1 Write `scripts/stryker/classNameIgnorer.test.ts` (node project). Cover:
  - a `className` string, a `className` template and a `className={cn(...)}` with a conditional inside are ignored
  - `cva(...)` arguments are ignored
  - an `onClick` handler on the same element is not ignored
  - a function called `cnx` or `classNames` is not ignored

  Verify the tests fail before the plugin exists.
- [x] 2.2 Implement `scripts/stryker/classNameIgnorer.mjs` as a `PluginKind.Ignore` plugin named `class-names`, and register it in `stryker.config.mjs` (`plugins` keeps the default `@stryker-mutator/*` entry, plus `ignorers: ['class-names']`). Verify:
  - 2.1 passes
  - a scoped run on `src/core/ui/Avatar.tsx` shows its class-name mutants as `Ignored` in `reports/mutation/mutation.html`
- [x] 2.3 Update the mutation notes in AGENTS.md:
  - the mutated files are the covered files minus the listed visual components and `App.tsx`
  - class-name mutants are ignored by `scripts/stryker/classNameIgnorer.mjs`
  - one line: the change where a feature first uses an excluded preview-only component removes it from both lists and adds its tests
  - a scoped `--mutate` run must also repeat the visual-component and preview-only negations

  No percentages. Verify with `grep -n "80" AGENTS.md` that no target number was added.

## 3. Baseline

- [x] 3.1 Run `npm run mutation -- --force` and `npm run coverage`. Record in this file, under the task:
  - each unit's mutation score (the `% Mutation score / total` column, never `covered`), with core summed over `core/api`, `core/auth`, `core/i18n`, `core/ui`, `core/utils` as detected / (detected + undetected)
  - every file under 80% lines
  - that none of the files excluded in 1.3 is in the mutation report

  This is the measured gap list for groups 4–6. Expected from research: app ~92%, core ~58%, auth ~90%, boards ~80%, transfer ~85%; lines under 80% in `App.tsx`, `AppLayout.tsx`, `Button.tsx`.

  **Baseline, 2026-11-26** (full `--force` run, 4097 mutants, 21 min):
  - Mutation score per unit (total column formula, detected / (detected + undetected)):
    - `src/app/`: 91.67% (11 / 12)
    - `src/core/`: 71.11% (384 / 540; `core/ui` 76.6% of its share, `core/api` 6/6, `core/auth` 10/10, `core/utils` 76/78, `core/i18n` no mutants)
    - `src/features/auth/`: 89.77% (351 / 391)
    - `src/features/boards/`: 79.96% (1736 / 2171)
    - `src/features/transfer/`: 85.26% (486 / 570)
  - Files under 80% lines: `src/app/App.tsx` 0%, `src/core/ui/layout/AppLayout.tsx` 64.3%, `src/core/ui/Button.tsx` 71.4%. The `index.ts`, `types.ts` and `boardDialogResult.ts` files show 0% but have no executable lines.
  - The excluded files from 1.3 were not mutated, but they still appeared in the report: Stryker's incremental mode keeps results of files outside the `mutate` scope from the old state file, even with `--force`. The scores above leave those stale entries out. The final run in 7.2 starts without `reports/mutation/stryker-incremental.json`.

## 4. Core (`src/core/`)

Each task adds or extends the component's `*.test.tsx` with tests that assert user-observable behavior per `react-integration-testing`. Each task is verified with a scoped mutation run (with the excludes as in 4.10). Every remaining Survived or NoCoverage mutant is either equivalent and handled in 4.9, or noted under the task as not worth a test. 4.10 decides whether more tests are needed.

- [x] 4.1 `TextArea.tsx` (~40 undetected): auto-resize height from the scroll height, max rows, field context wiring, error state, IME composition.
- [x] 4.2 `layout/AppLayout.tsx` (~26 undetected, 64% lines): sidebar and app bar slots per layout, navigation items, phone vs desktop structure. Also verify the file reaches at least 80% lines in `npm run coverage -- src/core/ui`.
- [x] 4.3 `Card.tsx` (~26) and `BoardRow.tsx`, `BoardTile.tsx`, `Column.tsx`: labels shown or hidden, empty label list, drag handle and click callbacks, accessible names.
- [x] 4.4 `Toast.tsx` (~22): timeout dismissal with fake timers, close button with its label, stacking, error vs info type.
- [x] 4.5 `DropZone.tsx` (~22): drag enter and leave depth counting, drop with files, click-to-browse, disabled state, accepted types.
- [x] 4.6 `Menu.tsx` (~19) and `NavItem.tsx` (~13): keyboard navigation, item selection callback, divider and header roles, active item state, link vs button rendering.
- [x] 4.7 `Input.tsx` (~12), `Banner.tsx` (~12), `Label.tsx`, `LabelDot.tsx`, `EmptyState.tsx`, `Avatar.tsx`, `PasswordRule.tsx`, `ErrorMessage.tsx`, `FileRow.tsx`, `AddCardButton.tsx`, `AddColumnButton.tsx`, `Icon.tsx`, `Dialog.tsx`: the props each one renders or forwards (roles, aria attributes, field context ids, error/info variants, initials).
- [x] 4.8 `useReturnFocus.ts` (~15) and `Button.tsx` (71% lines): focus returns to the trigger only when it is still in the document, the prevented-default paths in Button. Verify `Button.tsx` reaches at least 80% lines.
- [x] 4.9 For every mutant left in groups 4.1–4.8 that no meaningful test can kill, refactor the product code so the mutant no longer exists (behavior unchanged), each in its own `refactor:` commit. Verify `npm test` passes before and after, and the scoped mutation run shows the mutant gone.
- [x] 4.10 Run `npm run mutation -- --mutate "src/core/**/*.ts,src/core/**/*.tsx,!src/**/*.test.ts,!src/**/*.test.tsx,!src/**/testing/**,!src/**/*.d.ts,!src/core/api/generated/**,!src/core/ui/icons/**,!src/core/ui/BottomSheet.tsx,!src/core/ui/Checkbox.tsx,!src/core/ui/DropIndicator.tsx,!src/core/ui/FilterButton.tsx,!src/core/ui/LabelChip.tsx,!src/core/ui/LabelRow.tsx,!src/core/ui/Option.tsx,!src/core/ui/Panel.tsx,!src/core/ui/Popover.tsx,!src/core/ui/Swatch.tsx,!src/core/ui/Logo.tsx,!src/core/ui/Brand.tsx,!src/core/ui/Spinner.tsx"`, and verify the summed core score is at least 80%. If not, continue with the next-largest undetected files from the report.

## 5. Boards (`src/features/boards/`)

- [x] 5.1 `boardView/hooks/useBoardViewModel.ts` (~132 undetected) and `boardView/hooks/boardViewReducer.ts` (~30): extend their tests for the surviving actions. Look at column and card ordering, quick add, rename/delete column, search and label filter, drag-and-drop moves and their rollback on error, and limits. Verify with a scoped mutation run that both files reach at least 80% each.
- [x] 5.2 `components/BoardListScreen.tsx` (~25), `api/boardsQueries.ts` (~19), `boardView/api/boardViewQueries.ts` (~12): cache keys, invalidation after mutations, error and empty states. Verify with a scoped mutation run.
- [x] 5.3 Dialog and form view models and components: `useRenameBoardDialogViewModel.ts` (~18), `InlineForm.tsx` (~18), `RenameColumnDialog.tsx` (~14), `BoardViewMenu.tsx` (~12), `AddColumnForm.tsx` (~9), `useFocusRequest.ts` (~14). Cover validation limits, unchanged-name handling, submit while pending, and cancel and focus return. Verify with a scoped mutation run.
- [x] 5.4 Small utils and hooks: `useRelativeTimeText.ts` (~14, also 83% lines), `sortLabels.ts`, `isComposing.ts`, `limits.ts`, `importHooks.ts`, `useLargeTitleCollapsed.ts`, `useOpenSession.ts`, `types.ts`. Write adversarial unit tests for boundaries, ties and empty input. Verify with a scoped mutation run.
- [x] 5.5 Handle remaining equivalent or dead-code mutants in boards as in 4.9, in their own `refactor:` commits. Verify `npm test` passes and the scoped run shows the mutants gone.
- [x] 5.6 Run `npm run mutation -- --mutate "src/features/boards/**/*.ts,src/features/boards/**/*.tsx,!src/**/*.test.ts,!src/**/*.test.tsx,!src/**/testing/**,!src/features/boards/components/BoardListSkeletons.tsx,!src/features/boards/boardView/components/BoardSkeleton.tsx"`, and verify its score is at least 80%, with margin left by 5.1–5.4.

## 6. App, auth and transfer

- [x] 6.1 Add `src/app/App.test.tsx`: render `App` and check that the router shows its first route and the toast provider is available. Verify `App.tsx` reaches at least 80% lines in `npm run coverage -- src/app`.
- [x] 6.2 Check the baseline from 3.1 for `src/app/`, `src/features/auth/` and `src/features/transfer/`. For any unit under 80%, or any file in them under 80% lines, add tests for its largest gaps:
  - transfer: `ImportScreen.tsx`, `useImportViewModel.ts`, `useLastPresent.ts`
  - auth: `LoginForm.tsx`, `passwordRules.ts`, `useRegisterViewModel.ts`

  Verify with a scoped mutation and coverage run.

## 7. Final verification

- [x] 7.1 Run `npm run coverage` and verify every file in `coverage/cobertura-coverage.xml` has at least 80% line coverage.
- [x] 7.2 Run `npm run mutation -- --force` and verify each of the five units scores at least 80% (total column), with core summed as in 3.1. Record the final numbers in this file under the task.

  **Final, 2026-11-26** (full `--force` run without a previous state file, 4056 mutants, 407 ignored class-name mutants, overall 92.05%):
  - `src/app/`: 91.67% (11 / 12)
  - `src/core/`: 95.16% (492 / 517)
  - `src/features/auth/`: 89.77% (351 / 391)
  - `src/features/boards/`: 93.52% (2005 / 2144)
  - `src/features/transfer/`: 85.26% (486 / 570)
  - None of the files excluded in 1.3 is in the report.
  - Coverage (7.1): 157 files, lines 99.46%, every file with executable lines at 80% or more (`App.tsx`, `AppLayout.tsx`, `Button.tsx` now 100%).
  - Not kept: a `useReturnFocus.ts` refactor that widened the map key to `null` only to drop a guard. Its mutant stays as survived.
  - Found while testing, not fixed here (behavior change): two confirms of Delete column in one tick send two deletes, because `submitDelete` checks `isPending` instead of a ref. A refresh whose fetching and done states land in one render leaves the refresh flag set. `NavItem`'s accessible name has no space between label and key ("RoadmapCRD").
- [x] 7.3 Run the commit gates (`npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, `npm run build`) and verify all pass.
- [x] 7.4 Verify no lasting file carries the targets: `stryker.config.mjs` still has `break: minScoreFromEnv()` and no new threshold, `vitest.config.ts` has no coverage thresholds, and AGENTS.md, skills and `openspec/specs/` contain no 80% target.

## Workflow follow-up

- Archive the change after review, which syncs the two spec deltas into the main specs.
