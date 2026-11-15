import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('keeps a type utility next to a text color', () => {
    expect(cn('type-body', 'text-text-muted')).toBe('type-body text-text-muted')
  })

  it('keeps the later of two Figma spacing steps', () => {
    expect(cn('p-12', 'p-8')).toBe('p-8')
  })

  it('keeps the later of two type utilities, including raw styles with a dot', () => {
    expect(cn('type-body', 'type-sans-13.5-medium-145')).toBe(
      'type-sans-13.5-medium-145',
    )
  })

  it('merges named size tokens with numeric steps', () => {
    expect(cn('min-h-control-sm', 'min-h-control-touch')).toBe(
      'min-h-control-touch',
    )
    expect(cn('w-sidebar-tablet', 'w-12')).toBe('w-12')
  })

  it('merges numeric radius tokens', () => {
    expect(cn('rounded-6', 'rounded-full')).toBe('rounded-full')
  })

  it('merges named shadow tokens', () => {
    expect(cn('shadow-small', 'shadow-focus-accent')).toBe(
      'shadow-focus-accent',
    )
  })

  it('keeps phone overrides separate from the base size', () => {
    expect(cn('min-h-control-md', 'phone:min-h-control-touch')).toBe(
      'min-h-control-md phone:min-h-control-touch',
    )
  })
})
