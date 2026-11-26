# Spec Delta

## Purpose

Defines the terminal commands that statically analyze the web client's source code and the rules they enforce, including the import boundaries between `app`, `core` and features.

## ADDED Requirements

### Requirement: Lint command
`npm run lint` SHALL statically analyze the web client's source files and print every finding with file, line and rule. It SHALL exit non-zero when at least one finding is an error, and exit with success when there are only warnings or no findings. It SHALL NOT change any file.

#### Scenario: Clean code
- **WHEN** a developer runs `npm run lint` on code with no findings
- **THEN** the command exits with success

#### Scenario: An error is found
- **WHEN** a source file breaks a rule configured as an error
- **THEN** the command prints the file, line and rule and exits non-zero

#### Scenario: Only warnings are found
- **WHEN** the only findings are warnings
- **THEN** the command prints them and exits with success

#### Scenario: Current code base
- **WHEN** `npm run lint` runs on the code base right after this change
- **THEN** it reports no errors

### Requirement: Lint fix command
`npm run lint:fix` SHALL run the same analysis as `npm run lint`, apply the automatic fixes the rules offer to the files, and report the findings that remain with the same exit code rules as `npm run lint`.

#### Scenario: Fixable finding
- **WHEN** a file has a finding whose rule offers an automatic fix and a developer runs `npm run lint:fix`
- **THEN** the file is rewritten without that finding and the finding is not reported

#### Scenario: Unfixable finding
- **WHEN** a file has an error without an automatic fix
- **THEN** `npm run lint:fix` leaves it, reports it and exits non-zero

### Requirement: Analyzed files
The lint commands SHALL analyze the repo's TypeScript and JavaScript files (`.ts`, `.tsx`, `.js`, `.mjs`), including tests and config files. They SHALL NOT analyze generated API code (`src/core/api/generated/**`), the generated route tree (`src/app/routeTree.gen.ts`), build output (`dist/**`), coverage and mutation reports (`coverage/**`, `reports/**`), Stryker's temp folder (`.stryker-tmp/**`), the `.claude/` folder (agent config and worktrees) or `node_modules`.

#### Scenario: Generated code is skipped
- **WHEN** a file under `src/core/api/generated/` or `src/app/routeTree.gen.ts` breaks a rule
- **THEN** `npm run lint` does not report it

#### Scenario: Worktrees under .claude are skipped
- **WHEN** a file under `.claude/worktrees/` breaks a rule
- **THEN** `npm run lint` does not report it

#### Scenario: Test and config files are checked
- **WHEN** a `*.test.tsx` file or a `*.config.ts` file breaks a rule
- **THEN** `npm run lint` reports it

### Requirement: Recommended rule baseline
The lint commands SHALL enforce the standard recommended JavaScript rules, the recommended TypeScript rules that need no type information, and the recommended React hooks rules. Unused variables, parameters and caught errors whose name starts with `_` SHALL NOT be reported.

#### Scenario: Unused variable
- **WHEN** a source file declares a local variable `value` that is never used
- **THEN** `npm run lint` reports an error

#### Scenario: Underscore-prefixed name
- **WHEN** a source file declares a variable `_unused`, a function parameter `_event` or a caught error `_error` that is never used
- **THEN** `npm run lint` does not report it

#### Scenario: Hook called conditionally
- **WHEN** a component calls a React hook inside an `if` block
- **THEN** `npm run lint` reports an error

### Requirement: Core import boundary
The lint commands SHALL report an error when a file under `src/core/` imports from `src/app/` or `src/features/`, through the `@/app` or `@/features` alias or through a relative path. The message SHALL say that core must not import from app or features.

#### Scenario: Core imports a feature
- **WHEN** `src/core/auth/x.ts` imports `@/features/auth/index` or `../../features/auth/a`
- **THEN** `npm run lint` reports an error saying core must not import from app or features

#### Scenario: Core imports the app
- **WHEN** a file under `src/core/` imports `@/app/App` or `../../app/App`
- **THEN** `npm run lint` reports an error

#### Scenario: Core imports core
- **WHEN** a file under `src/core/` imports `@/core/utils/a`
- **THEN** `npm run lint` does not report it

