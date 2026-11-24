# Decisions: web-mutation-incremental-worktrees

Confirmed with Philipp Lackner on 2026-11-24. The answers were collected by the orchestrator session (cardigan-f2), which asked the user and relayed the answers here. There was no direct interview in this session.

## Summary

Make `npm run mutation` incremental by default, and add a git hook that copies the Stryker incremental file into each new worktree so runs there don't start from zero.

## Decisions

### D0 — Worktree hook as a narrow exception to "no hooks"
- **Decision**: Add a `post-checkout` git hook that only acts when a new worktree is created. It copies `reports/mutation/stryker-incremental.json` from the main worktree to the same path in the new worktree. If the source doesn't exist, it does nothing, silently. It never makes the checkout fail.
- **Why**: User, explicitly. This is a narrow exception to D0 of `web-stryker-mutation-testing` ("no git hooks"). The hook never runs mutation testing; it only copies a file. All other hooks, CI and gates stay excluded. A second, file-only mechanism sits next to it for Claude Code worktrees (D9): `.worktreeinclude` lists the file to copy and runs no code.
- **Depends on**: —

### D1 — Incremental mode on by default
- **Decision**: `npm run mutation` runs incrementally by default. `npm run mutation -- --force` gives a fresh full run. The state file stays at `reports/mutation/stryker-incremental.json`.
- **Alternatives**: Opt-in with `--incremental` (D7 of `web-stryker-mutation-testing`).
- **Why**: User. Replaces D7 of `web-stryker-mutation-testing`. That change isn't archived yet, so it must be archived before this one.
- **Depends on**: —

### D2 — How the hook is installed
- **Question**: How does the hook get installed, and does a fresh clone get it automatically?
- **Decision**: husky, as a new dev dependency pinned to the latest stable version (9.1.7), installed the standard way: a `prepare` script plus `.husky/post-checkout`. `npm install` and `npm ci` install it, so a fresh clone gets it. `prepare` is `husky || true`, so it never fails: husky itself only prints a message and exits 0 where there is no `.git`, and `|| true` covers installs where husky isn't present (dev dependencies omitted).
- **Alternatives**: `core.hooksPath` set by a `prepare` script to a committed `.githooks/`; lefthook; a manual step in AGENTS.md.
- **Why**: User. Accepted trade-off: husky sets `core.hooksPath`, so hooks in `.git/hooks` stop running. There are none today.
- **Depends on**: —

### D3 — Existing file in the target
- **Question**: Does the hook overwrite an incremental file that already exists in the new worktree?
- **Decision**: Never overwrite.
- **Alternatives**: Overwrite.
- **Why**: The hook can never destroy results. `reports/` is git-ignored, so a new worktree normally has no file.
- **Depends on**: D2

### D4 — Source of the copy
- **Question**: Where does the copy come from?
- **Decision**: The main worktree, found as the parent of `git rev-parse --path-format=absolute --git-common-dir`.
- **Alternatives**: The most recently changed incremental file of any worktree.
- **Why**: Predictable. Older results only mean less reuse, never wrong results, because Stryker retests whatever differs.
- **Depends on**: D2

### D5 — Copy or symlink
- **Question**: Copy the file or link to it?
- **Decision**: Copy.
- **Alternatives**: Symlink to the main worktree's file.
- **Why**: With a link, every worktree's run would overwrite the main file with its branch's results, and two runs at once would race on it.
- **Depends on**: D2

### D6 — Results flowing back
- **Question**: Do a worktree's results ever go back to the main worktree?
- **Decision**: Never.
- **Alternatives**: A manual command to copy a worktree's file back.
- **Why**: The main worktree's file always matches its own code.
- **Depends on**: D2

### D7 — Shell or Node
- **Question**: What language is the hook written in?
- **Decision**: POSIX `sh`.
- **Alternatives**: A Node script called from the hook.
- **Why**: About ten lines, and no Node start-up on every checkout. Checked by hand in real worktrees instead of a unit test.
- **Depends on**: D2

### D8 — When the hook acts
- **Question**: Which checkouts trigger the copy?
- **Decision**: Only worktree creation: the previous HEAD is the null ref, the checkout flag is 1, and the worktree isn't the main worktree. Normal checkouts are ignored.
- **Alternatives**: Also act on normal branch switches.
- **Why**: User. Accepted trade-off: a worktree created with `--no-checkout` gets no copy.
- **Depends on**: D2

### D9 — Claude Code worktrees
- **Question**: How do worktrees created by Claude Code get the incremental file, given that the hook doesn't fire for them?
- **Decision**: A `.worktreeinclude` file at the repo root with the line `reports/mutation/stryker-incremental.json`. Claude Code reads it from the main worktree when it creates a worktree and copies the git-ignored files it lists (`.gitignore` syntax). The husky hook stays for plain `git worktree add`.
- **Alternatives**: Document the gap only; a Claude Code `WorktreeCreate` hook; have `npm run mutation` copy the file itself through a wrapper script.
- **Why**: User. It's a list of files, not code. The wrapper script stays the fallback if `.worktreeinclude` stops working.
- **Depends on**: D0

## Verified facts

- Paths in the incremental file are relative to the repo root (`src/core/utils/text.ts`). Its only absolute value is `projectRoot`, which Stryker 10.1.1 writes but never reads. A copied file is therefore valid in another worktree.
- `git worktree add` (git 2.44) fires `post-checkout` in the new worktree with the null ref and flag 1, for a new branch and for a detached HEAD. `--no-checkout` doesn't fire it.
- husky 9.1.7 sets the relative `core.hooksPath=.husky/_`, and `.husky/_/` is generated by `prepare` and git-ignored. Git resolves the relative path from the worktree that runs `git worktree add`. So the hook runs when a worktree is created from the main worktree (or a subfolder of it), and also from a linked worktree that has run `npm install`. It doesn't run when a worktree is created from a linked worktree that hasn't run `npm install` yet. Checked in a scratch repo.
- husky runs hook files with `sh -e`, so the hook must guard every command that may fail.
- Claude Code worktrees don't fire `post-checkout`. Claude Code creates them without a checkout and then resets (reflog: `reset: moving to HEAD`), and git runs no hook for a reset. Checked with `EnterWorktree`.
- `.worktreeinclude` works: a worktree created with `EnterWorktree` got `reports/mutation/stryker-incremental.json` with the same SHA as the main one, and no other file under `reports/`. Claude Code read `.worktreeinclude` from the main worktree. The new worktree, based on `origin/master`, didn't contain it.
- Claude Code worktrees start from `origin/master` by default (`worktree.baseRef` is `fresh`). Until `master` has this setup, they reuse less, and the copied file shows as untracked there because `master`'s `.gitignore` doesn't ignore `reports/` yet.
- A full-run incremental file is about 28 MB.

## Deferred

None.
