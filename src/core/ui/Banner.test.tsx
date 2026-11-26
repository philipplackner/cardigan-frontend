import { render, screen } from '@testing-library/react'
import type { ComponentType } from 'react'
import { describe, expect, it } from 'vitest'
import { Banner } from './Banner'
import { AlertIcon, InfoIcon } from './icons'

function drawingOf(Svg: ComponentType) {
  return render(<Svg />).container.querySelector('svg')!.innerHTML
}

describe('Banner', () => {
  it.each([
    ['error', AlertIcon],
    ['info', InfoIcon],
  ] as const)('shows the matching icon for type %s', (type, expectedIcon) => {
    const expected = drawingOf(expectedIcon)
    render(<Banner type={type}>Message</Banner>)

    const banner = screen.getByText('Message').parentElement!
    expect(banner.querySelector('svg')!.innerHTML).toBe(expected)
  })
})
