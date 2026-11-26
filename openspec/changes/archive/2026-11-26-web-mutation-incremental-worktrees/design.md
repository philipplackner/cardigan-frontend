# Design

## Context

See proposal.md for why. Current state:

- `stryker.config.mjs` sets `incremental: false` and `incrementalFile: 'reports/mutation/stryker-incremental.json'`. `reports/` is git-ignored.
- The repo has no git hook tooling: no husky, no lefthook, no `core.hooksPath`, no `prepare` script, and only sample hooks in `.git/hooks`.
- Git 2.44. `git worktree add` fires `post-checkout` in the new worktree with `$1` = the null ref (40 zeros), `$2` = the new HEAD and `$3` = `1`, both for a new branch and for a detached HEAD. With `--no-checkout` it doesn't fire. Normal checkouts pass a real `$1`. The hook runs with the new worktree's root as its working directory.
- `git rev-parse --path-format=absolute --git-common-dir` in a linked worktree returns the main repository's `.git` folder. Its parent is the main worktree.
- The incremental file stores repo-relative paths. Its absolute `projectRoot` is written but never read by Stryker 10.1.1. A full-run file is about 28 MB.
- husky 9.1.7 (latest), checked in its source and in a scratch repo:
  - `husky` (the `prepare` command) runs `git config core.hooksPath .husky/_` and generates `.husky/_/` with a `.gitignore` of `*`, so the folder is never committed.
  - Without a `.git` entry in the working directory it prints `.git can't be found` and exits 0. `HUSKY=0` skips it.
  - Hooks in `.husky/<name>` are run by the generated wrapper as `sh -e .husky/<name>`. A non-zero exit is reported as `husky - post-checkout script failed`.
  - Git resolves the relative `core.hooksPath` from the root of the worktree that runs the git command. `git worktree add` run from the main worktree (or a subfolder of it) fires the hook. Run from a linked worktree without `.husky/_/` (one that hasn't run `npm install`), it fires nothing.

- Claude Code worktrees (`EnterWorktree`) don't fire `post-checkout`: Claude Code creates them without a checkout and then resets, and a reset runs no hook. Claude Code reads `.worktreeinclude` (`.gitignore` syntax) from the main worktree and copies the git-ignored files it lists into each new worktree. Checked: the incremental file arrived with the same SHA, and nothing else under `reports/`.
- Claude Code worktrees start from `origin/master` by default (`worktree.baseRef` `fresh`). `origin/master` is still the initial commit, without `.gitignore` entries for `reports/`.

## Goals / Non-Goals

**Goals:**
- Plain runs reuse earlier results.
- A new worktree's first run reuses the main worktree's results.

**Non-Goals:**
- Any hook that runs mutation testing, tests or other checks.
- Syncing results between worktrees after creation (D6).
- Making the hook fire for worktrees created from a linked worktree that hasn't installed dependencies (see Risks).

## Decisions

### Incremental on by default

In `stryker.config.mjs`, `incremental: false` becomes `true`. Stryker's `--force` already means "retest all mutants and rewrite the file". Nothing else in the config changes. (D1)

### husky, installed by `prepare`

`npm install -D -E husky@9.1.7`, so `package.json` holds the exact version (D2). `package.json` gets `"prepare": "husky || true"`:
- No `.git` (a tarball install or a copied folder): husky prints its message and exits 0.
- husky not installed (dev dependencies omitted): the shell can't find `husky`, and `|| true` keeps the install from failing.
- In a linked worktree, `.git` is a file, which husky accepts. Running `npm install` there writes the same relative `core.hooksPath` to the shared config and generates `.husky/_/` in that worktree.

Not using `npx husky init`: it also writes a `pre-commit` hook that runs `npm test`, which this change must not add.

Alternatives considered: a committed `.githooks/` with a `prepare` script that sets `core.hooksPath` itself (no dependency; not chosen by the user); lefthook.

### The hook

`.husky/post-checkout`, POSIX `sh`, run by husky's wrapper with `sh -e` (D7). Because of `-e`, the only commands allowed to fail are the ones guarded with `||` or placed before `&&`:

```sh
# Seeds a new worktree with the main worktree's Stryker results. Must never fail the checkout.
[ "$1" = 0000000000000000000000000000000000000000 ] && [ "$3" = 1 ] || exit 0
file=reports/mutation/stryker-incremental.json
common=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || exit 0
main=$(dirname "$common")
here=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
[ "$main" != "$here" ] && [ -f "$main/$file" ] && [ ! -e "$here/$file" ] || exit 0
mkdir -p "$here/$(dirname "$file")" 2>/dev/null && cp "$main/$file" "$here/$file" 2>/dev/null || :
exit 0
```

- The trigger check is D8. The `main != here` check skips the main worktree itself.
- `[ ! -e ]` means it never overwrites (D3). `cp` copies, not links (D5). Nothing ever copies back (D6). The source is always the main worktree (D4).
- Every failure path exits 0 and prints nothing. `post-checkout` can't stop a checkout, but its exit code becomes the exit code of `git worktree add`, and husky would print a failure message, so it must always exit 0.
- If the main repository is bare, the parent of the common dir isn't a worktree, and the `-f` check fails silently.

### `.worktreeinclude` for Claude Code worktrees

`.worktreeinclude` at the repo root holds one line: `reports/mutation/stryker-incremental.json` (D9). It's a list of files, not code. Claude Code copies only the listed file, so the HTML report stays behind. It doesn't overwrite or link anything, and nothing flows back, which matches D3, D5 and D6. The husky hook stays for plain `git worktree add`. The two never act on the same worktree: Claude Code's creation doesn't fire the hook.

Alternatives considered: a Claude Code `WorktreeCreate` hook (replaces Claude Code's worktree creation); a wrapper script around `stryker run` that copies the file on first run (covers every case, but changes the `npm run mutation` script; kept as the fallback).

### Documentation

AGENTS.md's mutation notes change:
- Plain runs are incremental. The first run, or a run with `--force`, tests everything. `--force` gives a fresh full run. The `--incremental` note goes away.
- New worktrees get a copy of the main worktree's incremental file. For `git worktree add`, the husky hook `.husky/post-checkout` does it; `npm install` installs the hook, and it only fires when the worktree is created from the main worktree, or from a linked worktree that has run `npm install`. For Claude Code worktrees, `.worktreeinclude` does it.
- Claude Code worktrees start from `origin/master` by default (`worktree.baseRef` `fresh`), so they reuse less until `master` has this setup. Until then the copied file shows as untracked there; don't commit it. Informational only; the setting stays as it is.
- husky owns `core.hooksPath`, so hooks in `.git/hooks` don't run. `HUSKY=0` turns hooks off for one command.
- The only hook copies a file. It never runs mutation testing, tests or other checks.

## Risks / Trade-offs

- [husky sets `core.hooksPath`, so hooks a developer adds to `.git/hooks` stop running] → Documented. There are none today.
- [A worktree created from a linked worktree that hasn't run `npm install` gets no copy, because `.husky/_/` doesn't exist there] → Accepted and documented. Creating worktrees from the main worktree, as Claude Code does by default, works. An absolute `core.hooksPath` would avoid this but leaves the standard husky setup.
- [Claude Code might create worktrees in a way that skips `git worktree add`, uses `--no-checkout` or runs from elsewhere] → Task 2.3 checks a Claude Code worktree. If no copy appears, stop and report before changing anything.
- [Reused results can hide flaky timeouts: a mutant counted as timeout once stays that way until its code or tests change] → `--force` documented for a fresh baseline.
- [The main worktree's file may be from an older commit] → Stryker compares file contents, so it retests what differs. Results are never wrong, only less reused.
- [`|| true` in `prepare` would also hide a broken husky install] → husky itself never exits non-zero on install errors anyway; it prints the problem. Accepted.

## Migration Plan

Developers with an existing clone run `npm install` once after pulling this change. Until then, worktrees are created without the copy and runs start from zero, as before.
