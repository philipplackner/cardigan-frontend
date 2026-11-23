# Design

## Context

`registerEmailError` in `src/features/auth/utils/registerForm.ts` normalizes the email, then checks it is filled in, at most 254 code points long, and accepted by `isAddrSpec`. `isAddrSpec` in `utils/emailFormat.ts` is a hand-written, linear-time RFC 5322 parser. It is the only check this change replaces. Log in, the server error mapping and the translations stay as they are (see decisions.md › Facts).

## Goals / Non-Goals

**Goals:**
- The register form accepts exactly the emails the shared reference regex accepts.
- The client reports the first broken rule in the shared `api-errors` order.

**Non-Goals:**
- Any change to the log in form, copy, `core`, or the server error mapping.

## Decisions

### Shared regex as a module constant (D1)
`emailFormat.ts` exports `isValidEmail(value: string): boolean`, which tests the normalized value against the regex from `domain-user` › *Email format has one reference pattern*, copied character for character. Its doc comment names the shared requirement as the source. The quoted-string and domain-literal helpers are deleted. A hand-written checker was rejected: the regex is the shared definition, and every repeated group starts with a literal `.`, so it runs in linear time in JavaScript's backtracking engine too.

The input is already normalized by the caller, so the anchors `^`/`$` don't need the `m` flag, and no `u` flag is used, so a non-ASCII character can never match the ASCII classes.

### Order through `checkText` (D3)
`registerEmailError` calls `checkText(value, { kind: 'singleLine', max: 254 })` and maps its result:
- `EMPTY` → "Enter your email."
- `INVALID_CHARACTER` → "Enter a valid email address."
- `TOO_LONG` → "Email can't be longer than 254 characters."

Only when there is no error does it run `isValidEmail` on the normalized value. `checkText` reports `INVALID_CHARACTER` before `EMPTY`, but after normalization an email made only of forbidden characters isn't possible in practice: whitespace is trimmed, and a NUL alone is non-empty and gets the same "Enter a valid email address." either way. This reuses the foundation's helper instead of a separate character check. `EMAIL_MAX_LENGTH` stays the source of the 254.

The rejected alternative kept the current order, where control characters fall through to the format check.

### Tests
- `emailFormat.test.ts` is rewritten around every scenario in the shared *Email local part is a dot-atom* and *Email domain has at least two labels* requirements, including the valid ones (`a@b.co`, `ann@xn--mnchen-3ya.de`, 64 vs 65 character local parts).
- It also covers the shared 250 KB near-match (`a@` + `a.` × 125,000 + `1`) and the existing near-match inputs, each under 100 ms.
- `registerForm.test.ts` gets the order cases: a 255-character email with a tab → invalid, and a 255-character email without `@` → too long.
- `RegisterScreen.test.tsx` gets one screen test for `mail@pl-coding`.

## Risks / Trade-offs

- [The shared branch changes again before it is merged] → Archive only after the shared branch is on `master`. Re-check the regex against the merged `domain-user` spec before archiving (Workflow follow-up).
- [Copying the regex can introduce a typo] → The unit tests run every shared scenario, so a typo that changes behavior fails a test.