### Requirement: Feature import boundary
The lint commands SHALL report an error when a file under `src/features/` imports from `src/app/` (through the alias or a relative path) or from another feature through the `@/features` alias. Relative imports inside one feature and imports from `@/core` SHALL stay allowed.

#### Scenario: Feature imports another feature
- **WHEN** a file under `src/features/boards/` imports `@/features/cards/a`
- **THEN** `npm run lint` reports an error saying features must not import from app or other features

#### Scenario: Feature imports the app
- **WHEN** a file under `src/features/` imports from `@/app` or climbs into `src/app/` with a relative path
- **THEN** `npm run lint` reports an error

#### Scenario: Import inside a feature or from core
- **WHEN** a file under `src/features/boards/` imports `../api/boardQueries` from the same feature or `@/core/ui/Button`
- **THEN** `npm run lint` does not report it

### Requirement: No direct Radix imports in features
The lint commands SHALL report an error when a file under `src/features/` imports `radix-ui`, `radix-ui/*` or `@radix-ui/*`. The message SHALL say to use the components from `@/core/ui`.

#### Scenario: Feature imports Radix directly
- **WHEN** a file under `src/features/` imports `radix-ui`, `radix-ui/internal` or `@radix-ui/react-dialog`
- **THEN** `npm run lint` reports an error saying to use the components from `@/core/ui`

### Requirement: Boundary rules are guarded by a test
`npm test` SHALL include a test that lints a fixture for every boundary and convention case in this spec that must be reported, and a fixture for every case that must stay allowed. It SHALL fail when a forbidden fixture is no longer reported with the expected rule at error severity, or when an allowed fixture is reported by one of those rules at any severity.

#### Scenario: A boundary rule stops working
- **WHEN** the config no longer reports a feature importing another feature and `npm test` runs
- **THEN** the boundary test fails

#### Scenario: A boundary rule is downgraded to a warning
- **WHEN** the config reports a feature importing another feature as a warning instead of an error and `npm test` runs
- **THEN** the boundary test fails

#### Scenario: A convention rule stops working
- **WHEN** the config no longer reports a default export under `src/` and `npm test` runs
- **THEN** the boundary test fails

#### Scenario: An allowed import gets reported
- **WHEN** the config starts reporting an import from `@/core` inside a feature and `npm test` runs
- **THEN** the boundary test fails

### Requirement: Code conventions
The lint commands SHALL report an error for:
- a default export, except in files named `*.config.ts` or `*.config.mjs`;
- an `interface` declaration (object types use a `type` alias);
- an explicit `any` type.

#### Scenario: Default export in source
- **WHEN** a file under `src/` contains `export default`
- **THEN** `npm run lint` reports an error

#### Scenario: Default export in a config file
- **WHEN** `vite.config.ts` contains `export default`
- **THEN** `npm run lint` does not report it

#### Scenario: Interface declaration
- **WHEN** a source file declares `interface Props { ... }`
- **THEN** `npm run lint` reports an error

#### Scenario: Explicit any
- **WHEN** a source file uses `any` as a type
- **THEN** `npm run lint` reports an error

### Requirement: Fast refresh exports
The lint commands SHALL report a warning, not an error, when a `.tsx` file that exports at least one React component also exports something else, unless that extra export is a `const` initialized with a string, number, boolean or template literal.

#### Scenario: Component file exports a function
- **WHEN** a `.tsx` file exports a component and a helper function
- **THEN** `npm run lint` reports a warning and still exits with success

#### Scenario: Component file exports a constant
- **WHEN** a `.tsx` file exports a component and `export const PAGE_SIZE = 20`
- **THEN** `npm run lint` does not report it

#### Scenario: Component file exports an object constant
- **WHEN** a `.tsx` file exports a component and `export const OPTIONS = { size: 20 }`
- **THEN** `npm run lint` reports a warning and still exits with success

### Requirement: Targeted rule suppression
A finding SHALL be suppressible for a single line with a disable comment that names the rule. Such a comment SHALL NOT turn the rule off for other lines.

#### Scenario: Suppressed line
- **WHEN** a line breaks a rule and the line before it has a disable-next-line comment naming that rule
- **THEN** `npm run lint` does not report that line

#### Scenario: Next line is not suppressed
- **WHEN** the line after the suppressed line breaks the same rule
- **THEN** `npm run lint` reports it
