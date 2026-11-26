# Test-first workflow: project facts

The tdd-* agents and the `openspec-apply-tdd` skill read this file for
everything that depends on this codebase. Written by `install-openspec-tdd`;
keep it current when the build or the test setup changes. Where test code
lives is configured in `tdd.conf` next to this file, which the hook and the
scripts use.

## Schemas

- Test-first schema: `careful-planning-tdd`
- Plain schema (changes with nothing a test could observe): `careful-planning`
- The `Workflow` line of a change (test-first or plain, and which parts) is in: `decisions.md` of the change

## Project rules

Read these for code style, architecture, commit rules and test conventions:

- `AGENTS.md` (the project's system prompt; `CLAUDE.md` only imports it). Its Testing, Git Workflow and Decision Rules sections apply in full. When it and a skill disagree, `AGENTS.md` wins.
- `.claude/skills/react-unit-testing/SKILL.md` for unit tests.
- `.claude/skills/react-integration-testing/SKILL.md` for screen, feature and route tests.
- `.claude/skills/react-presentation-mvi/SKILL.md` and `.claude/skills/react-project-structure/SKILL.md` for the Root/Screen split, view-model hooks and import boundaries.

## Test code

- Where tests live: next to the file under test as `<name>.test.ts` (no DOM) or `<name>.test.tsx` (jsdom). Test doubles, in-memory data access, sample data and render helpers live in `testing/` folders (`src/app/testing/`, `src/features/boards/testing/`, `src/features/boards/boardView/testing/`). Shared setup is `src/testSetup.ts`. Tests for build scripts are `scripts/**/*.test.ts`. `e2e/` is reserved for Playwright, not set up yet. Three test helpers sit outside those folders: `src/features/auth/components/testUtils.tsx`, `src/features/auth/utils/testT.ts`, `src/core/auth/fakeSession.ts`.
- Frameworks and conventions: Vitest 5 with two projects in `vitest.config.ts`: `node` (`*.test.ts`) and `dom` (`*.test.tsx`, jsdom, `src/testSetup.ts`). React Testing Library and user-event; query by accessible role and label. Every test runs in time zone `Europe/Berlin`; use fake time for anything clock-based. Fakes over mocks: no `vi.mock` of project modules. Data access is faked with the in-memory implementations in `testing/` (MSW is not installed yet). Write unit tests the adversarial way: list break vectors first, then one test per distinct angle.
- Test levels, cheapest first: unit (pure logic: reducers, mappers, schemas, utils; `*.test.ts`, no DOM) → screen (a Screen and its children rendered with props only) → feature (Root, view-model hook, queries and in-memory data access, via the feature's `testing/` providers) → route (the whole router at a URL via `renderAppAt` in `src/app/testing/renderAppAt.tsx`).

## Commands

| Purpose | Command |
|---|---|
| Full check. Must pass before every commit | `npm run typecheck && npm run lint && npm run format:check && npm test && npm run build` |
| Compile or type-check the tests without running them | `npm run typecheck` (`tsc -b` covers app, node and test configs) |
| Run all tests | `npm test` |
| Run the tests of one area (`<area>` as defined below) | `npx vitest run <area>` |

Run tests so they never write new expected-value files (snapshot or golden
files) on their own: the project has no snapshot, golden or screenshot tests. `vitest run` (used by every command above) never runs in watch mode. If a test ever adds `toMatchSnapshot`, run with `--ci` so a missing snapshot fails instead of being written.

## Areas

An area is a folder path passed to Vitest as a filter: one feature (`src/features/<feature>`), one `core` module (`src/core/<module>`, for example `src/core/ui`), `src/app`, or `scripts`. Map a changed file to its area by those path prefixes. Narrower subfolders (`src/features/boards/boardView`) work too. Coverage takes the same paths: `npm run coverage -- <area>`.

## Scaffold

- A scaffold body is: `throw new Error('not implemented')` in functions, hooks, components and methods. Types, interfaces, Zod schemas and constants are written in full, since they have no body.
- Calling it fails with: `Error: not implemented`.
- In-memory fakes in `testing/` implement the data-access interfaces (`BoardsDataAccess`, `BoardViewDataAccess`) and are type-checked by `tsconfig.app.json`. When a scaffold adds or changes a method on such an interface, `npm run typecheck` fails in the fake until the test-writer updates it in its `[red]` task. That failure is expected after the scaffold; it must be gone after the red phase.

## Acceptance tests

- Level: route. The test renders the whole app router at a URL with `renderAppAt(path)` from `src/app/testing/renderAppAt.tsx` and drives it as a user would.
- How they are written: `*.test.tsx` files in `src/app/` (see `src/app/routes.test.tsx`), Testing Library queries by role, accessible name and label, `userEvent` for input, `findBy*`/`waitFor` for async results. Data comes from the in-memory data access the router wires in. The design must name every role and accessible name an acceptance test looks for; if it doesn't, that is an open question for the design, not something the test-writer picks.
- They use only the public interface of that level, never types or
  functions the change adds.

## Mutation testing

- Tool: StrykerJS 10 with the Vitest runner, configured in `stryker.config.mjs`. Run it through the npm script.
- Command for one area: `npm run mutation -- --mutate "<area>/**/*.ts,<area>/**/*.tsx,!src/**/*.test.ts,!src/**/*.test.tsx,!src/**/testing/**" --reporters clear-text,json`. `--mutate` replaces the configured list, so also repeat any exclude from `stryker.config.mjs` that lies inside the area (the visual and preview-only components). Stryker splits `--mutate` on commas, so don't use `{ts,tsx}` braces.
- Report: `reports/mutation/mutation.json` (mutation-testing-elements JSON, schema 1.0). `files` is keyed by repo-relative path; each file has `mutants` with `status`, `mutatorName`, `replacement` and `location.start.line`/`column`. Runs are incremental (state in `reports/mutation/stryker-incremental.json`), so the report also lists every other file from earlier runs. Read only the entries for the area's files.
- Survived: status `Survived` or `NoCoverage`. `Ignored` mutants (Tailwind class names) don't count.
- A run on a small folder takes under a minute; a feature takes several minutes. Run areas one after another, never in parallel (they share the state file and `.stryker-tmp`). Never pass `--force` and never delete the state file.

## Commits

- Conventional Commits with a scope where it fits: `feat(boards): ...`, `fix(auth): ...`, `test(cards): ...`, `refactor: ...`, `build: ...`, `docs: ...`, `chore(deps): ...`. Imperative mood, lowercase, no trailing period.
- One logical change per commit. Auth changes (`core/auth`, the HTTP client's auth handling) go in their own commits. Regenerated API code goes in its own commit with the spec change that caused it.
- Commit only when the full check above passes. Commit locally only, never push, never amend, never `--no-verify`.
