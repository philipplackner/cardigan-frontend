# Spec Delta

## MODIFIED Requirements

### Requirement: Generated code, playgrounds and test helpers are not measured
The coverage report SHALL leave out test files, the test setup file, type declaration files, the generated route tree, generated API code, the preview playground, `testing/` helper folders, the app entry file, the icon components, and design-system components that only the preview playground uses.

#### Scenario: Generated API code
- **WHEN** coverage runs for the whole codebase
- **THEN** no file under `src/core/api/generated/` and not `src/app/routeTree.gen.ts` appear in the report

#### Scenario: Test helpers and playground
- **WHEN** coverage runs for the whole codebase
- **THEN** no `*.test.ts(x)` file, no file under a `testing/` folder and no file under `src/preview/` appear in the report

#### Scenario: Entry, setup and declaration files
- **WHEN** coverage runs for the whole codebase
- **THEN** `src/main.tsx`, `src/testSetup.ts` and no `*.d.ts` file appear in the report

#### Scenario: Icons
- **WHEN** coverage runs for the whole codebase
- **THEN** no file under `src/core/ui/icons/` appears in the report

#### Scenario: Preview-only design components
- **WHEN** coverage runs for the whole codebase and no feature uses `BottomSheet`, `Checkbox`, `DropIndicator`, `FilterButton`, `LabelChip`, `LabelRow`, `Option`, `Panel`, `Popover` or `Swatch` from `src/core/ui/`
- **THEN** none of those component files appear in the report

#### Scenario: Design components used by a feature
- **WHEN** coverage runs for the whole codebase
- **THEN** every `src/core/ui/` component a feature renders appears in the report
