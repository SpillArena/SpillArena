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

const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

export default function GamesSection({ onClick }: GamesSectionProps) {
    const { t } = useTranslation()

    return (
        <section>
            <motion.h2
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="mb-8 font-[family-name:var(--font-serif)] text-2xl font-medium sm:text-3xl"
            >
                {t('gamesLabel', 'Spill')}
            </motion.h2>
            <motion.div
                className="grid auto-rows-fr gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {games.map((game, index) => {
                    const drift = index % 3 === 1 ? 'sm:translate-y-8' : index % 3 === 2 ? 'sm:-translate-y-4' : ''
                    const tilt = index % 2 === 0 ? '-rotate-1' : 'rotate-1'
                    return (
                        <motion.div key={game.id} variants={itemVariants} className={`h-full ${drift} ${tilt}`}>
                            <GameCard game={game} onClick={onClick} />
                        </motion.div>
                    )
                })}
            </motion.div>
        </section>
    )
}
