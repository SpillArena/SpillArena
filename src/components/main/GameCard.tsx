import { Ban, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Game } from "../../data/games";
import { motion } from "framer-motion";

type Props = {
    game: Game;
    onClick: (game: Game) => void;
};

export default function GameCard({ game, onClick }: Props) {
    const { t } = useTranslation();
    const isDisabled = Boolean(game.disabled);
    const isBeta = Boolean(game.beta);

    return (
        <motion.a
            href={game.liveUrl}
            onClick={(event) => {
                event.preventDefault()
                if (!isDisabled) onClick(game);
            }}
            aria-disabled={isDisabled}
            whileHover={!isDisabled ? { rotate: 0, y: -6 } : undefined}
            whileTap={!isDisabled ? { scale: 0.98 } : undefined}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className={`group flex h-full flex-col rounded-[28px] p-5 ${isDisabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                }`}
            style={{
                background: 'var(--surface-card)',
                boxShadow: '0 18px 40px -24px color-mix(in srgb, var(--accent) 40%, rgba(0,0,0,0.35))',
            }}
        >
            <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg">
                {game.showcase ? (
                    <img
                        src={game.showcase}
                        alt={`${game.title} showcase`}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="h-full w-full" style={{ background: 'color-mix(in srgb, var(--accent) 18%, var(--surface))' }} />
                )}

                {isDisabled && (
                    <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-[color:color-mix(in_srgb,var(--surface-card)_92%,#000_8%)] px-2.5 py-1 text-xs font-semibold" style={{ color: 'var(--text-subtle)' }}>
                        <Ban size={13} />
                        {t('comingSoon', 'Coming soon')}
                    </div>
                )}
                {isBeta && !isDisabled && (
                    <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-amber-400/90 px-2.5 py-1 text-xs font-semibold text-amber-950">
                        <Zap size={13} />
                        {t('betaLabel', 'Beta')}
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col pt-5 text-left">
                <h3 className="mb-1.5 font-[family-name:var(--font-serif)] text-xl font-medium" style={{ color: 'var(--text)' }}>
                    {game.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-subtle)' }}>
                    {t(game.descriptionKey)}
                </p>
            </div>
        </motion.a>
    );
};
