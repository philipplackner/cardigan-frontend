import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Field } from './Field'
import { TextArea } from './TextArea'

const PADDING = 16
const BORDER = 2
const CHAR_WIDTH = 10

const layout = { width: 300, lineHeight: 20 }

function lineCount(element: HTMLTextAreaElement) {
  const charsPerLine = Math.floor(layout.width / CHAR_WIDTH)
  return element.value
    .split('\n')
    .reduce(
      (count, line) =>
        count + Math.max(1, Math.ceil(line.length / charsPerLine)),
      0,
    )
}

function borderBoxHeight(element: HTMLTextAreaElement) {
  const height = element.style.height
  return height.endsWith('px')
    ? parseFloat(height)
    : layout.lineHeight + PADDING + BORDER
}

// jsdom has no layout. This models a one-row textarea whose content height follows its lines and width.
const layoutGetters: Record<string, (this: HTMLTextAreaElement) => number> = {
  offsetWidth() {
    return layout.width
  },
  offsetHeight() {
    return borderBoxHeight(this)
  },
  clientHeight() {
    return borderBoxHeight(this) - BORDER
  },
  scrollHeight() {
    return Math.max(
      lineCount(this) * layout.lineHeight + PADDING,
      borderBoxHeight(this) - BORDER,
    )
  },
}

const observers = new Set<FakeResizeObserver>()

class FakeResizeObserver {
  private readonly targets = new Set<Element>()
  private readonly callback: ResizeObserverCallback

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    observers.add(this)
  }

  observe(target: Element) {
    this.targets.add(target)
  }

  unobserve(target: Element) {
    this.targets.delete(target)
  }

  disconnect() {
    this.targets.clear()
  }

  notify() {
    if (this.targets.size === 0) return
    this.callback([], this as unknown as ResizeObserver)
  }
}

function resizeWidth(width: number) {
  layout.width = width
  for (const observer of observers) observer.notify()
}

function textbox(name = 'Notes') {
  return screen.getByRole<HTMLTextAreaElement>('textbox', { name })
}

function heightFor(lines: number) {
  return `${lines * layout.lineHeight + PADDING + BORDER}px`
}

beforeEach(() => {
  layout.width = 300
  layout.lineHeight = 20
  for (const [name, get] of Object.entries(layoutGetters)) {
    Object.defineProperty(HTMLTextAreaElement.prototype, name, {
      configurable: true,
      get,
    })
  }
  vi.stubGlobal('ResizeObserver', FakeResizeObserver)
})

afterEach(() => {
  for (const name of Object.keys(layoutGetters)) {
    Reflect.deleteProperty(HTMLTextAreaElement.prototype, name)
  }
  observers.clear()
  vi.unstubAllGlobals()
})

describe('TextArea height', () => {
  it('fits its height to the initial text', () => {
    render(<TextArea aria-label="Notes" defaultValue={'one\ntwo\nthree'} />)

    expect(textbox()).toHaveStyle({ height: heightFor(3) })
  })

  it('grows while the user types and still reports the input', async () => {
    const user = userEvent.setup()
    const onInput = vi.fn()
    render(<TextArea aria-label="Notes" onInput={onInput} />)
    expect(textbox()).toHaveStyle({ height: heightFor(1) })

    await user.type(textbox(), 'one{Enter}two')

    expect(textbox()).toHaveStyle({ height: heightFor(2) })
    expect(onInput).toHaveBeenCalled()
  })

  it('shrinks again when lines are removed', async () => {
    const user = userEvent.setup()
    render(<TextArea aria-label="Notes" />)
    await user.type(textbox(), 'one{Enter}two{Enter}three')

    await user.clear(textbox())

    expect(textbox()).toHaveStyle({ height: heightFor(1) })
  })

  it('fits again when its width changes and the text wraps differently', () => {
    render(<TextArea aria-label="Notes" defaultValue={'x'.repeat(60)} />)
    expect(textbox()).toHaveStyle({ height: heightFor(2) })

    resizeWidth(100)

    expect(textbox()).toHaveStyle({ height: heightFor(6) })
  })

  it('ignores size notifications that keep the width, such as its own height change', () => {
    render(<TextArea aria-label="Notes" defaultValue="short" />)
    const fittedHeight = textbox().style.height
    layout.lineHeight = 30

    resizeWidth(300)

    expect(textbox()).toHaveStyle({ height: fittedHeight })
  })

  it('fits again when the window resizes, since the font size can change without the width', () => {
    render(<TextArea aria-label="Notes" defaultValue="short" />)
    layout.lineHeight = 30

    fireEvent(window, new Event('resize'))

    expect(textbox()).toHaveStyle({ height: heightFor(1) })
  })

  it('stops fitting once unmounted', () => {
    const { unmount } = render(
      <TextArea aria-label="Notes" defaultValue={'x'.repeat(60)} />,
    )
    const element = textbox()
    const fittedHeight = element.style.height
    unmount()

    layout.lineHeight = 30
    fireEvent(window, new Event('resize'))
    resizeWidth(100)

    expect(element.style.height).toBe(fittedHeight)
  })
})

describe('TextArea refs', () => {
  it('hands the element to a callback ref and clears it on unmount', () => {
    const ref = vi.fn()
    const { unmount } = render(<TextArea aria-label="Notes" ref={ref} />)
    expect(ref).toHaveBeenLastCalledWith(textbox())

    unmount()

    expect(ref).toHaveBeenLastCalledWith(null)
  })

  it('fills an object ref and clears it on unmount', () => {
    const ref = createRef<HTMLTextAreaElement>()
    const { unmount } = render(<TextArea aria-label="Notes" ref={ref} />)
    expect(ref.current).toBe(textbox())

    unmount()

    expect(ref.current).toBeNull()
  })

  it('moves the element to a new ref when the ref changes', () => {
    const first = createRef<HTMLTextAreaElement>()
    const second = createRef<HTMLTextAreaElement>()
    const { rerender } = render(<TextArea aria-label="Notes" ref={first} />)

    rerender(<TextArea aria-label="Notes" ref={second} />)

    expect(second.current).toBe(textbox())
    expect(first.current).toBeNull()
  })
})

describe('TextArea states', () => {
  it('is a valid control without description outside a field', () => {
    render(<TextArea aria-label="Notes" />)

    expect(textbox()).not.toBeInvalid()
    expect(textbox()).not.toHaveAttribute('aria-describedby')
    expect(textbox()).not.toHaveAttribute('id')
  })

  it('reports the invalid state when asked to', () => {
    render(<TextArea aria-label="Notes" isInvalid />)

    expect(textbox()).toBeInvalid()
  })

  it('takes its label, error and description from the field', () => {
    render(
      <Field label="Notes" error="Too long" description="Markdown works">
        <TextArea />
      </Field>,
    )

    expect(textbox()).toBeInvalid()
    expect(textbox()).toHaveAccessibleDescription('Too long Markdown works')
  })

  it('lets an explicit isInvalid override the field error', () => {
    render(
      <Field label="Notes" error="Too long">
        <TextArea isInvalid={false} />
      </Field>,
    )

    expect(textbox()).not.toBeInvalid()
  })
})
