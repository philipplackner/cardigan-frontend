import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Card } from './Card'

describe('Card', () => {
  it('shows the display ID, title and label names', () => {
    render(
      <Card
        displayId="CRD-101"
        title="Fix login"
        labels={[
          { name: 'Bug', color: 'red' },
          { name: 'Backend', color: 'blue' },
        ]}
      />,
    )

    const card = screen.getByRole('button', { name: /Fix login/ })
    expect(card).toHaveTextContent('CRD-101')
    expect(card).toHaveTextContent('Bug')
    expect(card).toHaveTextContent('Backend')
  })

  // An empty label row would still take a flex gap below the title.
  it('renders nothing after the title without labels', () => {
    render(<Card displayId="CRD-101" title="Fix login" />)

    expect(screen.getByText('Fix login').nextElementSibling).toBeNull()
  })

  it('is not marked as current unless selected', () => {
    render(<Card displayId="CRD-101" title="Fix login" />)

    expect(screen.getByRole('button')).not.toHaveAttribute('aria-current')
  })

  it('is marked as current when selected', () => {
    render(<Card displayId="CRD-101" title="Fix login" isSelected />)

    expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'true')
  })

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
        <Card displayId="CRD-101" title="Fix login" />
      </form>,
    )

    await user.click(screen.getByRole('button'))

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
