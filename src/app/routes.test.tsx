import { createRootRouteWithContext, createRoute } from '@tanstack/react-router'
import { act, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppBar, AppBarSlot } from '@/core/ui'
import { renderAppAt, renderRouteTreeAt } from './renderAppAt'
import type { RouterContext } from './router'
import { Route as realRoot } from './routes/__root'
import { AppShell } from './shell/AppShell'

function testRouteTree() {
  const root = createRootRouteWithContext<RouterContext>()({
    component: realRoot.options.component,
    notFoundComponent: realRoot.options.notFoundComponent,
  })
  const shell = createRoute({
    getParentRoute: () => root,
    id: '_authenticated',
    component: AppShell,
  })
  const index = createRoute({
    getParentRoute: () => shell,
    path: '/',
    component: () => <p>Index page</p>,
  })
  const throwing = createRoute({
    getParentRoute: () => shell,
    path: '/throws',
    component: () => {
      throw new Error('Render failed')
    },
  })
  const withBar = createRoute({
    getParentRoute: () => shell,
    path: '/with-bar',
    component: () => (
      <AppBarSlot>
        <AppBar type="title" title="Page bar" />
      </AppBarSlot>
    ),
  })
  return root.addChildren([shell.addChildren([index, throwing, withBar])])
}

function sidebarNav() {
  return screen.findByRole('navigation', { name: 'Main' })
}

describe('routes', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the shell with the sidebar at /', async () => {
    renderAppAt('/')

    expect(await sidebarNav()).toBeInTheDocument()
    expect(screen.getByText('Cardigan')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeEmptyDOMElement()
  })

  it('renders a blank page at an unknown path and keeps the URL', async () => {
    const { router } = renderAppAt('/does-not-exist')

    await act(() => router.load())

    expect(router.state.location.pathname).toBe('/does-not-exist')
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
  })

  it('keeps the shell when a page throws and recovers on the next page', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { router } = renderRouteTreeAt(testRouteTree(), '/throws')

    const nav = await sidebarNav()
    expect(screen.getByRole('main')).toBeEmptyDOMElement()

    await act(() => router.navigate({ to: '/' }))

    expect(
      within(screen.getByRole('main')).getByText('Index page'),
    ).toBeInTheDocument()
    expect(await sidebarNav()).toBe(nav)
  })

  it("shows a page's AppBarSlot content in the bar region, not in main", async () => {
    renderRouteTreeAt(testRouteTree(), '/with-bar')

    const bar = await screen.findByRole('heading', { name: 'Page bar' })

    expect(within(screen.getByRole('main')).queryByRole('banner')).toBeNull()
    expect(bar.closest('main')).toBeNull()
    expect(bar.closest('aside')).toBeNull()
  })
})
