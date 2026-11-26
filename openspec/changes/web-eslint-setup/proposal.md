# Proposal

## Why

The web client lints with oxlint today. Later changes want stricter static analysis (type-aware and React Compiler rules) that only the ESLint ecosystem offers. This change puts ESLint in place of oxlint with standard recommended rules, so those later changes only add rules. The backend and mobile repos get ktlint, detekt and Konsist in parallel.

## What Changes

- **BREAKING (dev tooling only)**: remove oxlint and `.oxlintrc.json`. `npm run lint` now runs ESLint. App behavior does not change.
- Add an ESLint flat config with the `@eslint/js`, `typescript-eslint` (no type information) and `eslint-plugin-react-hooks` recommended presets.
- Port every custom oxlint rule 1:1: import boundaries for `core` and `features` (incl. no raw Radix in features), no default exports outside `*.config.{ts,mjs}` (`eslint-plugin-import-x`), `type` over `interface`, no explicit `any`, rules of hooks, and the fast-refresh export warning (`eslint-plugin-react-refresh`).
- Ignore the same paths oxlint ignores today, plus `.claude/` (ESLint lints dot-folders and doesn't read `.gitignore`, so worktrees there would be linted).
- Add `npm run lint:fix` (`eslint . --fix`). `npm run lint` (`eslint .`) stays the existing commit gate. Only errors fail it.
- Rewrite the 5 `oxlint-disable` comments as `eslint-disable` comments with the same reasons.
- Keep the gate green without fixing other code: `no-unused-vars` ignores `_`-prefixed names, and the BOM in the preview playground regex is written as the escape `\uFEFF` instead of the literal character.
- Point `src/app/lintBoundaries.test.ts` at ESLint. Its fixtures and checks stay.
- Update AGENTS.md, README and the project skills `react-project-structure`, `react-data-layer` and `react-routing` from oxlint to ESLint.

No new gate, git hook or CI. No type-aware or other advanced rules. Existing findings are not fixed beyond the two lines above, and there is no suppressions file.

## Capabilities

### New Capabilities

- `web-static-analysis`: The terminal commands that statically analyze the web client's source and the rules they enforce, including the import boundaries.

### Modified Capabilities

None.

## Impact

- **Shared specs**: none. This change is web-only tooling and implements or depends on no requirement in `cardigan-shared-specs`.
- **Dependencies**: new dev dependencies `eslint` 10.15, `@eslint/js` 10.0, `typescript-eslint` 8.74, `eslint-plugin-react-hooks` 7.1, `eslint-plugin-react-refresh` 0.5.8, `eslint-plugin-import-x` 4.18, `globals` 17.14 (approved, D8–D10). `oxlint` is removed.
- **Files**: `package.json`, `package-lock.json`, new `eslint.config.mjs`, removed `.oxlintrc.json`, `src/app/lintBoundaries.test.ts`, `src/app/i18next.d.ts`, `src/app/router.ts`, `src/core/utils/text.ts`, `src/features/transfer/utils/exportFileName.ts`, `src/preview/TransferPlayground.tsx`, `AGENTS.md`, `README.md`, `.claude/skills/react-project-structure/SKILL.md`, `.claude/skills/react-data-layer/SKILL.md`, `.claude/skills/react-routing/SKILL.md`.
- **Workflow**: developers and agents run the same `npm run lint` gate. It is a few seconds slower than oxlint (about 3.4 s for the whole repo in the dry run).
