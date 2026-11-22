import { commonResources, initI18n } from '@/core/i18n/i18n'
import auth from '@/features/auth/i18n/en.json'
import transfer from '@/features/transfer/i18n/en.json'

export const resources = {
  ...commonResources,
  auth,
  transfer,
}

initI18n(resources)
