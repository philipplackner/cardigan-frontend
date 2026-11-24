# Proposal

## Why

A full mutation run takes about 25 minutes. Incremental runs only retest what changed, but they were opt-in, and a new worktree starts with no state at all. Making incremental the default and seeding new worktrees with the main worktree's results makes everyday runs short.

## What Changes

- `npm run mutation` runs incrementally by default. `npm run mutation -- --force` retests everything. The state file stays at `reports/mutation/stryker-incremental.json`. This replaces the opt-in model from `web-stryker-mutation-testing` (its D7).
- Add husky (9.1.7, exact version) as a dev dependency with `"prepare": "husky || true"`, so `npm install` and `npm ci` install the git hooks and `prepare` never fails where there is no `.git` or no husky.
- Add `.husky/post-checkout`, a POSIX shell script that acts only when a new worktree is created. It copies the incremental file from the main worktree into the new worktree. It never overwrites, copies instead of linking, never copies back, does nothing if there's no source file and never fails the checkout.
- Update AGENTS.md: incremental by default, `--force`, the worktree hook and its limits.

This is a narrow, user-approved exception to "no git hooks". The hook copies a file and never runs mutation testing. No CI job, no gate, no other hook.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `web-mutation-testing`: incremental runs become the default, and new worktrees get the main worktree's incremental state. The capability is created by `web-stryker-mutation-testing`, which must be archived first.

## Impact

- **Shared specs**: none. Web-only tooling.
- **Dependencies**: new dev dependency `husky` 9.1.7 (approved).
- **Files**: `stryker.config.mjs` (`incremental: true`), `package.json` and `package-lock.json` (husky, `prepare`), new `.husky/post-checkout`, `AGENTS.md`.
- **Git config**: husky sets `core.hooksPath` to `.husky/_` in the shared repository config. Hooks in `.git/hooks` stop running; there are none today.
- **Unchanged**: everything else about mutation testing, `npm test`, coverage, the gates.
- **Order**: archive `web-stryker-mutation-testing` before this change.
