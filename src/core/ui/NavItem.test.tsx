import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BoardIcon } from './icons'
import { NavItem } from './NavItem'

describe('NavItem', () => {
  it('shows the label and the board key', () => {
    render(
      <NavItem label="Roadmap" icon={BoardIcon} keyValue="CRD" href="/b/1" />,
    )

    expect(screen.getByRole('link', { name: /Roadmap/ })).toBeInTheDocument()
    expect(screen.getByText('CRD')).toBeInTheDocument()
  })

  it('ends with the label when there is no board key', () => {
    render(<NavItem label="Roadmap" icon={BoardIcon} href="/b/1" />)

    expect(screen.getByRole('link').lastElementChild).toHaveTextContent(
      /^Roadmap$/,
    )
  })

  it('is not marked as the current page unless selected', () => {
    render(<NavItem label="Roadmap" icon={BoardIcon} href="/b/1" />)

    expect(screen.getByRole('link')).not.toHaveAttribute('aria-current')
  })

  it('is marked as the current page when selected', () => {
    render(<NavItem label="Roadmap" icon={BoardIcon} href="/b/1" isSelected />)

    expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'page')
  })
})
