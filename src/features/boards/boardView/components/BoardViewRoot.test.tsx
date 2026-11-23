import { act, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderBoardView } from '../testing/renderBoardView'
import { CARDIGAN_BOARD_ID } from '../testing/sampleBoardContent'

describe('BoardViewRoot', () => {
  it('loads the board and shows its columns and cards', async () => {
    const { content, loaded } = await renderBoardView()

    await loaded()

    expect(
      content()
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(['To do', 'In progress', 'Review', 'Done'])
    expect(
      content().getByRole('button', {
        name: 'CRD-118, Decide card ordering: fractional ranks vs. integer positions, labels api',
      }),
    ).toBeInTheDocument()
  })

  it('shows the header from the board list while the board loads', async () => {
    let release = () => {}
    const { appBar, content } = await renderBoardView({
      withBoardList: true,
      prepare: ({ boardView }) => {
        release = boardView.holdNext('loadBoard')
      },
    })

    expect(appBar().getByRole('heading', { name: 'Cardigan v1' }))
    expect(screen.queryByRole('button', { name: 'Board actions' })).toBeNull()
    await act(async () => release())
    expect(
      await content().findByRole('region', { name: 'To do' }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: 'Board actions' }),
    ).toHaveLength(2)
  })

  it('shows the load error and loads again with Try again', async () => {
    const { user, content, loaded } = await renderBoardView({
      prepare: ({ boardView }) =>
        boardView.failNext('loadBoard', { kind: 'other' }),
    })

    await content().findByRole('heading', { name: 'Couldn’t load this board' })
    await user.click(content().getByRole('button', { name: 'Try again' }))

    expect(await loaded()).toBeInTheDocument()
  })

  it('loads again with Refresh from the error state', async () => {
    const { user, content, loaded, refreshButton } = await renderBoardView({
      prepare: ({ boardView }) =>
        boardView.failNext('loadBoard', { kind: 'other' }),
    })

    await content().findByRole('heading', { name: 'Couldn’t load this board' })
    await user.click(refreshButton())

    expect(await loaded()).toBeInTheDocument()
  })

  it('opens a card with Enter on its tile', async () => {
    const { user, content, loaded, onOpenCard } = await renderBoardView()
    await loaded()

    content()
      .getByRole('button', { name: /^CRD-121, Define export file format v1/ })
      .focus()
    await user.keyboard('{Enter}')

    expect(onOpenCard).toHaveBeenCalledWith(
      '40000000-0000-4000-8000-000000000121',
    )
  })

  it('calls onNotFound without a toast when the first load finds no board', async () => {
    const { onNotFound, onBoardGone } = await renderBoardView({
      boardId: 'missing',
    })

    await waitFor(() => expect(onNotFound).toHaveBeenCalled())
    expect(onBoardGone).not.toHaveBeenCalled()
    expect(screen.queryByText('This board no longer exists.')).toBeNull()
  })

  it('goes to the board list with a toast when a refresh finds no board', async () => {
    const { user, boards, loaded, refreshButton, onBoardGone, onNotFound } =
      await renderBoardView()
    await loaded()
    await act(() => boards.deleteBoard(CARDIGAN_BOARD_ID))

    await user.click(refreshButton())

    await waitFor(() => expect(onBoardGone).toHaveBeenCalledTimes(1))
    expect(screen.getByText('This board no longer exists.')).toBeInTheDocument()
    expect(onNotFound).not.toHaveBeenCalled()
  })

  it('calls onBack from the phone back button', async () => {
    const { user, appBar, loaded, onBack } = await renderBoardView()
    await loaded()

    await user.click(appBar().getByRole('button', { name: 'Back' }))

    expect(onBack).toHaveBeenCalled()
  })

  it('has no Refresh in the phone app bar content', async () => {
    const { appBar, loaded } = await renderBoardView()
    await loaded()

    expect(appBar().getByText('CRD · 12 cards')).toBeInTheDocument()
    expect(appBar().queryByRole('button', { name: 'Refresh' })).toBeNull()
  })

  it('gives icon-only and composite controls their accessible names', async () => {
    const { content, appBar, loaded } = await renderBoardView()
    await loaded()

    expect(appBar().getByRole('button', { name: 'Back' })).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: 'Board actions' }),
    ).toHaveLength(2)
    expect(
      content().getByRole('button', { name: 'Actions for column “Review”' }),
    ).toBeInTheDocument()
    expect(
      content().getByRole('button', { name: 'Add card to “Review”' }),
    ).toBeInTheDocument()
    expect(
      content().getByRole('button', { name: 'Add column' }),
    ).toBeInTheDocument()
    expect(
      content().getByRole('button', {
        name: 'CRD-104, Import fails on a board with an empty column, labels api, bug',
      }),
    ).toBeInTheDocument()
    expect(
      content().getByRole('button', {
        name: 'CRD-102, CMP project scaffolding with CI, labels infra, mobile',
      }),
    ).toBeInTheDocument()
  })

  it('names a tile without labels by its display ID and title only', async () => {
    const { content, loaded } = await renderBoardView({
      prepare: ({ boardView: fake }) =>
        fake.changeBoard(CARDIGAN_BOARD_ID, (columns) =>
          columns.map((column) => ({
            ...column,
            cards: column.cards.map((card) =>
              card.number === 121 ? { ...card, labels: [] } : card,
            ),
          })),
        ),
    })
    await loaded()

    expect(
      content().getByRole('button', {
        name: 'CRD-121, Define export file format v1',
      }),
    ).toBeInTheDocument()
  })
})
