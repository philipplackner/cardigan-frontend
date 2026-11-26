import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Icon } from './Icon'
import { AlertIcon } from './icons'

describe('Icon', () => {
  it('is an image named by its label when a label is given', () => {
    render(<Icon icon={AlertIcon} label="Error" />)

    expect(screen.getByRole('img', { name: 'Error' })).toBeInTheDocument()
  })

  it('is hidden from assistive technology without a label', () => {
    const { container } = render(<Icon icon={AlertIcon} />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })
})
