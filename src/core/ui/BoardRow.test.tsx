import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { BoardRow } from './BoardRow'
import { MoreIcon } from './icons'
import { IconButton } from './IconButton'

function renderRow(menu?: ReactNode) {
  render(
    <BoardRow
      name="Roadmap"
      keyValue="CRD"
      cardsText="12 cards"
      updatedText="2 hours ago"
      link={<a href="/b/1" />}
      menu={menu}
    />,
  )
  return screen.getByRole('article')
}

describe('BoardRow', () => {
  it('links the board name and shows the menu', () => {
    renderRow(<IconButton icon={MoreIcon} label="Board menu" />)

    expect(screen.getByRole('link', { name: 'Roadmap' })).toHaveAttribute(
      'href',
      '/b/1',
    )
    expect(
      screen.getByRole('button', { name: 'Board menu' }),
    ).toBeInTheDocument()
  })

  // An empty wrapper would still take a flex gap at the end of the row.
  it('renders only the board details without a menu', () => {
    expect(renderRow().children).toHaveLength(1)
  })
})
