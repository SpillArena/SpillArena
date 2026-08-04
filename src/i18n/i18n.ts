import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import no from './locales/no.json'
import { readPreference } from '../lib/cookieConsent'

export const SUPPORTED_LANGUAGES = [
    { code: 'no', label: 'Norsk' },
    { code: 'en', label: 'English' },
] as const

function detectBrowserLanguage(): string {
    if (typeof navigator === 'undefined') return 'en'
    const supported = new Set(SUPPORTED_LANGUAGES.map((l) => l.code as string))
    const candidates = navigator.languages?.length ? navigator.languages : [navigator.language]
    for (const raw of candidates) {
        if (!raw) continue
        const base = raw.toLowerCase().split('-')[0]
        const code = base === 'nb' || base === 'nn' ? 'no' : base
        if (supported.has(code)) return code
    }
    return 'en'
}

const savedLanguage = readPreference('lang') ?? detectBrowserLanguage()

void i18n.use(initReactI18next).init({
    resources: {
        no: { translation: no },
        en: { translation: en },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
})

export default i18n
