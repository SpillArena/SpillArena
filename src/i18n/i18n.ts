import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import no from './locales/no.json'
import { readPreference } from '../lib/cookieConsent'

export const SUPPORTED_LANGUAGES = [
    { code: 'no', label: 'Norsk' },
    { code: 'en', label: 'English' },
] as const

// Public URLs are Norwegian first, including after JavaScript renders. Browser
// language detection would let an English browser/crawler replace the indexable
// Norwegian content and title at the very same canonical URL.
const preference = readPreference('lang')
const savedLanguage = preference === 'en' ? 'en' : 'no'

void i18n.use(initReactI18next).init({
    resources: {
        no: { translation: no },
        en: { translation: en },
    },
    lng: savedLanguage,
    fallbackLng: 'no',
    interpolation: {
        escapeValue: false,
    },
})

export default i18n
