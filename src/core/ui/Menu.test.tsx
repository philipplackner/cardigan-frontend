import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { IconButton } from './IconButton'
import { EditIcon, MoreIcon } from './icons'
import { Menu, MenuItem } from './Menu'

async function openMenu(menu: ReactNode) {
  const user = userEvent.setup()
  render(menu)
  await user.click(screen.getByRole('button', { name: 'Board menu' }))
  return screen.findByRole('menu')
}

const trigger = <IconButton icon={MoreIcon} label="Board menu" />

describe('Menu', () => {
  it('aligns to the end of the trigger by default', async () => {
    const menu = await openMenu(
      <Menu trigger={trigger}>
        <MenuItem label="Rename" />
      </Menu>,
    )

    expect(menu).toHaveAttribute('data-align', 'end')
  })

  it('shows an icon only for items that have one', async () => {
    await openMenu(
      <Menu trigger={trigger}>
        <MenuItem label="Rename" icon={EditIcon} />
        <MenuItem label="Archive" />
      </Menu>,
    )

    expect(
      screen.getByRole('menuitem', { name: 'Rename' }).querySelector('svg'),
    ).not.toBeNull()
    expect(
      screen.getByRole('menuitem', { name: 'Archive' }).querySelector('svg'),
    ).toBeNull()
  })
})
