import { useEffect, useState } from 'react'
import type { Game } from './data/games'
import HeaderSection from './components/HeaderSection'
import GamesSection from './components/GamesSection'
import BetaWarningModal from './components/BetaWarningModal'
import FooterSection from './components/FooterSection'


function App() {

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true

    if (
      document.documentElement.classList.contains('dark') ||
      document.body.classList.contains('dark')
    ) return true

    const savedTheme = window.localStorage.getItem('theme')
    if (savedTheme === 'dark') return true
    if (savedTheme === 'light') return false

    return true
  })

  const [betaWarningGame, setBetaWarningGame] = useState<Game | null>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document.body.classList.toggle('dark', isDark)
    window.localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const handleGameClick = (game: Game) => {
    if (game.beta) {
      setBetaWarningGame(game)
      return
    }

    if (!game.liveUrl) {
      return
    }

    window.location.assign(game.liveUrl)
  }

  const confirmBetaGame = () => {
    if (betaWarningGame?.liveUrl) {
      window.location.assign(betaWarningGame.liveUrl)
    }
    setBetaWarningGame(null)
  }

  const closeBetaWarning = () => {
    setBetaWarningGame(null)
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(90%_90%_at_10%_0%,#f3d7ff_0%,#fdf4ff_45%,#ffe4f3_100%)] px-6 py-8 text-slate-800 transition-colors duration-300 dark:bg-[radial-gradient(90%_90%_at_10%_0%,#2a0f37_0%,#1a1129_45%,#0a0613_100%)] dark:text-slate-200 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">

        {/* Header */}
        <HeaderSection isDark={isDark} setIsDark={setIsDark} />

        {/* Spill */}
        <GamesSection onClick={handleGameClick} />

        {/* Beta Warning Modal */}
        <BetaWarningModal game={betaWarningGame} onConfirm={confirmBetaGame} onClose={closeBetaWarning} />

        <FooterSection isDark={isDark} />

      </div>
    </main>
  )
}

export default App