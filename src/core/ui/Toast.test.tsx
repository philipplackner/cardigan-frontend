import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from './Toast'
import { useToast, type ToastOptions } from './ToastContext'

function ShowButton({ toast }: { toast: ToastOptions }) {
  const { show } = useToast()
  return (
    <button type="button" onClick={() => show(toast)}>
      Show {toast.message}
    </button>
  )
}

function renderToasts(...toasts: ToastOptions[]) {
  render(
    <ToastProvider closeLabel="Close">
      {toasts.map((toast) => (
        <ShowButton key={toast.message} toast={toast} />
      ))}
    </ToastProvider>,
  )
}

afterEach(() => {
  vi.useRealTimers()
})

describe('ToastProvider', () => {
  it('shows a toast through useToast', async () => {
    const user = userEvent.setup()
    renderToasts({ type: 'success', message: 'Board saved' })

    await user.click(screen.getByRole('button', { name: 'Show Board saved' }))

    expect(await screen.findByText('Board saved')).toBeInTheDocument()
  })

  it.each([
    ['error', 'assertive'],
    ['success', 'polite'],
  ] as const)('announces a %s toast as %s', async (type, live) => {
    const user = userEvent.setup()
    renderToasts({ type, message: 'Board saved' })

    await user.click(screen.getByRole('button', { name: 'Show Board saved' }))

    const announcements = await screen.findAllByRole('status')
    expect(
      announcements.some(
        (element) => element.getAttribute('aria-live') === live,
      ),
    ).toBe(true)
    expect(
      announcements.some(
        (element) =>
          element.getAttribute('aria-live') ===
          (live === 'assertive' ? 'polite' : 'assertive'),
      ),
    ).toBe(false)
  })

  it('closes a success toast after 4 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderToasts({ type: 'success', message: 'Board saved' })

    await user.click(screen.getByRole('button', { name: 'Show Board saved' }))
    act(() => vi.advanceTimersByTime(3900))

    expect(screen.getByText('Board saved')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(200))

    expect(screen.queryByText('Board saved')).not.toBeInTheDocument()
  })

  it('keeps an error toast open', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderToasts({ type: 'error', message: 'Saving failed' })

    await user.click(screen.getByRole('button', { name: 'Show Saving failed' }))
    act(() => vi.advanceTimersByTime(60_000))

    expect(screen.getByText('Saving failed')).toBeInTheDocument()
  })

  it('restarts the auto-close time when a new toast replaces the one showing', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderToasts(
      { type: 'success', message: 'Board saved' },
      { type: 'success', message: 'Card moved' },
    )

    await user.click(screen.getByRole('button', { name: 'Show Board saved' }))
    act(() => vi.advanceTimersByTime(3000))
    await user.click(screen.getByRole('button', { name: 'Show Card moved' }))
    act(() => vi.advanceTimersByTime(3000))

    expect(screen.getByText('Card moved')).toBeInTheDocument()
  })

  it('makes useToast fail with a clear message outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() =>
      render(<ShowButton toast={{ type: 'success', message: 'Saved' }} />),
    ).toThrow('useToast must be used inside ToastProvider')
  })
})
