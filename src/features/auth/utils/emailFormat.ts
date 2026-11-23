const ATEXT = /^[A-Za-z0-9!#$%&'*+\-/=?^_`{|}~]$/

function isAtext(char: string) {
  return ATEXT.test(char)
}

/** RFC 5322 `qtext`: printable ASCII except `"` and `\`. */
function isQtext(code: number) {
  return (
    code === 33 || (code >= 35 && code <= 91) || (code >= 93 && code <= 126)
  )
}

/** RFC 5322 `dtext`: printable ASCII except `[`, `]` and `\`. */
function isDtext(code: number) {
  return (code >= 33 && code <= 90) || (code >= 94 && code <= 126)
}

function isDotAtom(value: string) {
  if (value === '' || value.startsWith('.') || value.endsWith('.')) return false
  let previousWasDot = false
  for (const char of value) {
    if (char === '.') {
      if (previousWasDot) return false
      previousWasDot = true
    } else if (isAtext(char)) {
      previousWasDot = false
    } else {
      return false
    }
  }
  return true
}

/** Returns the index after the closing quote, or -1 if `value` doesn't start with a valid quoted string. */
function quotedStringEnd(value: string) {
  let index = 1
  while (index < value.length) {
    const code = value.charCodeAt(index)
    if (code === 34) return index + 1
    if (code === 92) {
      // A quoted pair may escape a space, but not a tab: control characters fail the format.
      const escaped = value.charCodeAt(index + 1)
      if (!(escaped >= 32 && escaped <= 126)) return -1
      index += 2
    } else if (isQtext(code)) {
      index += 1
    } else {
      return -1
    }
  }
  return -1
}

function isDomainLiteral(value: string) {
  if (!value.startsWith('[') || !value.endsWith(']') || value.length < 2) {
    return false
  }
  for (let index = 1; index < value.length - 1; index++) {
    if (!isDtext(value.charCodeAt(index))) return false
  }
  return true
}

/**
 * Checks the RFC 5322 `addr-spec` syntax (section 3.4.1) without comments, folding whitespace or
 * obsolete forms, ASCII only, as shared `domain-user` requires. Runs in linear time.
 */
export function isAddrSpec(value: string): boolean {
  let domainStart: number
  if (value.startsWith('"')) {
    const end = quotedStringEnd(value)
    if (end === -1 || value[end] !== '@') return false
    domainStart = end + 1
  } else {
    const at = value.lastIndexOf('@')
    if (at === -1 || !isDotAtom(value.slice(0, at))) return false
    domainStart = at + 1
  }
  const domain = value.slice(domainStart)
  return isDotAtom(domain) || isDomainLiteral(domain)
}
