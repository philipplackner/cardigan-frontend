import i18next from 'i18next'
import auth from '../i18n/en.json'

/** The real English `auth` translations for unit tests, without the app's i18n setup. */
export function createTestT() {
  const instance = i18next.createInstance()
  void instance.init({
    lng: 'en',
    resources: { en: { auth } },
    ns: ['auth'],
    defaultNS: 'auth',
    interpolation: { escapeValue: false },
    initAsync: false,
  })
  return instance.getFixedT('en', 'auth')
}
