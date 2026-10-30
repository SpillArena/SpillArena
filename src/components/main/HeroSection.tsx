import { useGames } from '../../hooks/useGames'
import { ArrowDownRight, ArrowUpRight, Check, Dice5 } from 'lucide-react'
import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { gameBanner, type Game } from '../../data/games'
import { usePopularGame } from '../../hooks/usePopularGame'

export default function HeroSection({ onSurprise, onPlay }: { onSurprise: () => void; onPlay: (game: Game) => void }) {
  const { t, i18n } = useTranslation()
  const games = useGames()
  const popular = usePopularGame()
  const featured = popular ?? games.find(game => game.id === 4 && !game.disabled) ?? games.find(game => !game.disabled && game.liveUrl)
  const playFeatured = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!featured) return
    if (featured.beta || (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey)) {
      event.preventDefault()
      onPlay(featured)
    }
  }
  return <section className="hero" aria-labelledby="hero-title">
    <div className="hero-copy">
      <p className="eyebrow">{t('lobby.eyebrow')}</p>
      <h1 id="hero-title"><span>{t('lobby.titleFirst')}</span><br /><em>{t('lobby.titleSecond')}</em></h1>
      <p className="hero-description">{t('lobby.intro')}</p>
      <div className="hero-actions"><a className="button primary" href="#games">{t('lobby.explore')}<ArrowDownRight size={18} aria-hidden="true" /></a><button type="button" className="button text-button" onClick={onSurprise} disabled={!featured}><Dice5 size={18} aria-hidden="true" />{t('lobby.surprise')}</button></div>
      <p className="guest-note"><Check size={14} aria-hidden="true" />{t('lobby.guestNote')}</p>
    </div>
    {featured && <article className="featured" aria-labelledby="featured-title">
      <div className="featured-top"><p className="eyebrow">{t('lobby.featured')}</p><span className="feature-number">{t(popular ? 'lobby.featuredPopularity' : 'lobby.featuredFallback')}</span></div>
      <a className="featured-art" href={featured.liveUrl} aria-label={featured.title} onClick={playFeatured}><img src={gameBanner(featured, i18n.resolvedLanguage)} alt="" width={1200} height={675} fetchPriority="high" />{featured.beta && <span className="beta-badge">{t('betaLabel')}</span>}<span className="art-arrow" aria-hidden="true"><ArrowUpRight size={20} /></span></a>
      <div className="featured-bottom"><div><p className="category-label">{t(`lobby.categories.${featured.category}`)}</p><h2 id="featured-title">{featured.title}</h2><p>{t(`lobby.descriptions.${featured.id}`)}</p></div><a className="button feature-play" href={featured.liveUrl} onClick={playFeatured}>{t('lobby.play')}<ArrowUpRight size={16} aria-hidden="true" /></a></div>
    </article>}
  </section>
}
