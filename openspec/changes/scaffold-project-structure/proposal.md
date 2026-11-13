# Proposal

## Why

The repo is still the plain Vite scaffold. Feature work needs the folder layout, import boundaries and verification gates from `react-project-structure` to exist first. Otherwise each feature change would also have to set up the project, and the boundaries would not be enforced from the first line of code.

## What Changes

- Create the `src/app`, `src/core` and `src/features` layout. Empty folders hold a `.gitkeep`:
  - `core/`: `api/`, `api/generated/`, `auth/`, `ui/`, `ui/icons/`, `ui/theme/`, `i18n/`, `utils/`
  - `features/<x>/` for `auth`, `boards`, `cards`, `labels`, `transfer`: `api/`, `components/`, `hooks/`, `utils/`
- Move `App` to `src/app/App.tsx` as a named export that still renders nothing. Delete `src/App.tsx`.
- Tighten TypeScript to the skill's baseline (`strict`, `noUncheckedIndexedAccess`, ...), add the `@/` path alias, and add `tsconfig.test.json` for test files.
- Configure oxlint: import boundaries for `core` and `features`, `import/no-default-export`, `type` over `interface`, no `any`. Exclude `src/core/api/generated/`.
- Add a lint-boundary test that proves the rules still catch forbidden imports.
- Add Prettier, Vitest (node environment, pinned non-UTC time zone), Tailwind v4 wiring with an empty theme file, and the React Compiler.
- Configure the Vite dev and preview proxy for `/api` to `http://localhost:8080`.
- Add `.nvmrc` (26) and the five gate scripts: `typecheck`, `lint`, `format:check`, `test`, `build`.
- Replace the Vite template README with a short project README.

No user-visible behavior changes. Not breaking.

## Capabilities

### New Capabilities

None. This change is tooling and structure only and sets `skip_specs: true`.

### Modified Capabilities

None.

### Shared-spec requirements

None. This change implements and depends on no requirement from `cardigan-shared-specs`.

## Impact

- **Code:** `src/main.tsx`, `src/App.tsx` (moved), `src/index.css`, new folders under `src/`.
- **Config:** `package.json`, `package-lock.json`, `tsconfig*.json`, `.oxlintrc.json`, `vite.config.ts`, new `vitest.config.ts`, `.prettierrc.json`, `.prettierignore`, `.nvmrc`, `README.md`.
- **New dev dependencies:** `prettier`, `vitest`, `tailwindcss`, `@tailwindcss/vite`, `babel-plugin-react-compiler`, `@rolldown/plugin-babel`, `@babel/core`.
- **Not touched:** routing, server state, i18n, MSW, Playwright, OpenAPI pipeline, Figma tokens, hosting config. See decisions.md, Out of scope.
