import { useState } from 'react'
import type { Game } from './data/games'
import HeaderSection from './components/header/HeaderSection'
import GamesSection from './components/main/GamesSection'
import BetaWarningModal from './components/main/BetaWarningModal'
import FooterSection from './components/footer/FooterSection'
import DrawingBackground from './components/DrawingBackground'
import { useTheme } from './context/ThemeContext'


function App() {

  const { currentTheme } = useTheme()
  const isDark = currentTheme === 'dark'

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
    <main className="relative isolate min-h-screen overflow-hidden bg-[var(--color-surface)] px-6 py-10 text-[var(--text)] transition-colors duration-300 sm:px-10 sm:py-14 lg:px-16">
      <DrawingBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-16 sm:gap-20">

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