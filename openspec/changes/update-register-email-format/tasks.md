# Tasks

Each group ends with all five gates passing (`typecheck`, `lint`, `format:check`, `test`, `build`) and a commit, as `AGENTS.md` requires.

## 1. Email format

- [ ] 1.1 Replace `isAddrSpec` in `src/features/auth/utils/emailFormat.ts` with `isValidEmail`, using the shared reference regex from `domain-user` › *Email format has one reference pattern* copied exactly (read it with `openspec show domain-user --type spec --store cardigan-shared-specs`). Delete the quoted-string and domain-literal helpers. Rewrite `emailFormat.test.ts`:
  - Every valid and invalid email in the shared *Email local part is a dot-atom* and *Email domain has at least two labels* scenarios.
  - Local parts of 64 and 65 characters.
  - The shared 250 KB near-match and the existing near-match inputs, each rejected within 100 ms.

  Verify the tests pass.

## 2. Register email check

- [ ] 2.1 Change `registerEmailError` in `utils/registerForm.ts` to use `checkText(value, { kind: 'singleLine', max: EMAIL_MAX_LENGTH })` and then `isValidEmail`, in the order from design.md. Add unit tests in `registerForm.test.ts`:
  - `mail@pl-coding` → invalid.
  - `ann@a.b.example.co.uk` → valid.
  - A 255-code-point email with a tab → "Enter a valid email address."
  - A 255-code-point email without `@` → "Email can't be longer than 254 characters."
  - `  Ann@Example.com ` still passes.

  Verify the tests pass.
- [ ] 2.2 Add a `RegisterScreen` test for each new spec scenario: `mail@pl-coding` and `"ann lee"@example.com` show "Enter a valid email address." after blur and send no request on submit. Verify the tests pass, and that the existing log in tests pass unchanged.

## 3. Final check

- [ ] 3.1 Run the five gates on a clean working tree and verify all of them pass.

## Workflow follow-up

- Before archiving, check that the shared-specs branch `13-email-validation-updates` is merged into `master`, and that the merged `domain-user` regex still matches the one in `emailFormat.ts`.
- Archive only when the user says so.
