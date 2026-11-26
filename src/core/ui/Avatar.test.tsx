import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Avatar } from './Avatar'

describe('Avatar', () => {
  it('is an image named by its label when a label is given', () => {
    render(<Avatar initial="P" label="Philipp" />)

    expect(screen.getByRole('img', { name: 'Philipp' })).toHaveTextContent('P')
  })

  it('is hidden from assistive technology without a label', () => {
    render(<Avatar initial="P" />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('P')).toHaveAttribute('aria-hidden', 'true')
  })
})
