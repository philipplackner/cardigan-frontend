import { commonResources, initI18n } from '@/core/i18n/i18n'
import transfer from '@/features/transfer/i18n/en.json'

export const resources = {
  ...commonResources,
  transfer,
}

initI18n(resources)
