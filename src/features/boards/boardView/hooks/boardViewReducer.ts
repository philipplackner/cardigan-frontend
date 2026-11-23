import { normalizeText } from '@/core/utils/text'

/** An inline form: a quick add in a column, or the add column form. */
export type InlineTarget =
  { kind: 'quickAdd'; columnId: string } | { kind: 'addColumn' }

export type BoardViewDialog =
  | { kind: 'renameColumn'; columnId: string }
  | { kind: 'deleteColumn'; columnId: string }
  | { kind: 'renameBoard' }
  | { kind: 'deleteBoard' }
  | { kind: 'discardInline'; target: InlineTarget }

/** Where the screen moves focus next. `id` changes with every request, so a repeated target refocuses. */
export type FocusTarget =
  | { kind: 'quickAdd' }
  | { kind: 'addColumn' }
  | { kind: 'addCard'; columnId: string; scroll: boolean }
  | { kind: 'columnMenu'; columnId: string }
  | { kind: 'addColumnButton' }

export type BoardViewUiState = {
  quickAdd: { columnId: string; text: string; submitted: boolean } | null
  addColumn: { text: string; submitted: boolean } | null
  dialog: BoardViewDialog | null
  movingColumnId: string | null
  focusRequest: { target: FocusTarget; id: number } | null
}

export const initialBoardViewUiState: BoardViewUiState = {
  quickAdd: null,
  addColumn: null,
  dialog: null,
  movingColumnId: null,
  focusRequest: null,
}

export type BoardViewUiAction =
  | { type: 'inlineOpen'; target: InlineTarget }
  | { type: 'quickAddChange'; text: string }
  | { type: 'quickAddSubmit' }
  | { type: 'quickAddAdded' }
  | { type: 'addColumnChange'; text: string }
  | { type: 'addColumnSubmit' }
  | { type: 'addColumnAdded'; columnId: string }
  | { type: 'inlineClose' }
  | { type: 'discardConfirm' }
  | { type: 'discardKeep' }
  | {
      type: 'dialogOpen'
      dialog: Exclude<BoardViewDialog, { kind: 'discardInline' }>
    }
  | { type: 'dialogClose'; focus?: FocusTarget }
  | { type: 'moveStart'; columnId: string }
  | { type: 'moveEnd' }
  | { type: 'columnsChanged'; columnIds: readonly string[] }

const isBlank = (text: string) => normalizeText(text, 'singleLine') === ''

function openText(state: BoardViewUiState) {
  return state.quickAdd?.text ?? state.addColumn?.text ?? ''
}

function withFocus(
  state: BoardViewUiState,
  target: FocusTarget,
): BoardViewUiState {
  return {
    ...state,
    focusRequest: { target, id: (state.focusRequest?.id ?? 0) + 1 },
  }
}

/** Opens the target form empty, closing the other one. Both forms share one slot (WBV-24). */
function open(state: BoardViewUiState, target: InlineTarget): BoardViewUiState {
  const opened: BoardViewUiState =
    target.kind === 'quickAdd'
      ? {
          ...state,
          quickAdd: { columnId: target.columnId, text: '', submitted: false },
          addColumn: null,
        }
      : {
          ...state,
          quickAdd: null,
          addColumn: { text: '', submitted: false },
        }
  return withFocus(opened, { kind: target.kind })
}

const isSameForm = (state: BoardViewUiState, target: InlineTarget) =>
  target.kind === 'quickAdd'
    ? state.quickAdd?.columnId === target.columnId
    : state.addColumn !== null

export function boardViewReducer(
  state: BoardViewUiState,
  action: BoardViewUiAction,
): BoardViewUiState {
  switch (action.type) {
    case 'inlineOpen': {
      if (isSameForm(state, action.target)) {
        return withFocus(state, { kind: action.target.kind })
      }
      if (isBlank(openText(state))) return open(state, action.target)
      return {
        ...state,
        dialog: { kind: 'discardInline', target: action.target },
      }
    }
    case 'quickAddChange':
      return state.quickAdd
        ? { ...state, quickAdd: { ...state.quickAdd, text: action.text } }
        : state
    case 'quickAddSubmit':
      return state.quickAdd
        ? { ...state, quickAdd: { ...state.quickAdd, submitted: true } }
        : state
    case 'quickAddAdded':
      return state.quickAdd
        ? withFocus(
            {
              ...state,
              quickAdd: { ...state.quickAdd, text: '', submitted: false },
            },
            { kind: 'quickAdd' },
          )
        : state
    case 'addColumnChange':
      return state.addColumn
        ? { ...state, addColumn: { ...state.addColumn, text: action.text } }
        : state
    case 'addColumnSubmit':
      return state.addColumn
        ? { ...state, addColumn: { ...state.addColumn, submitted: true } }
        : state
    case 'addColumnAdded':
      return withFocus(
        { ...state, addColumn: null },
        { kind: 'addCard', columnId: action.columnId, scroll: true },
      )
    case 'inlineClose':
      return { ...state, quickAdd: null, addColumn: null }
    case 'discardConfirm':
      return state.dialog?.kind === 'discardInline'
        ? open({ ...state, dialog: null }, state.dialog.target)
        : state
    case 'discardKeep': {
      if (state.dialog?.kind !== 'discardInline') return state
      const kept = state.quickAdd ? 'quickAdd' : 'addColumn'
      return withFocus({ ...state, dialog: null }, { kind: kept })
    }
    case 'dialogOpen':
      return { ...state, dialog: action.dialog }
    case 'dialogClose': {
      const closed = { ...state, dialog: null }
      return action.focus ? withFocus(closed, action.focus) : closed
    }
    case 'moveStart':
      return { ...state, movingColumnId: action.columnId }
    case 'moveEnd':
      return { ...state, movingColumnId: null }
    case 'columnsChanged': {
      const exists = (columnId: string) => action.columnIds.includes(columnId)
      const quickAdd =
        state.quickAdd && exists(state.quickAdd.columnId)
          ? state.quickAdd
          : null
      const dialog = state.dialog
      const isDialogGone =
        dialog !== null &&
        ((dialog.kind === 'renameColumn' && !exists(dialog.columnId)) ||
          (dialog.kind === 'deleteColumn' && !exists(dialog.columnId)) ||
          (dialog.kind === 'discardInline' &&
            ((dialog.target.kind === 'quickAdd' &&
              !exists(dialog.target.columnId)) ||
              (state.quickAdd !== null && quickAdd === null))))
      if (quickAdd === state.quickAdd && !isDialogGone) return state
      return { ...state, quickAdd, dialog: isDialogGone ? null : dialog }
    }
  }
}
