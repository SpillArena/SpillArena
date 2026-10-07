import { useState } from 'react'
import type { Game } from './data/games'
import HeaderSection from './components/header/HeaderSection'
import GamesSection from './components/main/GamesSection'
import BetaWarningModal from './components/main/BetaWarningModal'
import FooterSection from './components/footer/FooterSection'
import DrawingBackground from './components/DrawingBackground'



function App() {


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
    <main className="relative isolate min-h-screen overflow-hidden bg-[var(--color-surface)] py-0 text-[var(--text)] transition-colors duration-300">
      <DrawingBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-[1760px] flex-col gap-16 sm:gap-20">

        {/* Header */}
        <HeaderSection />

        {/* Spill */}
        <div className="arena-container"><GamesSection onClick={handleGameClick} /></div>

        {/* Beta Warning Modal */}
        <BetaWarningModal game={betaWarningGame} onConfirm={confirmBetaGame} onClose={closeBetaWarning} />

        <FooterSection />

      </div>
    </main>
  )
}

export default App