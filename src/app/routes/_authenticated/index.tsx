import { createFileRoute } from '@tanstack/react-router'
import { BlankPage } from '../../BlankPage'

// Temporary until the board list replaces this route.
export const Route = createFileRoute('/_authenticated/')({
  component: BlankPage,
})
