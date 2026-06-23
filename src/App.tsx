import { useState } from 'react'
import type { Game } from './data/games'
import HeaderSection from './components/header/HeaderSection'
import GamesSection from './components/main/GamesSection'
import BetaWarningModal from './components/main/BetaWarningModal'
import FooterSection from './components/footer/FooterSection'
import DrawingBackground from './components/DrawingBackground'
import { useTheme } from './hooks/useTheme'


function App() {

  const { isDark } = useTheme()

  const [betaWarningGame, setBetaWarningGame] = useState<Game | null>(null)

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
    <main className="relative isolate min-h-screen overflow-hidden bg-[radial-gradient(90%_90%_at_10%_0%,#f3d7ff_0%,#fdf4ff_45%,#ffe4f3_100%)] px-6 py-8 text-slate-800 transition-colors duration-300 dark:bg-[radial-gradient(90%_90%_at_10%_0%,#2a0f37_0%,#1a1129_45%,#0a0613_100%)] dark:text-slate-200 sm:px-10 lg:px-16">
      <DrawingBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10">

        {/* Header */}
        <HeaderSection />

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