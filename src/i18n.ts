import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const storedLanguage =
    typeof window !== 'undefined' ? window.localStorage.getItem('language') : null

void i18n.use(initReactI18next).init({
    resources: {
        no: {
            translation: {
                appName: 'SpillArena',
                headerTitle: 'Tailwind Temagrunnlag',
                switchToLight: 'Bytt til lys',
                switchToDark: 'Bytt til mørk',
                statusLabel: 'Status',
                statusTitle: 'Basisstil migrert til Tailwind',
                statusDescription:
                    'Du har nå et rent oppsett for mørk modus med lagret temavalg.',
                previewTitle: 'Forhåndsvisning av tema',
                surface: 'Flate',
                accent: 'Aksent',
                info: 'Info',
                languageLabel: 'Språk',
            },
        },
        en: {
            translation: {
                appName: 'SpillArena',
                headerTitle: 'Tailwind Theme Foundation',
                switchToLight: 'Switch to Light',
                switchToDark: 'Switch to Dark',
                statusLabel: 'Status',
                statusTitle: 'Base styling migrated to Tailwind',
                statusDescription:
                    'You now have a clean dark mode setup with persisted theme preference.',
                previewTitle: 'Theme Preview',
                surface: 'Surface',
                accent: 'Accent',
                info: 'Info',
                languageLabel: 'Language',
            },
        },
    },
    lng: storedLanguage === 'en' ? 'en' : 'no',
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
})

export default i18n
