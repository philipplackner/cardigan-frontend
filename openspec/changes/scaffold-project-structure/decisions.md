# Decisions: scaffold-project-structure

Confirmed with Philipp Lackner on 2026-11-13.

## Summary

Turn the Vite scaffold into the folder layout and build setup from the
`react-project-structure` skill, so feature work can start in the right places.
The scaffold stays minimal: structure, TypeScript, lint boundaries with their
test, Prettier, Vitest, Tailwind wiring and the React Compiler. Libraries that
only a feature needs (router, Query, i18n, MSW, Playwright, Zod, forms, dnd-kit,
Radix) come with the first change that uses them. The app renders nothing
after this change, and no user-visible behavior changes.

## Decisions

### D1 — Dependency scope
- **Question**: Which packages should the scaffold install and configure?
- **Decision**: Minimal. Folders, tsconfig, oxlint import boundaries, Prettier and Vitest. The only other additions are Tailwind (D4) and the React Compiler (D12).
- **Alternatives**: Infrastructure only (router, Query, Tailwind, i18n, Prettier, Vitest+RTL+MSW, Playwright, Zod); everything in the AGENTS.md table.
- **Why**: Matches the AGENTS.md rule to add each dependency in the change that first needs it.
- **Depends on**: —

### D2 — Empty folders
- **Question**: How do empty feature and core folders exist in git?
- **Decision**: A `.gitkeep` in each empty folder. Remove it when the first real file lands in that folder.
- **Alternatives**: Only top-level feature/core folders; no empty folders.
- **Why**: —
- **Depends on**: —

### D3 — OpenAPI pipeline
- **Question**: What does this change do about the API contract pipeline?
- **Decision**: Defer it. Create `src/core/api/generated/` (with `.gitkeep`) and exclude it from oxlint and Prettier. Don't add `api:sync` or `api:generate` scripts.
- **Alternatives**: Add `api:sync` only; pick a generator now.
- **Why**: The backend has no OpenAPI snapshot yet and the generator isn't chosen.
- **Depends on**: —

### D4 — Tailwind
- **Question**: Should Tailwind v4 be installed and wired in this change?
- **Decision**: Yes. Install Tailwind v4 with its Vite plugin, make `src/index.css` the Tailwind entry, and import an empty theme file from `src/core/ui/theme/`. Figma tokens, breakpoints and Geist fonts come in a separate design-system change.
- **Alternatives**: Tailwind later; tokens and fonts now.
- **Why**: Explicit exception to D1.
- **Depends on**: D1

### D5 — Vitest setup
- **Question**: Which Vitest setup does the scaffold include?
- **Decision**: Vitest in the node environment with a pinned non-UTC time zone, for unit tests. Add the lint-boundary test (`src/app/lintBoundaries.test.ts`). Add a separate `tsconfig.test.json` for test files. jsdom, RTL, user-event, jest-dom, MSW and `testSetup.ts` come with the first screen or feature test.
- **Alternatives**: Also jsdom + RTL; full test stack with MSW.
- **Why**: —
- **Depends on**: D1

### D6 — App shell
- **Question**: What does the app render after the scaffold?
- **Decision**: Move `App` to `src/app/App.tsx` as a named export that still renders nothing. Update `main.tsx`. Delete `src/App.tsx`.
- **Alternatives**: Keep `src/App.tsx` with its default export.
- **Why**: No invented UI. Named exports only.
- **Depends on**: D1

### D7 — Node version
- **Question**: Which Node version does `.nvmrc` pin?
- **Decision**: 26.
- **Alternatives**: 24.
- **Why**: Matches the local Node (v26.8.1), current LTS line.
- **Depends on**: —

### D8 — Feature folders
- **Question**: Which sub-folders does each feature get?
- **Decision**: `auth`, `boards`, `cards`, `labels`, `transfer` each get `api/`, `components/`, `hooks/`, `utils/` with `.gitkeep`. No `types.ts` stub.
- **Alternatives**: Folders plus empty `types.ts`; only `api/`, `components/`, `hooks/`.
- **Why**: —
- **Depends on**: D2

### D9 — Core folders
- **Question**: Which core folders exist after the scaffold?
- **Decision**: The full layout: `api/`, `api/generated/`, `auth/`, `ui/`, `ui/icons/`, `ui/theme/`, `i18n/`, `utils/`.
- **Alternatives**: Top-level core folders only.
- **Why**: —
- **Depends on**: D2

