import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './Button'
import { EmptyState } from './EmptyState'
import { BoardsIcon } from './icons'

describe('EmptyState', () => {
  it('shows the title, description and actions', () => {
    render(
      <EmptyState
        icon={BoardsIcon}
        title="No boards yet"
        description="Create a board to get started."
        actions={<Button>New board</Button>}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'No boards yet' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Create a board to get started.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'New board' }),
    ).toBeInTheDocument()
  })

  // An empty wrapper would still take a flex gap below the title.
  it('renders nothing after the title when description and actions are missing', () => {
    render(<EmptyState icon={BoardsIcon} title="No boards yet" />)

    expect(
      screen.getByRole('heading', { name: 'No boards yet' }).nextElementSibling,
    ).toBeNull()
  })
})
