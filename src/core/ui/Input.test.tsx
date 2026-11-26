import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it } from 'vitest'
import { Field } from './Field'
import { Input } from './Input'

function SearchIcon(props: ComponentProps<'svg'>) {
  return <svg data-testid="leading-icon" {...props} />
}

describe('Input', () => {
  it('is a valid control without description outside a field', () => {
    render(<Input aria-label="Search" />)

    const input = screen.getByRole('textbox', { name: 'Search' })
    expect(input).not.toBeInvalid()
    expect(input).not.toHaveAttribute('aria-describedby')
    expect(input).not.toHaveAttribute('id')
    expect(screen.queryByTestId('leading-icon')).not.toBeInTheDocument()
  })

  it('shows a decorative leading icon', () => {
    render(<Input aria-label="Search" leadingIcon={SearchIcon} />)

    expect(screen.getByTestId('leading-icon')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })

  it('takes its label, error and description from the field', () => {
    render(
      <Field
        label="Email"
        error="Enter an email"
        description="We never share it"
      >
        <Input />
      </Field>,
    )

    const input = screen.getByRole('textbox', { name: 'Email' })
    expect(input).toBeInvalid()
    expect(input).toHaveAccessibleDescription(
      'Enter an email We never share it',
    )
  })

  it('keeps a visually hidden field label as its accessible name', () => {
    render(
      <Field label="Search boards" isLabelHidden>
        <Input />
      </Field>,
    )

    const input = screen.getByRole('textbox', { name: 'Search boards' })
    expect(input).not.toBeInvalid()
    expect(input).not.toHaveAttribute('aria-describedby')
  })
})
