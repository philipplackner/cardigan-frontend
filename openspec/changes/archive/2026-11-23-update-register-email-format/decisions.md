# Decisions: update-register-email-format

Confirmed with Philipp Lackner on 2026-11-23.

## Summary

The register form adopts the practical email format from the shared change `practical-email-format`. It checks the email with the shared reference regex in the shared field error order and keeps the existing "Enter a valid email address." text for every format failure. The log in screen doesn't change. The proposal references the shared requirements now, although the shared branch isn't merged yet.

## Decisions

### D1 — Format check
- **Question**: How should the web register form check the new email format?
- **Decision**: Use the shared reference regex from `domain-user` › *Email format has one reference pattern*, copied exactly. It replaces the hand-written RFC 5322 parser `isAddrSpec`, and the check is renamed to `isValidEmail`.
- **Alternatives**: Rewrite the hand-written checker to the new rules without a regex.
- **Why**: Every platform then accepts the same emails as the backend.
- **Depends on**: —

### D2 — Error copy
- **Question**: Which message should the register email field show for the newly rejected addresses (single-label domain, quoted local part, domain literal, non-ASCII, local part over 64 characters)?
- **Decision**: Every format failure shows the existing "Enter a valid email address." No new strings.
- **Alternatives**: Specific messages per failure, which would need new copy shared with mobile.
- **Depends on**: D1

### D3 — Check order
- **Question**: Should the register email check follow the shared `api-errors` order exactly?
- **Decision**: Yes. Filled in → no forbidden characters → normalized length at most 254 → format. The texts stay as they are: "Enter your email.", "Enter a valid email address." for forbidden characters, "Email can't be longer than 254 characters.", "Enter a valid email address." for the format.
- **Alternatives**: Keep the current order (filled in → length → format, with forbidden characters failing the format).
- **Why**: The client reports the same rule as the backend's code. The only visible difference is an overlong email with a control character, which now shows "Enter a valid email address."
- **Depends on**: D1

### D4 — Shared spec not merged yet
- **Question**: How should the proposal reference the shared change, which is archived only on the shared-specs branch `13-email-validation-updates`?
- **Decision**: Plan against it now. The proposal names the new `domain-user` requirements and notes that the shared branch must be on shared-specs `master` before this change is archived.
- **Alternatives**: Wait for the shared merge before writing the proposal.
- **Depends on**: —

## Facts

- The shared change replaces *Email follows the RFC 5322 address format* with *Email local part is a dot-atom*, *Email domain has at least two labels*, *Email format has one reference pattern*, *Register enforces the email format* and *Login does not check the email format* — source: cardigan-shared-specs `openspec/changes/archive/2026-11-23-practical-email-format/`.
- The shared change is on branch `13-email-validation-updates`, not on `origin/master` — source: `git branch -a --contains b53f0e1` in `/Users/philipplackner/openspec/cardigan-shared-specs`.
- Log in only checks that email and password are filled in, so it already meets *Login does not check the email format* — source: `openspec/specs/web-auth/spec.md` › *Log in checks only for filled-in fields*.
- The register email check is the only user of `isAddrSpec` — source: `src/features/auth/utils/registerForm.ts`.
- The server codes `INVALID_FORMAT` and `INVALID_CHARACTER` on `email` already show "Enter a valid email address." — source: `src/features/auth/utils/fieldErrorText.test.ts`.
- `checkText(value, { kind: 'singleLine', max })` reports `INVALID_CHARACTER` before `TOO_LONG` on the normalized value — source: `src/core/utils/text.ts`.
- No platform has real user data, so nothing has to migrate — source: shared `practical-email-format` D4.

## Out of scope

- The log in screen.
- Backend and mobile changes (covered by the shared change).
- New or changed copy.

## Deferred

- None.
