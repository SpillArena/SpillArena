import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const storedLanguage =
    typeof window !== 'undefined' ? window.localStorage.getItem('language') : null

void i18n.use(initReactI18next).init({
    resources: {
        no: {
            translation: {
                appName: 'SpillArena',
                headerTitle: 'Arenaen hvor spillene dine samles',
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
                developedBy: 'Utviklet av {{name}}',

                // Spillspesifikke oversettelser
                fleetBotTitle: 'FleetBot',
                fleetBotDescription:
                    'Battleship - plasser skipene dine og senk motstanderens flåte!',
                hangBotTitle: 'HangBot',
                hangBotDescription:
                    'Hangman - gjett bokstavene riktig før det er for sent!',
                scribbleBotTitle: 'ScribbleBot',
                scribbleBotDescription:
                    'Scribble.io - Der roboten tegner og du gjetter ordet!',
            },
        },
        en: {
            translation: {
                appName: 'SpillArena',
                headerTitle: 'The Arena where your games are gathered',
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
                developedBy: 'Developed by {{name}}',

                // Game-specific translations
                fleetBotTitle: 'FleetBot',
                fleetBotDescription:
                    'Battleship - place your ships and sink the opponent\'s fleet!',
                hangBotTitle: 'HangBot',
                hangBotDescription:
                    'Hangman - guess the letters right before it\'s too late!',
                scribbleBotTitle: 'ScribbleBot',
                scribbleBotDescription:
                    'Scribble.io - Where the bot draws and you guess the word!',
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
