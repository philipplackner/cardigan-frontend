# Decisions: web-eslint-setup

Confirmed with Philipp Lackner on 2026-11-26. The answers were collected by the orchestrator session (cardigan-ae), which asked the user one batch of questions for the backend, mobile and web repos and relayed the web answers here. There was no direct interview in this session.

## Summary

Replace oxlint with ESLint as the web client's linter. ESLint uses the standard recommended presets plus a 1:1 port of the existing custom rules (import boundaries, no default exports, type over interface, no explicit any, rules of hooks, fast-refresh exports). `npm run lint` keeps its place as the existing commit gate, and `npm run lint:fix` is added. Existing findings are not fixed beyond two approved one-line exceptions that keep the gate green.

## Decisions

### D1 — Workflow
- **Question**: Test-first or plain workflow?
- **Decision**: Plain (`careful-planning`).
- **Alternatives**: Test-first (`careful-planning-tdd`).
- **Why**: Tooling and config only. No app behavior a new test could observe. The existing boundary test keeps covering the ported rules.
- **Depends on**: —

### D2 — Relationship to oxlint
- **Question**: How should ESLint relate to the existing oxlint setup?
- **Decision**: Replace oxlint. Remove the `oxlint` dependency and `.oxlintrc.json`. Port all custom rules and overrides to ESLint: the `core` and `features` import boundaries (incl. no raw Radix imports in features), no default exports with the `*.config.{ts,mjs}` exception, `consistent-type-definitions: type`, `no-explicit-any`, `rules-of-hooks`, `only-export-components`. Rewrite `src/app/lintBoundaries.test.ts` to run ESLint. Rewrite the `oxlint-disable` comments as `eslint-disable` comments with the same reasons. This changes the lint stack listed in AGENTS.md.
- **Alternatives**: ESLint alongside oxlint with `eslint-plugin-oxlint`; ESLint infrastructure only, oxlint split decided later.
- **Why**: User, via the orchestrator. One linter.
- **Depends on**: —

### D3 — Starting rule set
- **Question**: Which rule set should ESLint start with?
- **Decision**: `@eslint/js` recommended + `typescript-eslint` recommended (no type information) + `eslint-plugin-react-hooks` recommended, plus the ported rules from D2.
- **Alternatives**: Empty config; type-aware presets (`recommendedTypeChecked`).
- **Why**: Standard baseline, fast, no advanced rules yet.
- **Depends on**: D2

### D4 — Findings in existing code
- **Question**: How should findings in existing code be handled?
- **Decision**: Don't fix them and don't add a suppressions/baseline file. The only approved exceptions are in D7.
- **Alternatives**: Fix them all; record them in `eslint-suppressions.json`; downgrade to warnings.
- **Why**: User: "I just want to have the tooling to find these issues." Same answer as the detekt sessions.
- **Depends on**: —

### D5 — Warnings
- **Question**: Should warnings fail the lint command?
- **Decision**: No. Only errors fail. No `--max-warnings 0`.
- **Alternatives**: Warnings fail too.
- **Why**: Matches oxlint's current behavior.
- **Depends on**: —

### D6 — Enforcement
- **Question**: Where is ESLint enforced?
- **Decision**: ESLint takes over the existing `npm run lint` commit gate from oxlint. Nothing new: no husky pre-commit hook, no CI.
- **Alternatives**: Manual command only; gates plus a pre-commit hook.
- **Why**: User: every tool in every repo stays on demand. The web lint gate already exists and stays.
- **Depends on**: —

### D7 — Clash between D4 and D6
- **Question**: The planned config reports 2 errors in existing code while `lint` is a commit gate. How is that resolved?
- **Decision**: Configure `@typescript-eslint/no-unused-vars` to ignore names starting with `_` (fixes `src/core/utils/text.ts:46`), and write the literal BOM in the regex in `src/preview/TransferPlayground.tsx:66` as `﻿` (same behavior). Lint is green after the change.
- **Alternatives**: `eslint-disable` comments on both lines; take `lint` out of the gates.
- **Why**: User's approved exception to D4.
- **Depends on**: D3, D4, D6

