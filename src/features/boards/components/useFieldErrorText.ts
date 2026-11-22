import { useTranslation } from 'react-i18next'
import { boardKeyErrorMessageKey } from '@/core/utils/boardKey'
import { BOARD_NAME_MAX, nameErrorMessageKey } from '../utils/boardName'

/** Message for a name error code from `checkText` or the server. */
export function useNameErrorText() {
  const { t } = useTranslation()
  return (code: string, max = BOARD_NAME_MAX) =>
    t(nameErrorMessageKey(code), { n: max })
}

/** Message for a key error code from `checkBoardKey` or the server, including a used key. */
export function useKeyErrorText() {
  const { t } = useTranslation()
  return (code: string, key: string) =>
    code === 'ALREADY_USED'
      ? t('keyErrors.alreadyUsed', { key })
      : t(boardKeyErrorMessageKey(code))
}
