import i18next, { type Resource } from 'i18next'
import { initReactI18next } from 'react-i18next'
import common from './en/common.json'

export const commonResources = { common }

/** Initializes i18next once with bundled English resources. Namespaces come from the app layer. */
export function initI18n(namespaces: Resource[string]) {
  if (i18next.isInitialized) return i18next
  void i18next.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: { en: namespaces },
    defaultNS: 'common',
    ns: Object.keys(namespaces),
    // React escapes rendered text, so escaping here would show "R&D" as "R&amp;D".
    interpolation: { escapeValue: false },
    initAsync: false,
  })
  return i18next
}
