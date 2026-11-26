import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
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

describe('Dialog with returnFocus={false}', () => {
  it('leaves focus where the screen put it after closing', async () => {
    const user = userEvent.setup()
    function ScreenMovesFocus() {
      const [open, setOpen] = useState(false)
      const [wasClosed, setWasClosed] = useState(false)
      useEffect(() => {
        if (wasClosed) document.getElementById('kept')?.focus()
      }, [wasClosed])
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open</Button>
          <input aria-label="Kept field" id="kept" />
          <Dialog
            open={open}
            onOpenChange={setOpen}
            returnFocus={false}
            title="Title"
            actions={
              <Button
                onClick={() => {
                  setOpen(false)
                  setWasClosed(true)
                }}
              >
                Keep editing
              </Button>
            }
          />
        </>
      )
    }
    render(<ScreenMovesFocus />)

    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.click(
      await screen.findByRole('button', { name: 'Keep editing' }),
    )

    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Kept field' })).toHaveFocus(),
    )
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.getByRole('textbox', { name: 'Kept field' })).toHaveFocus()
  })
})

describe('Dialog with type progress', () => {
  it('stays open on Escape', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <Dialog
        open
        onOpenChange={onOpenChange}
        type="progress"
        title="Importing board"
      />,
    )
    const dialog = await screen.findByRole('dialog', {
      name: 'Importing board',
    })

    await user.keyboard('{Escape}')

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(dialog).toHaveAttribute('aria-busy', 'true')
  })

  it('closes on Escape when it is a default dialog', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Dialog open onOpenChange={onOpenChange} title="Rename board" />)
    const dialog = await screen.findByRole('dialog')
    expect(dialog).not.toHaveAttribute('aria-busy')

    await user.keyboard('{Escape}')

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('Dialog without description, content and actions', () => {
  it('has no description reference', async () => {
    render(<Dialog open onOpenChange={() => {}} title="Rename board" />)

    expect(await screen.findByRole('dialog')).not.toHaveAttribute(
      'aria-describedby',
    )
  })

  // An empty wrapper would still take a flex gap below the title.
  it('renders nothing after the title', async () => {
    render(<Dialog open onOpenChange={() => {}} title="Rename board" />)
    await screen.findByRole('dialog')

    expect(
      screen.getByRole('heading', { name: 'Rename board' }).nextElementSibling,
    ).toBeNull()
  })
})
