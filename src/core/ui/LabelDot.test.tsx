import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LabelDot } from './LabelDot'

describe('LabelDot', () => {
  it('renders a dot hidden from assistive technology', () => {
    const { container } = render(<LabelDot color="blue" />)

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})
