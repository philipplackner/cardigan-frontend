import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { MoreIcon } from './icons'
import { IconButton } from './IconButton'
import { Menu, MenuItem } from './Menu'

function MenuOpensDialog() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Menu trigger={<IconButton icon={MoreIcon} label="Board menu" />}>
        <MenuItem label="Rename board" onSelect={() => setOpen(true)} />
      </Menu>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Rename board"
        actions={<Button onClick={() => setOpen(false)}>Done</Button>}
      />
    </>
  )
}

describe('Dialog', () => {
  it('returns focus to the menu button when it was opened from a menu item', async () => {
    const user = userEvent.setup()
    render(<MenuOpensDialog />)

    await user.click(screen.getByRole('button', { name: 'Board menu' }))
    await user.click(
      await screen.findByRole('menuitem', { name: 'Rename board' }),
    )
    await user.click(await screen.findByRole('button', { name: 'Done' }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Board menu' })).toHaveFocus(),
    )
  })

  it('returns focus to the control that opened it', async () => {
    const user = userEvent.setup()
    function ButtonOpensDialog() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open</Button>
          <Dialog open={open} onOpenChange={setOpen} title="Title" />
        </>
      )
    }
    render(<ButtonOpensDialog />)

    await user.click(screen.getByRole('button', { name: 'Open' }))
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus(),
    )
  })
})
