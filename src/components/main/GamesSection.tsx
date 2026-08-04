import { useTranslation } from 'react-i18next'
import type { Game } from '../../data/games'
import { games } from '../../data/games'
import GameCard from './GameCard'
import { motion } from 'framer-motion'

interface GamesSectionProps {
    onClick: (game: Game) => void
}

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
}

export const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

export default function GamesSection({ onClick }: GamesSectionProps) {
    const { t } = useTranslation()

    return (
        <section>
            <motion.p
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]"
            >
                {t('gamesLabel', 'Spill')}
            </motion.p>
            <motion.div
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {games.map((game) => (
                    <motion.div key={game.id} variants={itemVariants}>
                        <GameCard game={game} onClick={onClick} />
                    </motion.div>
                ))}
            </motion.div>
        </section>
    )
}
