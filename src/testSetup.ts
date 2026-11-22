import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import '@/app/i18n'

// jsdom doesn't implement scrollTo, which the router calls on every navigation.
window.scrollTo = () => {}

afterEach(() => {
  cleanup()
})
