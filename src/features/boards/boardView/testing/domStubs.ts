/** jsdom lacks `ResizeObserver`, which `TextArea` uses to fit its height. Observing does nothing here. */
export function installResizeObserverStub() {
  if (typeof globalThis.ResizeObserver === 'function') return
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

export type ScrollCall = { element: Element; options: unknown }

/**
 * jsdom lacks `scrollIntoView`. Installs a stub on `Element.prototype` that records each call and
 * returns the recorded calls.
 */
export function installScrollIntoViewStub() {
  const calls: ScrollCall[] = []
  Element.prototype.scrollIntoView = function (options?: unknown) {
    calls.push({ element: this, options })
  }
  return calls
}
