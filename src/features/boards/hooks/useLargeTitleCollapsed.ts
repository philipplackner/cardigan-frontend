import { useEffect, useState, type RefObject } from 'react'

/**
 * Whether a large page title has scrolled completely out of view, so the app bar shows the title
 * instead. The browser clips the title by every scrolling ancestor, so this works whichever element
 * scrolls, without a scroll listener.
 */
export function useLargeTitleCollapsed(ref: RefObject<HTMLElement | null>) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const title = ref.current
    if (!title) return
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1)
        if (entry) setIsCollapsed(!entry.isIntersecting)
      },
      { threshold: 0 },
    )
    observer.observe(title)
    return () => observer.disconnect()
  }, [ref])

  return isCollapsed
}
