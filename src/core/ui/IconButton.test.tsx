import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { IconButton } from './IconButton'
import { CloseIcon } from './icons'

describe('IconButton', () => {
  it('is named by its label', () => {
    render(<IconButton icon={CloseIcon} label="Close panel" />)

    expect(
      screen.getByRole('button', { name: 'Close panel' }),
    ).toBeInTheDocument()
  })

  it('does not submit its form by default', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <IconButton icon={CloseIcon} label="Clear" />
      </form>,
    )

    await user.click(screen.getByRole('button', { name: 'Clear' }))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits its form when it is a submit button', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <IconButton icon={CloseIcon} label="Send" type="submit" />
      </form>,
    )

    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(onSubmit).toHaveBeenCalledOnce()
  })
})
