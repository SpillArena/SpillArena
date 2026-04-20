import { icons } from "lucide-react";
import type { Game } from "../data/games";

type Props = {
    game: Game;
    onClick: (route: string) => void;
};

const PageCard = ({ game, onClick }: Props) => {
    const LucideIcon = icons[game.icon as keyof typeof icons];

    return (
        <div
            onClick={() => onClick(game.route)}
            className="cursor-pointer rounded-2xl border border-fuchsia-200/70 bg-white/85 p-6 shadow-md backdrop-blur-sm transition-transform hover:scale-105 hover:shadow-xl dark:border-fuchsia-900/60 dark:bg-slate-900/80"
        >
            <div className={`${game.color} mb-4 inline-flex rounded-xl p-3`}>
                {LucideIcon && <LucideIcon size={28} />}
            </div>
            <h2 className="mb-1 text-xl font-bold text-slate-900 dark:text-slate-100">{game.title}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">{game.description}</p>
        </div>
    );
};

export default PageCard;