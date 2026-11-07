import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { guidePath } from '../../content/pages'
import { gameBanner, type Game } from '../../data/games'

export default function GameCard({ game, onClick }: { game: Game; onClick: (game: Game) => void }) {
  const { t, i18n } = useTranslation()
  const banner = gameBanner(game, i18n.resolvedLanguage)
  const guide = guidePath(new URL(game.liveUrl).pathname.split('/')[1])
  const label = t(game.disabled ? (game.availability === 'unavailable' ? 'gameUnavailable' : 'comingSoon') : 'lobby.play')
  const open = (event: React.MouseEvent) => {
    if (game.disabled || game.beta || (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey)) {
      event.preventDefault()
      if (!game.disabled) onClick(game)
    }
  }
  return <div className="game-entry" data-disabled={game.disabled || undefined}>
    <a className="game-card" href={game.disabled ? undefined : game.liveUrl} aria-disabled={game.disabled || undefined} onClick={open}>
      <div className="card-art">
        {banner && <img src={banner} alt="" width={1200} height={675} loading="lazy" />}
        {game.disabled ? <span className="beta-badge">{t(game.availability === 'unavailable' ? 'gameUnavailable' : 'comingSoon')}</span> : game.beta && <span className="beta-badge">{t('betaLabel')}</span>}
      </div>
      <div className="card-copy"><p className="category-label">{t(`lobby.categories.${game.category}`)}</p><h3>{game.title}</h3><p className="card-description">{t(`lobby.descriptions.${game.id}`)}</p></div>
    </a>
    <div className="card-footer">
      <a className="card-play" href={game.disabled ? undefined : game.liveUrl} aria-disabled={game.disabled || undefined} onClick={open}>{label}<ArrowUpRight className="card-arrow" size={18} aria-hidden="true" /><span className="sr-only">: {game.title}</span></a>
      <a className="game-guide-link" href={guide}>{t('content.guideLink')}<span className="sr-only">: {game.title}</span></a>
    </div>
  </div>
}
