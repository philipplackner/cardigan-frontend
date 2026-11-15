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

function DialogHandsOver() {
  const [step, setStep] = useState<'closed' | 'first' | 'second'>('closed')
  return (
    <>
      <Button onClick={() => setStep('first')}>Start</Button>
      <Dialog
        open={step === 'first'}
        onOpenChange={() => setStep('closed')}
        title="First"
        actions={<Button onClick={() => setStep('second')}>Next</Button>}
      />
      <Dialog
        open={step === 'second'}
        onOpenChange={() => setStep('closed')}
        title="Second"
        actions={<Button onClick={() => setStep('closed')}>Finish</Button>}
      />
    </>
  )
}

describe('Dialog', () => {
  it('returns focus to the original control when one dialog replaces another', async () => {
    const user = userEvent.setup()
    render(<DialogHandsOver />)

    await user.click(screen.getByRole('button', { name: 'Start' }))
    await user.click(await screen.findByRole('button', { name: 'Next' }))
    await user.click(await screen.findByRole('button', { name: 'Finish' }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Start' })).toHaveFocus(),
    )
  })

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
