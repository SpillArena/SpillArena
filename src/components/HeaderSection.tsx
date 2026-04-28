
import { ChevronDown, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface HeaderSectionProps {
    isDark: boolean
    setIsDark: (value: boolean | ((prev: boolean) => boolean)) => void
}

export default function HeaderSection({ isDark, setIsDark }: HeaderSectionProps) {
    const { i18n, t } = useTranslation()
        const currentLanguage = i18n.resolvedLanguage?.startsWith('no') ? 'no' : 'en'

    const changeLanguage = (language: 'no' | 'en') => {
        void i18n.changeLanguage(language)
        window.localStorage.setItem('language', language)
    }

    return (
        <header className="flex items-center justify-between rounded-3xl border border-fuchsia-200/70 bg-white/70 px-6 py-5 shadow-[0_8px_40px_-20px_rgba(0,0,0,0.35)] backdrop-blur-md dark:border-fuchsia-900/60 dark:bg-slate-900/70 sm:px-8 sm:py-6">
            <div>
                <h1 className="text-2xl font-semibold sm:text-3xl md:text-4xl">{t('appName')}</h1>
                <p className="text-base text-slate-600 dark:text-slate-300 sm:text-lg">{t('headerTitle')}</p>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative">
                    <select
                        aria-label={t('languageLabel')}
                        value={currentLanguage}
                        onChange={(e) => changeLanguage(e.target.value as 'no' | 'en')}
                        className="appearance-none rounded-full border border-slate-300 bg-white pl-3 pr-10 py-2.5 text-sm font-semibold text-slate-700 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 cursor-pointer"
                    >
                        <option value="no">🇳🇴 Norsk</option>
                        <option value="en">🇬🇧 English</option>
                    </select>
                    <ChevronDown
                        className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500 dark:text-slate-300"
                        aria-hidden="true"
                    />
                </div>
                <button
                    type="button"
                    onClick={() => setIsDark((c) => !c)}
                    aria-label={isDark ? t('switchToLight') : t('switchToDark')}
                    className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                    {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
                </button>
            </div>
        </header>
    )
}