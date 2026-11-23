# Proposal

## Why

The shared change `practical-email-format` replaces the RFC 5322 email rule with a stricter practical rule. The register form still accepts addresses like `mail@pl-coding`, `ann@localhost`, quoted local parts and domain literals. Cardigan has no email verification or password reset, so a mistyped address can't be recovered.

## What Changes

- **Register email format** (D1): the form checks the email with the shared reference regex instead of the RFC 5322 parser. The newly rejected addresses are:
  - single-label domains
  - quoted local parts
  - comments
  - domain literals
  - trailing dots
  - non-ASCII characters
  - local parts over 64 characters
  - top-level labels that aren't 2–63 letters
- **Check order** (D3): the register email check follows the shared `api-errors` order: filled in → forbidden characters → length 254 → format.
- **Copy** (D2): unchanged. Every format failure shows "Enter a valid email address."
- **Log in**: unchanged. It already checks only that the fields are filled in.

Not breaking. No platform has real user data.

**Prerequisite** (D4): the shared-specs branch `13-email-validation-updates` must be merged into shared-specs `master` before this change is archived.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `web-auth`: *Register email check* uses the new `domain-user` format and the shared check order.

### Shared-spec requirements

This change implements or depends on these `cardigan-shared-specs` requirements:

- `domain-user`:
  - *Email local part is a dot-atom*
  - *Email domain has at least two labels*
  - *Email format has one reference pattern*
  - *Register enforces the email format*: the client check matches the server's `INVALID_FORMAT`.
  - *Login does not check the email format*: confirms log in stays as it is.
- `api-errors` › *One field error per field*: the check order.
- `text-length` › *Invalid characters are rejected*: the forbidden character check.

## Impact

- **Code**: `src/features/auth/utils/emailFormat.ts` and its tests, and `src/features/auth/utils/registerForm.ts` and its tests. The register screen tests get the new scenarios.
- **Dependencies**: none.
- **Docs**: none.
- **Not touched**: the log in screen, translations, `core`, the backend and mobile.
