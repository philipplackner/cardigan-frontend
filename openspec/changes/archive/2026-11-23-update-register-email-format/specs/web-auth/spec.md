# Spec Delta

## MODIFIED Requirements

### Requirement: Register email check
Before sending, the register form SHALL check that the email is filled in, contains no character forbidden by `text-length`, has a normalized length of at most 254 and has a valid `domain-user` email format, in that order. It SHALL show only the first error: "Enter your email.", "Enter a valid email address." (forbidden character), "Email can't be longer than 254 characters." or "Enter a valid email address." (format).

#### Scenario: Missing domain
- **WHEN** the user submits the register form with the email `ann@`
- **THEN** no request is sent and the email field shows "Enter a valid email address."

#### Scenario: Single-label domain
- **WHEN** the user submits the register form with the email `mail@pl-coding`
- **THEN** no request is sent and the email field shows "Enter a valid email address."

#### Scenario: Address that RFC 5322 allowed
- **WHEN** the user submits the register form with `"ann lee"@example.com`, `ann@[192.168.0.1]` or `jürgen@münchen.de`
- **THEN** no request is sent and the email field shows "Enter a valid email address."

#### Scenario: Subdomains
- **WHEN** the user registers with `ann@a.b.example.co.uk`
- **THEN** the email passes the check

#### Scenario: Email over the limit
- **WHEN** the email has a normalized length of 255
- **THEN** the email field shows "Email can't be longer than 254 characters."

#### Scenario: Forbidden character before the limit
- **WHEN** the email has a normalized length of 255 and contains a tab
- **THEN** the email field shows "Enter a valid email address."

#### Scenario: Email with surrounding spaces
- **WHEN** the user registers with `  Ann@Example.com `
- **THEN** the email passes the check and is sent as `Ann@Example.com`, trimmed with its case kept
