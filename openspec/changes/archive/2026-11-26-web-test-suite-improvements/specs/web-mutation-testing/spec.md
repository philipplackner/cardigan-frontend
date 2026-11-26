# Spec Delta

## MODIFIED Requirements

### Requirement: Product source files are mutated
The command SHALL mutate the product source files that the coverage report measures, minus the purely visual components listed in the scenario below (`BlankPage`, `Logo`, `Brand`, `Spinner`, `BoardListSkeletons`, `BoardSkeleton`) and the app root component `src/app/App.tsx`. It SHALL NOT mutate test files, test helpers, generated code, the preview playground, the app entry file, the icon components or design-system components that only the preview playground uses.

#### Scenario: Excluded files
- **WHEN** a full mutation run finishes
- **THEN** the report contains no file that matches `*.test.ts(x)`, `src/testSetup.ts`, `*.d.ts`, `src/app/routeTree.gen.ts`, `src/core/api/generated/**`, `src/preview/**`, `**/testing/**`, `src/main.tsx` or `src/core/ui/icons/**`

#### Scenario: Components are included
- **WHEN** a full mutation run finishes
- **THEN** the report contains files under `src/features/*/components/` and `src/core/ui/`

#### Scenario: Preview-only design components
- **WHEN** a full mutation run finishes and no feature uses `BottomSheet`, `Checkbox`, `DropIndicator`, `FilterButton`, `LabelChip`, `LabelRow`, `Option`, `Panel`, `Popover` or `Swatch` from `src/core/ui/`
- **THEN** the report contains none of those component files

#### Scenario: Design components used by a feature
- **WHEN** a full mutation run finishes
- **THEN** every `src/core/ui/` component a feature renders appears in the report, except `Logo`, `Brand` and `Spinner`

#### Scenario: Purely visual components and app root
- **WHEN** a full mutation run finishes
- **THEN** the report contains neither `src/app/App.tsx`, `src/app/BlankPage.tsx`, `src/core/ui/Logo.tsx`, `src/core/ui/Brand.tsx` and `src/core/ui/Spinner.tsx`, nor the board list and board view skeleton components

#### Scenario: Visual components stay in coverage
- **WHEN** coverage runs for the whole codebase
- **THEN** `src/app/App.tsx`, the skeleton components, `Logo`, `Brand`, `Spinner` and `BlankPage` appear in the coverage report

## ADDED Requirements

### Requirement: Class-name mutants are not tested
Mutation testing SHALL report mutants that only change Tailwind class names (mutants inside a `className` value or inside the arguments of `cn()` or `cva()`) with status `Ignored`, and SHALL NOT count them in the mutation score. Mutants elsewhere in the same file SHALL still be tested.

#### Scenario: Class string in a component
- **WHEN** a component sets `className={cn('flex gap-8', isActive && 'bg-accent')}`
- **THEN** every mutant inside that expression has status `Ignored` in the report, and none is Killed, Survived or NoCoverage

#### Scenario: Logic next to a class name
- **WHEN** the same component calls `onSelect(id)` in a click handler
- **THEN** the report still contains mutants for that handler

#### Scenario: Strings outside class names
- **WHEN** the same component passes `aria-label={t('board.close')}` or a query key string
- **THEN** the report contains string-literal mutants for those strings, with a status other than `Ignored`

#### Scenario: Score without class-name mutants
- **WHEN** a full mutation run finishes
- **THEN** the mutation score is computed without any class-name mutant