### D8 — Dependencies
- **Question**: May these dev dependencies be added and oxlint removed?
- **Decision**: Approved: `eslint` 10.15, `@eslint/js` 10.0, `typescript-eslint` 8.74, `eslint-plugin-react-hooks` 7.1, `globals` 17.14. Remove `oxlint`.
- **Alternatives**: Approve with changes.
- **Why**: Minimum for D3 and the D2 port. All support TypeScript 6.0 and Node 26.
- **Depends on**: D2, D3

### D9 — Fast-refresh exports rule
- **Question**: Port `react/only-export-components`?
- **Decision**: Yes, via `eslint-plugin-react-refresh` 0.5.8 (approved), as a warning with `allowConstantExport: true`.
- **Alternatives**: Drop the rule.
- **Why**: Keeps today's check. Stays a warning, so it never fails the gate (D5).
- **Depends on**: D2, D5

### D10 — No-default-export rule
- **Question**: How to port `import/no-default-export`?
- **Decision**: `eslint-plugin-import-x` 4.18 (approved) with `import-x/no-default-export`, off for `*.config.{ts,mjs}`.
- **Alternatives**: ESLint core `no-restricted-exports` with `restrictDefaultExports` (recommended, no extra dependency).
- **Why**: User's choice. Same rule semantics, and a base for later import rules.
- **Depends on**: D2

### D11 — Package scripts
- **Question**: Which scripts does the setup expose?
- **Decision**: `npm run lint` = `eslint .` (the gate) and `npm run lint:fix` = `eslint . --fix` (on demand).
- **Alternatives**: `lint` only.
- **Why**: Matches the lint + fix pair in the other repos.
- **Depends on**: D6

### D12 — Recorded assumptions (confirmed with the summary)
- **Question**: — (confirmed as part of the final summary)
- **Decision**: ESLint ignores the same paths as oxlint today (`src/core/api/generated/**`, `src/app/routeTree.gen.ts`, `dist/**`, `coverage/**`, `reports/**`, `.stryker-tmp/**`). `lintBoundaries.test.ts` keeps its fixtures and expectations and runs ESLint instead of oxlint. AGENTS.md and README describe ESLint instead of oxlint. oxlint's default checks that the presets don't include are no longer run.
- **Alternatives**: —
- **Why**: Keeps the replacement 1:1 apart from the rule presets.
- **Depends on**: D2

## Facts

- `npm run lint` runs `oxlint` with `.oxlintrc.json` (react, typescript, oxc, import plugins, boundary overrides). It passes with 0 findings. — source: package.json, .oxlintrc.json, `npx oxlint`
- `src/app/lintBoundaries.test.ts` runs the oxlint binary on fixture files in a temp dir and checks rule codes `eslint(no-restricted-imports)`, `import(no-default-export)`, `typescript(consistent-type-definitions)`, `typescript(no-explicit-any)`. — source: src/app/lintBoundaries.test.ts
- 5 `oxlint-disable-next-line` comments exist: src/app/i18next.d.ts:5, src/app/router.ts:33, src/core/utils/text.ts:23 and :25, src/features/transfer/utils/exportFileName.ts:4. — source: grep
- A dry run of the D3 presets on the repo (332 files, about 3.4 s) reported 5 errors and 0 warnings: 3 `no-control-regex` on the lines covered by the existing disable comments, 1 `@typescript-eslint/no-unused-vars` at src/core/utils/text.ts:46, 1 `no-irregular-whitespace` at src/preview/TransferPlayground.tsx:66. — source: scratchpad ESLint install, not in the repo
- Peer ranges: `typescript-eslint` 8.74 needs TypeScript >=4.8.4 <6.1.0 (repo: ~6.0.3); `eslint` 10.15 needs Node ^20.19 || ^22.13 || >=24 (repo: >=26); `eslint-plugin-import-x` 4.18 peers `eslint` ^10 and `@typescript-eslint/utils` ^8.56. — source: `npm view`
- No CI exists and husky has only a post-checkout hook. AGENTS.md lists `lint` as one of five commit gates. — source: .husky/, AGENTS.md
- No shared spec covers static analysis. — source: `openspec list --specs --store cardigan-shared-specs`

## Out of scope

- Type-aware or other advanced rules
- Fixing existing findings beyond D7
- Running Prettier through ESLint
- CI, git hooks, new gates

## Deferred

- None.
