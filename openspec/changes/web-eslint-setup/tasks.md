# Tasks

## 1. Dependencies

- [ ] 1.1 Add dev dependencies `eslint@10.15.0`, `@eslint/js@10.0.1`, `typescript-eslint@8.74.0`, `eslint-plugin-react-hooks@7.1.1`, `eslint-plugin-react-refresh@0.5.8`, `eslint-plugin-import-x@4.18.1` and `globals@17.14.0` with npm, keeping the repo's caret style (D8–D10). Verify `npm ls eslint typescript-eslint eslint-plugin-import-x` shows no missing or invalid peers.

## 2. ESLint config and scripts

- [ ] 2.1 Create `eslint.config.mjs` as in design.md: `defineConfig`/`globalIgnores`, the 3 presets, globals, the shared rule settings (`no-unused-vars` with `^_` ignore patterns, `consistent-type-definitions: type`, `no-explicit-any`, `import-x/no-default-export`, `react-refresh/only-export-components` warn with `allowConstantExport`), the `*.config.{ts,mjs}` override, and the `src/core/**` and `src/features/**` `no-restricted-imports` overrides copied from `.oxlintrc.json`. Verify `npx eslint --print-config src/features/boards/index.ts` shows the features patterns and `import-x/no-default-export` as error, and `npx eslint --print-config vite.config.ts` shows it off.
- [ ] 2.2 In `package.json`, set `"lint": "eslint ."` and add `"lint:fix": "eslint . --fix"` (D11). Verify `npm run lint` runs ESLint and lists the 5 known errors from decisions.md (Facts), plus `@typescript-eslint/consistent-type-definitions` at `src/app/i18next.d.ts` and `src/app/router.ts` (their disable comments are rewritten in 2.3), and nothing else.
- [ ] 2.3 Rewrite the 5 `oxlint-disable-next-line` comments as `eslint-disable-next-line` comments with ESLint rule IDs and the same reasons (`src/app/i18next.d.ts`, `src/app/router.ts`, `src/core/utils/text.ts` ×2, `src/features/transfer/utils/exportFileName.ts`). Verify `npm run lint` no longer reports `no-control-regex` or `consistent-type-definitions`.
- [ ] 2.4 In `src/preview/TransferPlayground.tsx:66`, replace the literal U+FEFF character in the regex with the escape sequence `\uFEFF` (D7). Verify `npm run lint` exits 0 with no errors, and `git diff` shows no other code changes under `src/` apart from tasks 2.3 and 3.1.
- [ ] 2.5 Verify the spec's command behavior by hand with throwaway files that are deleted afterwards: an `export default` under `src/` makes `npm run lint` exit non-zero; a `.tsx` file exporting a component plus a function gives a warning and exit 0; a file under `src/core/api/generated/` or `.claude/worktrees/` with an error is not reported; an `eslint-disable-next-line` comment suppresses only its own line; a fixable finding (for example `prefer-const`) is fixed by `npm run lint:fix`. Delete the files and verify `git status` is clean for them.

## 3. Boundary test

- [ ] 3.1 Rewrite `src/app/lintBoundaries.test.ts` to use ESLint's Node API (`new ESLint({ cwd, overrideConfigFile: 'eslint.config.mjs' })` + `lintText(source, { filePath })`). Use the ESLint rule IDs in `RULES`, and keep all `FORBIDDEN` and `ALLOWED` fixtures. Forbidden assertions match `{ ruleId: rule, severity: 2 }`; allowed assertions check `ruleId` only. Add a forbidden fixture `src/core/utils/coreClimbsIntoApp.ts` with `export { App } from '../../app/App'`. Verify `npx vitest run src/app/lintBoundaries.test.ts` passes. Then temporarily remove the `src/features/**` override from `eslint.config.mjs`, verify the test fails, and restore it.

## 4. Remove oxlint

- [ ] 4.1 Delete `.oxlintrc.json` and uninstall `oxlint`. Verify `grep -rn oxlint --exclude-dir=node_modules --exclude-dir=openspec .` only finds the docs handled in group 5, and `npm ls oxlint` finds nothing.

## 5. Documentation

- [ ] 5.1 Update `AGENTS.md`: the "Lint / format" row reads ESLint (with import boundaries), Prettier, and the import-boundaries line names ESLint rules. The gates stay unchanged. Verify `grep -n oxlint AGENTS.md` finds nothing.
- [ ] 5.2 Update `README.md`: the `npm run lint` row describes ESLint incl. import boundaries, and a `npm run lint:fix` row is added. Verify `grep -n oxlint README.md` finds nothing.
- [ ] 5.3 Update the project skills `.claude/skills/react-project-structure/SKILL.md`, `react-data-layer/SKILL.md` and `react-routing/SKILL.md` from oxlint to ESLint (config file, override note, boundary test steps, commands table, disable-comment examples with ESLint rule IDs). Verify `grep -rn oxlint .claude/skills` finds nothing.

## 6. Integration check

- [ ] 6.1 Run `npm run format`, then all five gates: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, `npm run build`. Verify all pass and `npm run lint` reports 0 errors.

## Workflow follow-up

- Commit as `build: replace oxlint with eslint` once all gates pass.
- Archive the change after review; the new `web-static-analysis` spec is created on archive.
