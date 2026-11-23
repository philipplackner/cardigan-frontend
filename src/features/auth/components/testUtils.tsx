import type { AuthResult } from '../types'

/** A request the test resolves itself, to look at the screen while it runs. */
export function deferredResult() {
  let resolve!: (result: AuthResult) => void
  const promise = new Promise<AuthResult>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

export function renderTestLink(label: string) {
  return <a href="#other">{label}</a>
}
