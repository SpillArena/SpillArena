import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users } from 'lucide-react'
import type { Game, GameCategory } from '../../data/games'
import { games } from '../../data/games'
import GameCard from './GameCard'

export default function GamesSection({ onClick }: { onClick: (game: Game) => void }) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<GameCategory | 'all' | 'multiplayer'>('all')
  const multiplayerCount = games.filter(game => game.multiplayer).length
  const visible = games.filter(game => filter === 'all' || (filter === 'multiplayer' ? game.multiplayer : game.category === filter))
  return <section className="games-section" id="games" aria-labelledby="games-title">
    <div className="section-heading"><div><p className="eyebrow">{t('lobby.collection')}</p><h2 id="games-title">{t('lobby.allGames')}</h2></div><span className="game-count" role="status" aria-live="polite">{t('lobby.gameCount', { count: visible.length })}</span></div>
    <div className="filter-bar" role="group" aria-label={t('lobby.filterLabel')}>
      {(['all', 'strategy', 'words', 'knowledge', 'music'] as const).map(category => <button className="filter" type="button" key={category} aria-pressed={filter === category} onClick={() => setFilter(category)}>
        {t(`lobby.categories.${category}`)}{category === 'all' && <span className="filter-count">{games.length}</span>}
      </button>)}
      <button className="filter" type="button" aria-pressed={filter === 'multiplayer'} onClick={() => setFilter('multiplayer')}>
        <Users size={15} aria-hidden="true" />{t('lobby.filterMultiplayer')}<span className="filter-count">{multiplayerCount}</span>
      </button>
    </div>
    <div className="game-grid">{visible.map(game => <GameCard key={game.id} game={game} onClick={onClick} />)}</div>
  </section>
}
