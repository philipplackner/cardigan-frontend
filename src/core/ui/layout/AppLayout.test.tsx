import { fireEvent, render, screen } from '@testing-library/react'
import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { AppLayout } from './AppLayout'

let phoneStyle: HTMLStyleElement | null = null

// jsdom ignores media queries, so a plain rule stands in for the phone variant applying.
function enterPhoneLayout() {
  phoneStyle = document.createElement('style')
  phoneStyle.textContent = '.phone\\:fixed { position: fixed; }'
  document.head.append(phoneStyle)
}

function leavePhoneLayout() {
  phoneStyle?.remove()
  phoneStyle = null
}

afterEach(leavePhoneLayout)

function Layout({ panel }: { panel?: ReactNode }) {
  return (
    <AppLayout
      sidebar={<nav aria-label="Boards" />}
      appBar={<header>App bar</header>}
      panel={panel}
    >
      <button type="button">Board content</button>
    </AppLayout>
  )
}

const cardPanel = <section aria-label="Card details" />

function isInert(element: Element) {
  return element.closest('[inert]') !== null
}

function content() {
  return screen.getByRole('button', { name: 'Board content' })
}

describe('AppLayout', () => {
  it('shows the sidebar, app bar, content and panel', () => {
    render(<Layout panel={cardPanel} />)

    expect(screen.getByRole('navigation', { name: 'Boards' })).toBeVisible()
    expect(screen.getByRole('banner')).toHaveTextContent('App bar')
    expect(screen.getByRole('main')).toContainElement(content())
    expect(
      screen.getByRole('region', { name: 'Card details' }),
    ).toBeInTheDocument()
  })

  it('keeps the content usable next to the panel on larger screens', () => {
    render(<Layout panel={cardPanel} />)

    expect(isInert(content())).toBe(false)
  })

  it('makes everything behind the panel inert when the panel covers a phone screen', () => {
    enterPhoneLayout()
    render(<Layout panel={cardPanel} />)

    expect(isInert(content())).toBe(true)
    expect(isInert(screen.getByRole('region', { name: 'Card details' }))).toBe(
      false,
    )
  })

  it('keeps the content usable on a phone without a panel', () => {
    enterPhoneLayout()
    render(<Layout />)

    expect(isInert(content())).toBe(false)
  })

  it('makes the content inert when a panel opens on a phone and usable again when it closes', () => {
    enterPhoneLayout()
    const { rerender } = render(<Layout />)

    rerender(<Layout panel={cardPanel} />)
    expect(isInert(content())).toBe(true)

    rerender(<Layout />)
    expect(isInert(content())).toBe(false)
  })

  it('follows the window when it crosses the phone size', () => {
    render(<Layout panel={cardPanel} />)

    enterPhoneLayout()
    fireEvent(window, new Event('resize'))
    expect(isInert(content())).toBe(true)

    leavePhoneLayout()
    fireEvent(window, new Event('resize'))
    expect(isInert(content())).toBe(false)
  })

  it('does not make the content inert on the first paint', () => {
    const inertOnFirstPaint: boolean[] = []
    function Probe() {
      const ref = useRef<HTMLParagraphElement>(null)
      useLayoutEffect(() => {
        if (ref.current) inertOnFirstPaint.push(isInert(ref.current))
      }, [])
      return <p ref={ref}>Probe</p>
    }

    render(
      <AppLayout sidebar={null} appBar={null} panel={cardPanel}>
        <Probe />
      </AppLayout>,
    )

    expect(inertOnFirstPaint).toEqual([false])
  })
})
