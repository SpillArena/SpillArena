import { Ban, icons } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Game } from "../data/games";

type Props = {
    game: Game;
    onClick: (route: string) => void;
};

const PageCard = ({ game, onClick }: Props) => {
    const { t } = useTranslation();
    const LucideIcon = icons[game.icon as keyof typeof icons];
    const isDisabled = Boolean(game.disabled);

    return (
        <button
            onClick={() => {
                if (!isDisabled) {
                    onClick(game.liveUrl);
                }
            }}
            disabled={isDisabled}
            aria-disabled={isDisabled}
            className={`group overflow-hidden rounded-2xl border border-fuchsia-200/70 bg-white/85 shadow-md backdrop-blur-sm transition-transform dark:border-fuchsia-900/60 dark:bg-slate-900/80 ${
                isDisabled
                    ? "cursor-not-allowed"
                    : "cursor-pointer hover:scale-105 hover:shadow-xl"
            }`}
        >
            <div className="relative h-50 w-full overflow-hidden">
                {game.showcase ? (
                    <img
                        src={game.showcase}
                        alt={`${game.title} showcase`}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-br from-fuchsia-100 via-pink-100 to-sky-100 dark:from-fuchsia-900/40 dark:via-pink-900/30 dark:to-sky-900/30" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
                <div className={`${game.color} absolute bottom-3 left-3 inline-flex rounded-xl p-2.5 text-white shadow-lg`}>
                    {LucideIcon && <LucideIcon size={24} />}
                </div>
                {isDisabled && (
                    <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded-full border border-red-500/80 bg-red-600/85 px-2 py-1 text-xs font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <Ban size={14} />
                        Coming Soon
                    </div>
                )}
            </div>

            <div className="p-6 pt-4 text-left">
                <h2 className="mb-1 text-xl font-bold text-slate-900 dark:text-slate-100">{game.title}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">{t(game.descriptionKey)}</p>
            </div>
        </button>
    );
};

export default PageCard;