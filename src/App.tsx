import { useEffect, useState } from 'react'
import { ChevronDown, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { games } from './data/games'
import PageCard from './components/PageCard'

function App() {
  const { i18n, t } = useTranslation()
  const currentLanguage = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'no'

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false

    if (
      document.documentElement.classList.contains('dark') ||
      document.body.classList.contains('dark')
    ) return true

    const savedTheme = window.localStorage.getItem('theme')
    if (savedTheme === 'dark') return true
    if (savedTheme === 'light') return false

    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document.body.classList.toggle('dark', isDark)
    window.localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const changeLanguage = (language: 'no' | 'en') => {
    void i18n.changeLanguage(language)
    window.localStorage.setItem('language', language)
  }

  const handleGameClick = (route: string) => {
    const selectedGame = games.find((game) => game.route === route)
    if (!selectedGame?.liveUrl) {
      return
    }

    window.open(selectedGame.liveUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(90%_90%_at_10%_0%,#f3d7ff_0%,#fdf4ff_45%,#ffe4f3_100%)] px-6 py-8 text-slate-800 transition-colors duration-300 dark:bg-[radial-gradient(90%_90%_at_10%_0%,#2a0f37_0%,#1a1129_45%,#0a0613_100%)] dark:text-slate-200 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">

        {/* Header */}
        <header className="flex items-center justify-between rounded-3xl border border-fuchsia-200/70 bg-white/70 px-5 py-4 shadow-[0_8px_40px_-20px_rgba(0,0,0,0.35)] backdrop-blur-md dark:border-fuchsia-900/60 dark:bg-slate-900/70">
          <div>
            <h1 className="text-xl font-semibold sm:text-2xl">{t('appName')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                aria-label={t('languageLabel')}
                value={currentLanguage}
                onChange={(e) => changeLanguage(e.target.value as 'no' | 'en')}
                className="appearance-none rounded-full border border-slate-300 bg-white pl-2 pr-9 py-2 text-xs font-semibold text-slate-700 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 cursor-pointer"
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
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </header>

        {/* Spill */}
        <section>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-700 dark:text-fuchsia-300">
            {t('gamesLabel', 'Spill')}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <PageCard key={game.id} game={game} onClick={handleGameClick} />
            ))}
          </div>
        </section>

        <footer className="pt-2 text-center text-[11px] text-slate-500/70 dark:text-slate-400/70">
          {t('developedBy', { name: 'Emil Berglund' })} ·{' '}
          <a
            href="https://github.com/EmilB04"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 transition hover:text-fuchsia-700 hover:underline dark:hover:text-fuchsia-300"
          >
            GitHub
          </a>
        </footer>

      </div>
    </main>
  )
}

export default App