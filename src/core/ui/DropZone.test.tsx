import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DropZone } from './DropZone'

function renderDropZone(onFiles = vi.fn()) {
  render(
    <DropZone
      title="Drop a board export here"
      overTitle="Release to import"
      hintPrefix="or "
      browseLabel="browse files"
      onFiles={onFiles}
    />,
  )
  return screen.getByText('Drop a board export here').parentElement!
}

const fileDrag = (files: File[] = []) => ({
  dataTransfer: { types: ['Files'], files, dropEffect: 'none' },
})

const textDrag = () => ({
  dataTransfer: { types: ['text/plain'], files: [], dropEffect: 'none' },
})

function fileInput() {
  return document.querySelector<HTMLInputElement>('input[type="file"]')!
}

describe('DropZone', () => {
  it('shows the over title without the hint while a file is dragged over', () => {
    const zone = renderDropZone()

    fireEvent.dragEnter(zone, fileDrag())

    expect(screen.getByText('Release to import')).toBeVisible()
    expect(screen.queryByText('Drop a board export here')).toBeNull()
    expect(screen.getByRole('button', { hidden: true })).not.toBeVisible()
  })

  it('restores the default content when the file leaves', () => {
    const zone = renderDropZone()

    fireEvent.dragEnter(zone, fileDrag())
    fireEvent.dragLeave(zone, fileDrag())

    expect(screen.getByText('Drop a board export here')).toBeVisible()
    expect(screen.queryByText('Release to import')).toBeNull()
    expect(screen.getByRole('button', { name: 'browse files' })).toBeVisible()
  })

  it('ignores drags without files', () => {
    const zone = renderDropZone()

    fireEvent.dragEnter(zone, { dataTransfer: { types: ['text/plain'] } })

    expect(screen.getByText('Drop a board export here')).toBeVisible()
  })

  it('hands over only the first dropped file and returns to default', () => {
    const onFiles = vi.fn()
    const zone = renderDropZone(onFiles)
    const a = new File(['{}'], 'a.json')
    const b = new File(['{}'], 'b.json')

    fireEvent.dragEnter(zone, fileDrag())
    fireEvent.drop(zone, fileDrag([a, b]))

    expect(onFiles).toHaveBeenCalledExactlyOnceWith([a])
    expect(screen.getByText('Drop a board export here')).toBeVisible()
  })

  it('accepts a file drag so the browser allows dropping it', () => {
    const zone = renderDropZone()
    const over = fileDrag()

    expect(fireEvent.dragEnter(zone, fileDrag())).toBe(false)
    expect(fireEvent.dragOver(zone, over)).toBe(false)
    expect(over.dataTransfer.dropEffect).toBe('copy')
  })

  it('leaves drags without files to the browser', () => {
    const zone = renderDropZone()
    const over = textDrag()

    expect(fireEvent.dragEnter(zone, textDrag())).toBe(true)
    expect(fireEvent.dragOver(zone, over)).toBe(true)
    expect(over.dataTransfer.dropEffect).toBe('none')
    expect(fireEvent.drop(zone, textDrag())).toBe(true)
  })

  it('stays in the over state while the file moves between child elements', () => {
    const zone = renderDropZone()
    const child = screen.getByText('Drop a board export here')

    fireEvent.dragEnter(zone, fileDrag())
    fireEvent.dragEnter(child, fileDrag())
    fireEvent.dragLeave(child, fileDrag())

    expect(screen.getByText('Release to import')).toBeVisible()

    fireEvent.dragLeave(zone, fileDrag())

    expect(screen.getByText('Drop a board export here')).toBeVisible()
  })

  it('ignores a drag without files leaving while a file is over', () => {
    const zone = renderDropZone()

    fireEvent.dragEnter(zone, fileDrag())
    fireEvent.dragLeave(zone, textDrag())

    expect(screen.getByText('Release to import')).toBeVisible()
  })

  it('ignores a drop without files while a file is over', () => {
    const onFiles = vi.fn()
    const zone = renderDropZone(onFiles)

    fireEvent.dragEnter(zone, fileDrag())
    fireEvent.drop(zone, textDrag())

    expect(screen.getByText('Release to import')).toBeVisible()
    expect(onFiles).not.toHaveBeenCalled()
  })

  it('stops the browser from opening a dropped file', () => {
    const zone = renderDropZone()

    expect(fireEvent.drop(zone, fileDrag([new File(['{}'], 'a.json')]))).toBe(
      false,
    )
  })

  it('does not hand over anything when the drop has no file', () => {
    const onFiles = vi.fn()
    const zone = renderDropZone(onFiles)

    fireEvent.dragEnter(zone, fileDrag())
    fireEvent.drop(zone, fileDrag([]))

    expect(onFiles).not.toHaveBeenCalled()
    expect(screen.getByText('Drop a board export here')).toBeVisible()
  })

  it('opens the file picker from the browse button', async () => {
    const user = userEvent.setup()
    renderDropZone()
    const pickerOpened = vi.fn()
    fileInput().addEventListener('click', pickerOpened)

    await user.click(screen.getByRole('button', { name: 'browse files' }))

    expect(pickerOpened).toHaveBeenCalledOnce()
  })

  it('hands over the chosen file', async () => {
    const user = userEvent.setup()
    const onFiles = vi.fn()
    renderDropZone(onFiles)
    const file = new File(['{}'], 'board.json')

    await user.upload(fileInput(), file)

    expect(onFiles).toHaveBeenCalledExactlyOnceWith([file])
  })

  it('does not hand over anything when the picker is closed without a file', () => {
    const onFiles = vi.fn()
    renderDropZone(onFiles)

    fireEvent.change(fileInput(), { target: { files: [] } })

    expect(onFiles).not.toHaveBeenCalled()
  })

  it('keeps the hidden file input out of the tab order', async () => {
    const user = userEvent.setup()
    renderDropZone()

    await user.tab()

    expect(screen.getByRole('button', { name: 'browse files' })).toHaveFocus()
  })
})
