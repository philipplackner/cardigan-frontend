# Proposal

## Why

The web client has coverage and mutation tooling, but nobody has acted on what it shows yet. Coverage looks good in total (96.7% lines), but the mutation score is 76.35%. Many tests run code without checking its result, mostly in `core/ui` (about 50%) and the board view model. This change uses both tools to find the weak spots and plan the tests that fix them. It also leaves out a few areas where the numbers carry no signal.

## What Changes

- Add tests until, for this change only:
  - every measured file reaches 80% line coverage, and
  - each of five units reaches an 80% mutation score on a full `npm run mutation -- --force` run: `src/app/`, `src/core/`, `src/features/auth/`, `src/features/boards/`, `src/features/transfer/`.
  These numbers are a one-time goal. They are not added to configs, AGENTS.md, skills or main specs.
- Main test work:
  - `core/ui` components (TextArea, AppLayout, Card, Toast, DropZone, Menu, NavItem, Input, Banner, Label, LabelDot, EmptyState, Avatar, BoardRow, useReturnFocus, Button).
  - The board view model and reducer, board list, board queries and dialogs, to get `features/boards` above 80% with margin.
  - A test for `App.tsx` to reach 80% line coverage.
- Leave out of mutation testing:
  - the 10 design-system components only the preview playground uses
  - purely visual components (skeletons, Logo, Brand, Spinner, BlankPage)
  - `App.tsx`
  - mutants inside Tailwind class names, through a small local Stryker ignorer plugin
- Leave out of coverage:
  - `src/core/ui/icons/`
  - the same 10 preview-only components
- Move the test helper `src/app/renderAppAt.tsx` into `src/app/testing/`, so both tools stop measuring it.
- AGENTS.md:
  - Note that the change where a feature first uses an excluded preview-only component removes it from both lists and adds its tests.
  - Describe the new difference between the mutated and the covered files.
- Refactor product code where a mutant can't be killed (equivalent mutant), and remove dead code the tools reveal. Behavior stays the same.
- Incremental mutation runs are already the default. Nothing changes there.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `web-test-coverage`: the excluded-files requirement also leaves out the icons and the preview-only design components.
- `web-mutation-testing`: the mutated-files requirement also leaves out the preview-only and purely visual components and `App.tsx`. A new requirement says mutants that only change Tailwind class names are reported as `Ignored` and not counted in the score.

## Shared specs

No requirement in `cardigan-shared-specs` is implemented or changed. The new tests check web behavior that already implements shared requirements, but they don't change it.

## Impact

- `vitest.config.ts` (`coverage.exclude`), `stryker.config.mjs` (`mutate`, ignorer plugin), and a new local Stryker plugin file with its own test.
- New and extended `*.test.ts(x)` files in `src/core/ui/`, `src/features/boards/` and `src/app/`.
- `src/app/renderAppAt.tsx` moves to `src/app/testing/renderAppAt.tsx`, and `routes.test.tsx` updates its import.
- Small behavior-preserving product code edits where mutants reveal dead or equivalent code.
- AGENTS.md mutation notes.
- No new runtime dependencies. No API, backend or mobile impact.