### D10 — API proxy
- **Question**: Configure the Vite `/api` proxy now?
- **Decision**: Yes. Vite dev and preview servers forward `/api` to `http://localhost:8080`.
- **Alternatives**: Add it with the first API call.
- **Why**: —
- **Depends on**: —

### D11 — Specs
- **Question**: Should the change skip OpenSpec specs?
- **Decision**: Yes, `skip_specs: true`. Boundaries are enforced by lint and its test.
- **Alternatives**: Write a web-only dev-architecture spec.
- **Why**: Pure tooling and structure, no behavior change.
- **Depends on**: —

### D12 — React Compiler
- **Question**: Enable the React Compiler in this change?
- **Decision**: Yes.
- **Alternatives**: Enable with the first real components.
- **Why**: Already decided in the AGENTS.md stack table. Cheap now, harder to retrofit.
- **Depends on**: D1

### D15 — React Compiler integration
- **Question**: How does the build run the React Compiler?
- **Decision**: Babel preset: `reactCompilerPreset()` from `@vitejs/plugin-react` through `@rolldown/plugin-babel`, with `@babel/core` and `babel-plugin-react-compiler`.
- **Alternatives**: Rust compiler via `react({ compiler: true })` and `oxc-transform-react` (marked experimental).
- **Why**: Stable over experimental.
- **Depends on**: D12

### D13 — README
- **Question**: What happens to the Vite template README?
- **Decision**: Replace it with a short project README: setup (`nvm use`, `npm install`), the scripts and gates, and a pointer to AGENTS.md for architecture.
- **Alternatives**: Leave it.
- **Why**: —
- **Depends on**: —

### D14 — Hosting config
- **Question**: Is hosting config (SPA fallback, security headers, CSP) in scope?
- **Decision**: Out of scope.
- **Alternatives**: Add it now.
- **Why**: No hosting target yet.
- **Depends on**: —

## Facts

- The repo is the plain Vite scaffold: `src/App.tsx` (default export, empty fragment), `src/main.tsx`, empty `src/index.css`, no Prettier, no tests, no Tailwind — source: `git ls-files`
- Installed: React 19.3, Vite 8.3, `@vitejs/plugin-react` 6.1, TypeScript 6.0, oxlint 1.88 — source: `package.json`
- `.oxlintrc.json` only has `react/rules-of-hooks` and `react/only-export-components`; no import boundaries — source: `.oxlintrc.json`
- `tsconfig.app.json` lacks `strict`, `noUncheckedIndexedAccess` and the `@/` alias — source: `tsconfig.app.json`
- Gates are `typecheck`, `lint`, `format:check`, `test`, `build`; `typecheck` covers app and test tsconfigs — source: `react-project-structure` skill
- Boundary rules and the lint-boundary test approach — source: `react-project-structure` skill, "Enforcing with oxlint" and "Testing the lint rules"
- Code style rules to enforce: `import/no-default-export`, `typescript/consistent-type-definitions` (type), `typescript/no-explicit-any` — source: `react-project-structure` skill
- The backend snapshot folder `app/src/test/resources/openapi/` doesn't exist yet — source: `ls /Users/philipplackner/IdeaProjects/cardigan/app/src/test/resources/openapi/`
- `/api` proxy target is `http://localhost:8080` for dev and preview — source: AGENTS.md, `react-routing` skill
- Local Node is v26.8.1; no `.nvmrc` exists — source: `node -v`

## Out of scope

- TanStack Router, TanStack Query, react-i18next, Zod, React Hook Form, dnd-kit, Radix/shadcn
- jsdom, React Testing Library, user-event, jest-dom, MSW, `testSetup.ts`, Playwright
- `api:sync`, `api:generate`, choosing the OpenAPI generator
- Figma theme tokens, breakpoints, Geist fonts, icons
- Hosting config: SPA fallback, security headers, CSP
- Any UI, routes, copy or `index.html` title change
- Shared-spec behavior: this change implements no requirement from `cardigan-shared-specs`

## Deferred

- OpenAPI generator choice — settle before: the change that adds the API pipeline
- Hosting target and its config — settle before: the deployment change
