import { useEffect, useState } from 'react'

function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }

    const savedTheme = window.localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      return true
    }
    if (savedTheme === 'light') {
      return false
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    window.localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <main className="min-h-screen bg-[radial-gradient(90%_90%_at_10%_0%,#d5f7e8_0%,#f7fbf9_45%,#f3f8ff_100%)] px-6 py-8 text-slate-800 transition-colors duration-300 dark:bg-[radial-gradient(90%_90%_at_10%_0%,#0b2a1e_0%,#111827_45%,#05070d_100%)] dark:text-slate-200 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex items-center justify-between rounded-3xl border border-emerald-200/70 bg-white/70 px-5 py-4 shadow-[0_8px_40px_-20px_rgba(0,0,0,0.35)] backdrop-blur-md dark:border-emerald-900/60 dark:bg-slate-900/70">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
              SpillArena
            </p>
            <h1 className="text-xl font-semibold sm:text-2xl">Tailwind Theme Foundation</h1>
          </div>
          <button
            type="button"
            onClick={() => setIsDark((current) => !current)}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          >
            {isDark ? 'Switch to Light' : 'Switch to Dark'}
          </button>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-3xl border border-emerald-200/80 bg-white/85 p-7 shadow-[0_20px_50px_-30px_rgba(6,78,59,0.6)] backdrop-blur-sm dark:border-emerald-900/70 dark:bg-slate-900/85">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
              Status
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Base styling migrated to Tailwind
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              You now have a clean class-based dark mode setup with theme persistence.
            </p>
          </div>

          <aside className="rounded-3xl border border-sky-200/80 bg-sky-50/90 p-6 shadow-[0_16px_40px_-30px_rgba(2,132,199,0.8)] dark:border-sky-900/70 dark:bg-slate-900/85">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
              Theme Preview
            </h3>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                Surface
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-100 px-4 py-3 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100">
                Accent
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-100 px-4 py-3 text-sky-900 dark:border-sky-700 dark:bg-sky-900/40 dark:text-sky-100">
                Info
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}

export default App
