import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AddCardButton } from './AddCardButton'

describe('AddCardButton', () => {
  it('does not submit a surrounding form', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <AddCardButton label="Add card" />
      </form>,
    )

    await user.click(screen.getByRole('button', { name: 'Add card' }))

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
