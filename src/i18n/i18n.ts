import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import no from './locales/no.json'

export const SUPPORTED_LANGUAGES = [
    { code: 'no', label: 'Norsk' },
    { code: 'en', label: 'English' },
] as const

const storedLanguage =
    typeof window !== 'undefined'
        ? window.localStorage.getItem('portfolio-lang') ?? window.localStorage.getItem('language')
        : null

const systemLanguage = typeof navigator !== 'undefined' ? navigator.language : 'en'
const defaultLanguage = systemLanguage.startsWith('no') ? 'no' : 'en'

void i18n.use(initReactI18next).init({
    resources: {
        no: { translation: no },
        en: { translation: en },
    },
    lng: storedLanguage || defaultLanguage,
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
})

export default i18n
