import { fireEvent, render, screen } from '@testing-library/react'
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
})
