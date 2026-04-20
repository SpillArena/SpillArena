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
            className="cursor-pointer rounded-2xl p-6 text-white shadow-md transition-transform hover:scale-105 hover:shadow-xl"
            style={{ backgroundColor: undefined }}
        >
            <div className={`${game.color} mb-4 inline-flex rounded-xl p-3`}>
                {LucideIcon && <LucideIcon size={28} />}
            </div>
            <h2 className="mb-1 text-xl font-bold">{game.title}</h2>
            <p className="text-sm text-gray-600">{game.description}</p>
        </div>
    );
};

export default PageCard;