import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../cn'

type AppLayoutProps = {
  /** Shown from tablet up. 224 px on tablet, 248 px on desktop. */
  sidebar: ReactNode
  /** Shown on phones instead of the sidebar. */
  appBar: ReactNode
  /** Optional side panel. 420 px on tablet, 452 px on desktop, full screen on phones. */
  panel?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * The app shell. Which regions show is decided by the theme's phone, tablet and desktop variants only.
 * On a phone an open panel covers the screen and everything behind it is inert.
 */
export function AppLayout({
  sidebar,
  appBar,
  panel,
  children,
  className,
}: AppLayoutProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [isPanelOverlay, setIsPanelOverlay] = useState(false)
  const hasPanel = panel != null

  useEffect(() => {
    const element = panelRef.current
    if (!hasPanel || !element) {
      setIsPanelOverlay(false)
      return
    }
    // The panel is fixed only under the phone variant, so its position tells us without repeating the breakpoints.
    const update = () =>
      setIsPanelOverlay(getComputedStyle(element).position === 'fixed')
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [hasPanel])

  return (
    <div
      className={cn('flex h-dvh w-full min-w-[0] bg-background-app', className)}
    >
      <div
        inert={isPanelOverlay || undefined}
        className="flex min-h-[0] min-w-[0] flex-1 phone:flex-col"
      >
        <div className="hidden shrink-0 phone:block">{appBar}</div>
        <aside className="w-sidebar-tablet shrink-0 phone:hidden desktop:w-sidebar-desktop">
          {sidebar}
        </aside>
        <main className="min-h-[0] min-w-[0] flex-1 overflow-auto">
          {children}
        </main>
      </div>
      {hasPanel && (
        <div
          ref={panelRef}
          className="w-panel-tablet shrink-0 phone:fixed phone:inset-[0] phone:z-40 phone:w-auto desktop:w-panel-desktop"
        >
          {panel}
        </div>
      )}
    </div>
  )
}
