import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('renders the router at the current URL inside the toast provider', async () => {
    render(<App />)

    expect(
      await screen.findByRole('navigation', { name: 'Main' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: /notifications/i }),
    ).toBeInTheDocument()
  })
})
