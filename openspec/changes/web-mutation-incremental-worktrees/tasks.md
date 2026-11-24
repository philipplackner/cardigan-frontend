# Tasks

## 1. Incremental by default

- [ ] 1.1 Set `incremental: true` in `stryker.config.mjs`. With `--mutate src/core/utils/text.ts`, verify: the first run without a state file tests every mutant and writes `reports/mutation/stryker-incremental.json`; a second plain run tests no mutant and reports the same score; `-- --force` tests every mutant again. Verify `npm run lint` and `npm run format:check` pass

## 2. Worktree hook

- [ ] 2.1 Run `npm install -D -E husky@9.1.7` and add `"prepare": "husky || true"` to `package.json` (not `npx husky init`). Verify `npm ls husky` shows 9.1.7, `package.json` has the exact version, `npm install` sets `git config core.hooksPath` to `.husky/_`, `.husky/_/` is not in `git status`, and a copy of the project without `.git` (and one installed with `--omit=dev`) installs with exit code 0
- [ ] 2.2 Add `.husky/post-checkout` as in design.md. With an incremental file in the main worktree, verify: `git worktree add ../wt-a -b wt-a` from the main worktree copies it, and `git worktree add --detach ../wt-b` copies it too; a `git switch` in the main worktree and in `wt-a` copies nothing; with the main file moved away, `git worktree add ../wt-c -b wt-c` copies nothing, prints nothing and exits 0; with an existing file already in the target, it isn't overwritten; with the target's `reports/` made unwritable, `git worktree add` still exits 0 and husky prints no failure. Run `npm run mutation -- --mutate src/core/utils/text.ts` in `wt-a` and check it reuses the copied results and leaves the main worktree's file unchanged. Remove the scratch worktrees and branches
- [ ] 2.3 Create a worktree through Claude Code and check that the incremental file was copied. If it wasn't, stop and report to the user before changing anything. Remove the worktree

## 3. Documentation

- [ ] 3.1 Update AGENTS.md: the `mutation` row and notes say plain runs are incremental and the first run tests everything; `npm run mutation -- --force` gives a fresh full run; remove the `--incremental` note; new worktrees get a copy of the main worktree's incremental file through `.husky/post-checkout`, installed by `npm install`, and only when created from the main worktree or from a linked worktree that has run `npm install`; husky owns `core.hooksPath`, so hooks in `.git/hooks` don't run, and `HUSKY=0` turns hooks off for one command; the only hook copies a file and never runs mutation testing or other checks. Leave the gates line unchanged. Verify every documented command runs as written

## Workflow follow-up

- Archive `web-stryker-mutation-testing` before archiving this change.
