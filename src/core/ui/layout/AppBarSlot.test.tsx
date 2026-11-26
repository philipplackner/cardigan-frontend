import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { AppBarSlot, AppBarSlotProvider, AppBarSlotTarget } from './AppBarSlot'

function Shell({ children }: { children: ReactNode }) {
  return (
    <AppBarSlotProvider>
      <div data-testid="bar">
        <AppBarSlotTarget />
      </div>
      <main>{children}</main>
    </AppBarSlotProvider>
  )
}

function bar() {
  return screen.getByTestId('bar')
}

describe('AppBarSlot', () => {
  it('shows the slot content in the target, not where the page renders it', () => {
    render(
      <Shell>
        <AppBarSlot>
          <header>Boards bar</header>
        </AppBarSlot>
      </Shell>,
    )

    expect(within(bar()).getByRole('banner')).toHaveTextContent('Boards bar')
    expect(
      within(screen.getByRole('main')).queryByText('Boards bar'),
    ).not.toBeInTheDocument()
  })

  it('leaves the target empty when the page provides no bar', () => {
    render(
      <Shell>
        <p>Page without a bar</p>
      </Shell>,
    )

    expect(bar().firstElementChild).toBeEmptyDOMElement()
  })

  it('replaces the content when the page changes', () => {
    const { rerender } = render(
      <Shell>
        <AppBarSlot>
          <header>First page</header>
        </AppBarSlot>
      </Shell>,
    )

    rerender(
      <Shell>
        <AppBarSlot>
          <header>Second page</header>
        </AppBarSlot>
      </Shell>,
    )

    expect(bar()).toHaveTextContent('Second page')
    expect(bar()).not.toHaveTextContent('First page')
  })

  it('empties the target when the next page provides no bar', () => {
    const { rerender } = render(
      <Shell>
        <AppBarSlot>
          <header>First page</header>
        </AppBarSlot>
      </Shell>,
    )

    rerender(
      <Shell>
        <p>Second page</p>
      </Shell>,
    )

    expect(bar().firstElementChild).toBeEmptyDOMElement()
  })

  it('fails with a clear message outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() =>
      render(
        <AppBarSlot>
          <header>Boards bar</header>
        </AppBarSlot>,
      ),
    ).toThrow('AppBarSlot parts must be used inside AppBarSlotProvider')
  })
})
