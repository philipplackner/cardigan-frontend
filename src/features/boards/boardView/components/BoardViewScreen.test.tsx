import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AppBarSlotProvider, AppBarSlotTarget } from '@/core/ui'
import { initialBoardViewUiState } from '../hooks/boardViewReducer'
import type { BoardViewState } from '../hooks/useBoardViewModel'
import type { BoardCard, BoardColumn, BoardDetail } from '../types'
import { BoardViewScreen } from './BoardViewScreen'

const card = (
  number: number,
  position: number,
  labels: BoardCard['labels'] = [],
): BoardCard => ({
  id: `card-${number}`,
  number,
  title: `Card ${number}`,
  position,
  labels,
})

const column = (
  id: string,
  name: string,
  position: number,
  cards: BoardCard[] = [],
): BoardColumn => ({ id, name, position, cards })

const board = (columns: BoardColumn[]): BoardDetail => ({
  id: 'board',
  name: 'Cardigan v1',
  key: 'CRD',
  columns,
})

function stateFor(
  status: BoardViewState['status'],
  header: BoardViewState['header'] = { name: 'Cardigan v1', key: 'CRD' },
): BoardViewState {
  return {
    status,
    header,
    isRefreshing: false,
    ui: initialBoardViewUiState,
    isInlineSaving: false,
  }
}

function renderScreen(state: BoardViewState) {
  const onAction = vi.fn()
  render(
    <AppBarSlotProvider>
      <div data-testid="app-bar">
        <AppBarSlotTarget />
      </div>
      <BoardViewScreen state={state} onAction={onAction} />
    </AppBarSlotProvider>,
  )
  return {
    onAction,
    appBar: () => within(screen.getByTestId('app-bar')),
    content: () => within(screen.getByTestId('board-content')),
  }
}

const ready = (detail: BoardDetail) =>
  stateFor({ type: 'ready', board: detail })

describe('BoardViewScreen', () => {
  it('shows columns and cards in the order they are given, which the view model sorts by position', () => {
    const { content } = renderScreen(
      ready(
        board([
          column('a', 'To do', 0, [card(1, 0), card(2, 1)]),
          column('b', 'In progress', 1),
          column('c', 'Done', 2),
        ]),
      ),
    )

    expect(
      content()
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(['To do', 'In progress', 'Done'])
    expect(
      content()
        .getAllByRole('button', { name: /^CRD-/ })
        .map((tile) => tile.getAttribute('aria-label')),
    ).toEqual(['CRD-1, Card 1', 'CRD-2, Card 2'])
  })

  it('shows the display ID, the title and the labels sorted by name', () => {
    const { content } = renderScreen(
      ready(
        board([
          column('a', 'To do', 0, [
            {
              ...card(118, 0),
              title: 'Decide card ordering',
              labels: [
                { id: '1', name: 'frontend', color: 'teal' },
                { id: '2', name: 'Bug', color: 'red' },
                { id: '3', name: 'api', color: 'blue' },
              ],
            },
          ]),
        ]),
      ),
    )

    const tile = content().getByRole('button', {
      name: 'CRD-118, Decide card ordering, labels api, Bug, frontend',
    })
    expect(tile).toHaveTextContent('CRD-118')
    expect(tile).toHaveTextContent('Decide card ordering')
    expect(tile.textContent).toMatch(/apiBugfrontend$/)
  })

  it.each([
    [0, undefined, 'CRD'],
    [1, '1 card', 'CRD · 1 card'],
    [12, '12 cards', 'CRD · 12 cards'],
  ])(
    'shows %i cards in the header and the phone subtitle',
    (count, headerText, subtitle) => {
      const cards = Array.from({ length: count }, (_, index) =>
        card(index + 1, index),
      )
      const { appBar } = renderScreen(
        ready(board([column('a', 'To do', 0, cards)])),
      )

      const pageHeader = screen
        .getAllByRole('banner')
        .find((element) => !screen.getByTestId('app-bar').contains(element))!
      if (headerText) expect(pageHeader).toHaveTextContent(headerText)
      else expect(pageHeader).not.toHaveTextContent(/cards?\b/)
      expect(appBar().getByText(subtitle)).toBeInTheDocument()
    },
  )

  it('shows “No cards yet” in empty columns', () => {
    const { content } = renderScreen(
      ready(
        board([
          column('a', 'To do', 0),
          column('b', 'In progress', 1),
          column('c', 'Done', 2),
        ]),
      ),
    )

    expect(content().getAllByText('No cards yet')).toHaveLength(3)
    expect(
      content().getByRole('button', { name: 'Add card to “Done”' }),
    ).toBeInTheDocument()
  })

  it('shows the empty state for a board without columns', () => {
    const { content } = renderScreen(ready(board([])))

    expect(
      content().getByRole('heading', { name: 'This board has no columns' }),
    ).toBeInTheDocument()
    expect(
      content().getByText('Add a column to start adding cards.'),
    ).toBeInTheDocument()
    expect(
      content().getByRole('button', { name: 'Add column' }),
    ).toBeInTheDocument()
  })

  it('shows skeletons, the known name and Refresh while loading, without menu or count', () => {
    const { content, appBar } = renderScreen(stateFor({ type: 'loading' }))

    expect(
      screen.getByTestId('board-content').querySelector('[aria-busy="true"]'),
    ).not.toBeNull()
    expect(content().queryByRole('heading')).toBeNull()
    expect(
      screen.getAllByRole('heading', { name: 'Cardigan v1' }),
    ).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Board actions' })).toBeNull()
    expect(appBar().getByText('CRD')).toBeInTheDocument()
  })

  it('shows no title while loading a board the list doesn’t know', () => {
    renderScreen(stateFor({ type: 'loading' }, null))

    expect(screen.queryByRole('heading', { name: 'Cardigan v1' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
  })

  it('shows the load error with Try again', () => {
    const { content, onAction } = renderScreen(stateFor({ type: 'error' }))

    expect(
      content().getByRole('heading', { name: 'Couldn’t load this board' }),
    ).toBeInTheDocument()
    expect(
      content().getByText('Check your connection and try again.'),
    ).toBeInTheDocument()
    content().getByRole('button', { name: 'Try again' }).click()
    expect(onAction).toHaveBeenCalledWith({ type: 'tryAgain' })
  })

  it('has no Refresh in the phone app bar content', () => {
    const { appBar } = renderScreen(ready(board([column('a', 'To do', 0)])))

    expect(appBar().getByRole('button', { name: 'Back' })).toBeInTheDocument()
    expect(
      appBar().getByRole('button', { name: 'Board actions' }),
    ).toBeInTheDocument()
    expect(appBar().queryByRole('button', { name: 'Refresh' })).toBeNull()
  })

  it('marks Refresh busy while refreshing', () => {
    renderScreen({
      ...ready(board([column('a', 'To do', 0)])),
      isRefreshing: true,
    })

    expect(screen.getByRole('button', { name: 'Refresh' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
  })
})
