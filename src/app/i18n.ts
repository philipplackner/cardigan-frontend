import { commonResources, initI18n } from '@/core/i18n/i18n'
import auth from '@/features/auth/i18n/en.json'
import boards from '@/features/boards/i18n/en.json'
import boardView from '@/features/boards/i18n/boardView.json'
import transfer from '@/features/transfer/i18n/en.json'

export const resources = {
  ...commonResources,
  auth,
  boards,
  boardView,
  transfer,
}

initI18n(resources)
