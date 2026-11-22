type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void

/**
 * Replaces `IntersectionObserver`, which jsdom lacks, with one the test drives. `report` sends an
 * entry to every observer.
 */
export function installIntersectionObserverStub() {
  const callbacks = new Set<ObserverCallback>()
  class StubIntersectionObserver {
    readonly callback: ObserverCallback
    constructor(callback: ObserverCallback) {
      this.callback = callback
    }
    observe() {
      callbacks.add(this.callback)
    }
    unobserve() {}
    disconnect() {
      callbacks.delete(this.callback)
    }
    takeRecords() {
      return []
    }
  }
  const original = window.IntersectionObserver
  window.IntersectionObserver =
    StubIntersectionObserver as unknown as typeof IntersectionObserver
  return {
    report(entry: Partial<IntersectionObserverEntry>) {
      for (const callback of callbacks) callback([entry])
    },
    restore() {
      window.IntersectionObserver = original
    },
  }
}
