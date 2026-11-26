import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BoardIcon, BoardsIcon, PlusIcon } from './icons'
import { NavItem } from './NavItem'
import { Sidebar } from './Sidebar'

describe('Sidebar', () => {
  it('renders only the brand and an empty navigation when nothing else is given', () => {
    render(<Sidebar brandName="Cardigan" navLabel="Main navigation" />)

    expect(screen.getByText('Cardigan')).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(nav).toBeEmptyDOMElement()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders every block when all slots are filled', async () => {
    const onLogOut = vi.fn()
    render(
      <Sidebar
        brandName="Cardigan"
        navLabel="Main navigation"
        mainNav={<NavItem label="All boards" icon={BoardsIcon} href="/" />}
        boardsHeading="Boards"
        boards={<NavItem label="Roadmap" icon={BoardIcon} href="/boards/1" />}
        boardsAction={
          <NavItem label="New board" icon={PlusIcon} isDim asChild>
            <button type="button" />
          </NavItem>
        }
        account={{
          initial: 'P',
          email: 'p@example.com',
          logOutLabel: 'Log out',
          onLogOut,
        }}
      />,
    )

    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(
      within(nav).getByRole('link', { name: 'All boards' }),
    ).toBeInTheDocument()
    expect(
      within(nav).getByRole('heading', { name: 'Boards' }),
    ).toBeInTheDocument()
    expect(
      within(nav).getByRole('link', { name: 'Roadmap' }),
    ).toBeInTheDocument()
    expect(
      within(nav).getByRole('button', { name: 'New board' }),
    ).toBeInTheDocument()
    expect(screen.getByText('p@example.com')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Log out' }))

    expect(onLogOut).toHaveBeenCalledOnce()
  })

  it('shows the Boards heading when only the boards action is given', () => {
    render(
      <Sidebar
        brandName="Cardigan"
        navLabel="Main navigation"
        boardsHeading="Boards"
        boardsAction={
          <NavItem label="New board" icon={PlusIcon} isDim asChild>
            <button type="button" />
          </NavItem>
        }
      />,
    )

    expect(screen.getByRole('heading', { name: 'Boards' })).toBeInTheDocument()
  })

  it('hides the email and the avatar initial while they are unknown', () => {
    render(
      <Sidebar
        brandName="Cardigan"
        navLabel="Main navigation"
        account={{
          initial: null,
          email: null,
          logOutLabel: 'Log out',
          onLogOut: vi.fn(),
        }}
      />,
    )

    const logOut = screen.getByRole('button', { name: 'Log out' })
    const footer = logOut.parentElement!
    expect(footer).toHaveTextContent(/^$/)
    expect(logOut).toBeInTheDocument()
  })

  // An empty wrapper would still take a flex gap below the heading.
  it('renders only the heading and the action when there are no boards', () => {
    render(
      <Sidebar
        brandName="Cardigan"
        navLabel="Main navigation"
        boardsHeading="Boards"
        boardsAction={
          <NavItem label="New board" icon={PlusIcon} isDim asChild>
            <button type="button" />
          </NavItem>
        }
      />,
    )

    const heading = screen.getByRole('heading', { name: 'Boards' })
    expect(heading.nextElementSibling).toBe(
      screen.getByRole('button', { name: 'New board' }),
    )
  })

  it('shows the Boards heading when only boards are given', () => {
    render(
      <Sidebar
        brandName="Cardigan"
        navLabel="Main navigation"
        boardsHeading="Boards"
        boards={<NavItem label="Roadmap" icon={BoardIcon} href="/boards/1" />}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Boards' })).toBeInTheDocument()
  })
})
