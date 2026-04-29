import { useTranslation } from 'react-i18next'
import type { Game } from '../data/games'
import { games } from '../data/games'
import GameCard from './GameCard'

interface GamesSectionProps {
    onClick: (game: Game) => void
}

export default function GamesSection({ onClick }: GamesSectionProps) {
    const { t } = useTranslation()

    return (
        <section>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-700 dark:text-fuchsia-300">
                {t('gamesLabel', 'Spill')}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {games.map((game) => (
                    <GameCard key={game.id} game={game} onClick={onClick} />
                ))}
            </div>
        </section>
    )
}
