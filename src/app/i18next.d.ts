import 'i18next'
import type { resources } from './i18n'

declare module 'i18next' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- module augmentation only merges into an interface
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: typeof resources
  }
}
