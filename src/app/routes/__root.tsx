import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { BlankPage } from '../BlankPage'
import type { RouterContext } from '../router'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
  notFoundComponent: BlankPage,
})
