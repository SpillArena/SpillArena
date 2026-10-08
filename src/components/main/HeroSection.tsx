import { ArrowDownRight, ArrowUpRight, Check, Dice5 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { games } from '../../data/games'

export default function HeroSection({ onSurprise }: { onSurprise: () => void }) {
  const { t } = useTranslation()
  const featured = games.find(game => game.id === 4) ?? games[0]
  return <section className="hero" aria-labelledby="hero-title">
    <div className="hero-copy">
      <p className="eyebrow">{t('lobby.eyebrow')}</p>
      <h1 id="hero-title"><span>{t('lobby.titleFirst')}</span><br /><em>{t('lobby.titleSecond')}</em></h1>
      <p className="hero-description">{t('lobby.intro')}</p>
      <div className="hero-actions"><a className="button primary" href="#games">{t('lobby.explore')}<ArrowDownRight size={18} aria-hidden="true" /></a><button type="button" className="button text-button" onClick={onSurprise}><Dice5 size={18} aria-hidden="true" />{t('lobby.surprise')}</button></div>
      <p className="guest-note"><Check size={14} aria-hidden="true" />{t('lobby.guestNote')}</p>
    </div>
    <article className="featured" aria-labelledby="featured-title">
      <div className="featured-top"><p className="eyebrow">{t('lobby.featured')}</p><span className="feature-number" aria-hidden="true">01 / {String(games.length).padStart(2, '0')}</span></div>
      <a className="featured-art" href={featured.liveUrl} aria-label={featured.title}><img src={featured.showcase} alt="" width={1200} height={675} fetchPriority="high" /><span className="art-arrow" aria-hidden="true"><ArrowUpRight size={20} /></span></a>
      <div className="featured-bottom"><div><p className="category-label">{t(`lobby.categories.${featured.category}`)}</p><h2 id="featured-title">{featured.title}</h2><p>{t('lobby.featuredDescription')}</p></div><a className="button feature-play" href={featured.liveUrl}>{t('lobby.play')}<ArrowUpRight size={16} aria-hidden="true" /></a></div>
    </article>
  </section>
}
