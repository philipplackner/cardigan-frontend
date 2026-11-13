# Tasks

## 1. Node and TypeScript baseline

- [x] 1.1 Add `.nvmrc` with `26` and `"engines": { "node": ">=26" }` in `package.json`; verify `nvm use` picks Node 26
- [x] 1.2 Tighten `tsconfig.app.json` (`strict`, `noUncheckedIndexedAccess`, `@/*` paths, exclude test files) and add `tsconfig.test.json` (extends app, own `tsBuildInfoFile: ./node_modules/.tmp/tsconfig.test.tsbuildinfo`, test files only, `types: ["vite/client", "node"]`), referenced from `tsconfig.json`; add `resolve: { tsconfigPaths: true }` to `vite.config.ts` (fallback per design.md > Path alias); verify `npx tsc -b` passes
- [x] 1.3 Add the `typecheck` script (`tsc -b`); verify `npm run typecheck` and `npm run build` pass

## 2. Prettier

- [x] 2.1 Install `prettier`, add `.prettierrc.json` (`semi: false`, `singleQuote: true`) and `.prettierignore` (dist, node_modules, lockfile, `src/core/api/generated`, `src/app/routeTree.gen.ts`, openspec, .claude); verify the ignore list by running `npx prettier --check .` and seeing only project files listed
- [x] 2.2 Add `format` and `format:check` scripts and run `npm run format` once; verify `npm run format:check` passes and the diff contains formatting only
- [x] 2.3 Commit `build: add node pin, strict tsconfig and prettier` after typecheck, lint, format:check and build pass

## 3. Vitest

- [x] 3.1 Install `vitest`, add `vitest.config.ts` (node environment, `src/**/*.test.{ts,tsx}`, `resolve: { tsconfigPaths: true }` same as `vite.config.ts`, `process.env.TZ = 'Europe/Berlin'`) and include it in `tsconfig.node.json`; add `src/app/testEnvironment.test.ts` asserting `new Date(0).getTimezoneOffset() !== 0` and keep it
- [x] 3.2 Add `test` (`vitest run`) and `test:watch` scripts; verify `npm test` passes and runs the time zone test

## 4. oxlint boundaries and style rules

- [x] 4.0 Move `App` to `src/app/App.tsx` as `export function App()` returning `null`, update `src/main.tsx` to import it via `@/app/App`, delete `src/App.tsx`; verify `npm run dev` serves a blank page with no console errors and `npm run build` passes (this also proves the `@/` alias resolves in Vite); commit `refactor: move app into src/app with a named export` after typecheck, lint, format:check, test and build pass
- [x] 4.1 Update `.oxlintrc.json`: add the `import` plugin, `import/no-default-export` (`"error"`), `typescript/consistent-type-definitions` (`["error", "type"]`), `typescript/no-explicit-any` (`"error"`), `ignorePatterns` for generated files and `dist`, and an override disabling `import/no-default-export` for `*.config.ts`; verify `npm run lint` passes on the current code
- [x] 4.2 Add the `core` and `features` `no-restricted-imports` overrides from the skill (each override lists all its patterns); verify `npm run lint` still passes
- [x] 4.3 Write `src/app/lintBoundaries.test.ts` with every fixture from design.md (forbidden and allowed for each rule); verify `npm test` passes, then temporarily remove one override and confirm the test fails
- [x] 4.4 Commit `build: add vitest and lint import boundaries with test` after all five gates pass

## 5. Folder skeleton

- [x] 5.1 Create `src/core/{api,api/generated,auth,i18n,utils,ui,ui/icons,ui/theme}` and `src/features/{auth,boards,cards,labels,transfer}/{api,components,hooks,utils}` with a `.gitkeep` in each folder that has no file; verify with `find src -type d` against the layout in design.md
- [x] 5.2 Commit `refactor: scaffold core and feature folders` after all five gates pass

## 6. Tailwind, React Compiler and API proxy

- [x] 6.1 Install `tailwindcss` and `@tailwindcss/vite`, add the plugin to `vite.config.ts`, add `src/core/ui/theme/theme.css` with an empty `@theme` block, and make `src/index.css` import Tailwind and the theme; verify `npm run build` emits a CSS file containing Tailwind's preflight
- [x] 6.2 Install `@rolldown/plugin-babel`, `@babel/core`, `babel-plugin-react-compiler` and add `babel({ presets: [reactCompilerPreset()] })` to `vite.config.ts`; verify `npm run typecheck` and `npm run build` pass (add `@types/babel__core` only if typecheck needs it)
- [x] 6.3 Add the shared `/api` proxy to `http://localhost:8080` for `server` and `preview`; verify with `npm run dev` that `curl -i localhost:5173/api/v1/x` is forwarded (connection error or backend response, not Vite's `index.html`)
- [x] 6.4 Commit `build: wire tailwind, react compiler and api proxy` after all five gates pass

## 7. README

- [x] 7.1 Replace `README.md` with setup (`nvm use`, `npm install`, `npm run dev`), the script and gate list, and a pointer to AGENTS.md; verify every documented command runs as written
- [x] 7.2 Commit `docs: replace template readme` after `format:check` passes

## 8. Final check

- [x] 8.1 Run all five gates from a clean `npm ci`; verify they pass and `git status` is clean
