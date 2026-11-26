import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppBar } from './AppBar'
import { ArrowLeftIcon } from './icons'
import { IconButton } from './IconButton'

const back = <IconButton icon={ArrowLeftIcon} label="Back" />

describe('AppBar', () => {
  it('shows the title, subtitle and leading control of a title bar', () => {
    render(
      <AppBar type="title" title="Roadmap" subtitle="CRD" leading={back} />,
    )

    expect(screen.getByRole('heading', { name: 'Roadmap' })).toBeInTheDocument()
    expect(screen.getByText('CRD')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
  })

  // An empty wrapper would still take a flex gap in the bar.
  it('renders only the title block when the optional parts are missing', () => {
    render(<AppBar type="title" title="Roadmap" />)

    expect(screen.getByRole('banner').children).toHaveLength(1)
    expect(
      screen.getByRole('heading', { name: 'Roadmap' }).nextElementSibling,
    ).toBeNull()
  })

  it('places a centered title directly in the bar', () => {
    render(<AppBar type="centered" title="Settings" leading={back} />)

    expect(
      screen.getByRole('heading', { name: 'Settings' }).parentElement,
    ).toBe(screen.getByRole('banner'))
  })
})
