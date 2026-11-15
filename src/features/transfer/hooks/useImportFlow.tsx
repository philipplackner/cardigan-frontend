import { ImportScreen } from '../components/ImportScreen'
import { useImportViewModel, type ImportFlowParams } from './useImportViewModel'

/**
 * The import flow for any host control. The host calls `open` from its button or menu item and
 * renders `dialogs` outside any menu, because a menu's content unmounts when the menu closes.
 */
export function useImportFlow(params: ImportFlowParams) {
  const { state, onAction, open } = useImportViewModel(params)
  return { open, dialogs: <ImportScreen state={state} onAction={onAction} /> }
}
