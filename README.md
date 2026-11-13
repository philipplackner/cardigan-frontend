# Cardigan Web

The React web client for Cardigan, a kanban app for developers. It talks to the Cardigan Spring Boot backend over a REST API under `/api/v1`.

## Setup

```sh
nvm use
npm install
npm run dev
```

`.nvmrc` pins the Node version. The dev server proxies `/api` to the backend at `http://localhost:8080`.

## Scripts

| Command                | What it does                          |
| ---------------------- | ------------------------------------- |
| `npm run dev`          | Start the Vite dev server             |
| `npm run build`        | Type-check and build for production   |
| `npm run preview`      | Serve the production build            |
| `npm run typecheck`    | Type-check app, test and config files |
| `npm run lint`         | oxlint, including import boundaries   |
| `npm run format`       | Format all files with Prettier        |
| `npm run format:check` | Check formatting with Prettier        |
| `npm test`             | Run the Vitest tests once             |
| `npm run test:watch`   | Run the Vitest tests in watch mode    |

## Gates

`typecheck`, `lint`, `format:check`, `test` and `build` must all pass before a commit.

## Architecture

See [AGENTS.md](AGENTS.md) for the tech stack, folder layout, project decisions and workflow.
