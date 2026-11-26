import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

function PlusIcon(props: ComponentProps<'svg'>) {
  return <svg data-testid="button-icon" {...props} />
}

describe('Button', () => {
  it('renders as a button with its label', () => {
    render(<Button>Save</Button>)

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('reports clicks', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not submit its form unless it is a submit button', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <Button>Cancel</Button>
      </form>,
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('reports itself as busy and ignores clicks and form submission while loading', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const onSubmit = vi.fn()
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <input aria-label="Name" />
        <Button type="submit" isLoading onClick={onClick}>
          Save
        </Button>
      </form>,
    )
    const button = screen.getByRole('button', { name: 'Save' })

    await user.click(button)
    await user.type(screen.getByRole('textbox', { name: 'Name' }), '{Enter}')

    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(onClick).not.toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('renders its child element with the button behavior when asChild is set', () => {
    render(
      <Button asChild>
        <a href="/boards">Boards</a>
      </Button>,
    )

    const link = screen.getByRole('link', { name: 'Boards' })
    expect(link).toHaveAttribute('href', '/boards')
    expect(link).not.toHaveAttribute('type')
  })
  it('is neither busy nor disabled when idle', () => {
    render(<Button>Save</Button>)

    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).not.toHaveAttribute('aria-busy')
    expect(button).not.toHaveAttribute('aria-disabled')
  })

  it('shows its icon when idle and only the spinner while loading', () => {
    const { rerender } = render(<Button icon={PlusIcon}>Add</Button>)
    expect(screen.getByTestId('button-icon')).toBeInTheDocument()

    rerender(
      <Button icon={PlusIcon} isLoading>
        Add
      </Button>,
    )

    expect(screen.queryByTestId('button-icon')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Add' }).querySelector('svg'),
    ).not.toBeNull()
  })
})
