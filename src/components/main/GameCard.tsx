import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Game } from '../../data/games'

export default function GameCard({ game, onClick }: { game: Game; onClick: (game: Game) => void }) {
  const { t } = useTranslation()
  return <a className="game-card" href={game.disabled ? undefined : game.liveUrl} aria-disabled={game.disabled || undefined}
    onClick={event => {
      if (game.disabled || game.beta || (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey)) {
        event.preventDefault()
        if (!game.disabled) onClick(game)
      }
    }}>
    <div className="card-art">
      {game.showcase && <img src={game.showcase} alt="" width={1200} height={675} loading="lazy" />}
      {game.disabled ? <span className="beta-badge">{t('comingSoon')}</span> : game.beta && <span className="beta-badge">{t('betaLabel')}</span>}
    </div>
    <div className="card-copy"><p className="category-label">{t(`lobby.categories.${game.category}`)}</p><h3>{game.title}</h3><p className="card-description">{t(`lobby.descriptions.${game.id}`)}</p></div>
    <div className="card-footer"><span>{t(game.disabled ? 'comingSoon' : 'lobby.play')}</span><ArrowUpRight className="card-arrow" size={20} aria-hidden="true" /></div>
  </a>
}
