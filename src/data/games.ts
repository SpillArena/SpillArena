import FleetBotShowcase from "../assets/games/FleetBot.svg";
import HangBotShowcase from "../assets/games/HangBot.svg";
import ScribbleBotShowcase from "../assets/games/ScribbleBot.svg";
import AtlasMasterShowcase from "../assets/games/AtlasMaster.svg";
import ProportionPanicShowcase from "../assets/games/ProportionPanic.svg";
import PixelPanicShowcase from "../assets/games/PixelPanic.svg";
import EraShuffleShowcase from "../assets/games/EraShuffle.svg";
import MelodyRushShowcase from "../assets/games/MelodyRush.svg";
import type { GameId } from "../account";

export type GameCategory = 'strategy' | 'words' | 'knowledge' | 'music';

export type Game = {
    id: number;
    title: string;
    category: GameCategory;
    descriptionKey: string;
    icon: string; // Lucide-ikonnavn (PascalCase)
    showcase?: string;
    color: string;
    githubUrl: string;
    liveUrl: string;
    disabled?: boolean;
    beta?: boolean;
};

export const games: Game[] = [
    {
        id: 1,
        title: "FleetBot",
        category: "strategy",
        descriptionKey: "fleetBotDescription",
        icon: "Anchor",
        showcase: FleetBotShowcase,
        color: "bg-blue-600",
        githubUrl: "https://github.com/SpillArena/FleetBot",
        liveUrl: "https://spillarena.no/fleetbot",
    },
    {
        id: 2,
        title: "HangBot",
        category: "words",
        descriptionKey: "hangBotDescription",
        icon: "Type",
        showcase: HangBotShowcase,
        color: "bg-red-500",
        githubUrl: "https://github.com/SpillArena/HangBot",
        liveUrl: "https://spillarena.no/hangbot",
    },
    {
        id: 3,
        title: "ScribbleBot",
        category: "words",
        descriptionKey: "scribbleBotDescription",
        icon: "PenTool",
        showcase: ScribbleBotShowcase,
        color: "bg-green-500",
        githubUrl: "https://github.com/SpillArena/ScribbleBot",
        liveUrl: "https://spillarena.no/scribblebot",
    },
    {
        id: 4,
        title: "AtlasMaster",
        category: "knowledge",
        descriptionKey: "atlasMasterDescription",
        icon: "Globe",
        showcase: AtlasMasterShowcase,
        color: "bg-blue-500",
        githubUrl: "https://github.com/SpillArena/AtlasMaster",
        liveUrl: "https://spillarena.no/atlasmaster",
    },
    {
        id: 5,
        title: "Proportion Panic",
        category: "knowledge",
        descriptionKey: "proportionPanicDescription",
        icon: "Ruler",
        showcase: ProportionPanicShowcase,
        color: "bg-amber-500",
        githubUrl: "https://github.com/SpillArena/ProportionPanic",
        liveUrl: "https://spillarena.no/proportionpanic",
    },
    {
        id: 6,
        title: "Pixel Panic",
        category: "words",
        descriptionKey: "pixelPanicDescription",
        icon: "Grid3x3",
        showcase: PixelPanicShowcase,
        color: "bg-fuchsia-500",
        githubUrl: "https://github.com/SpillArena/PixelPanic",
        liveUrl: "https://spillarena.no/pixelpanic",
    },
    {
        id: 7,
        title: "EraShuffle",
        category: "knowledge",
        descriptionKey: "eraShuffleDescription",
        icon: "Hourglass",
        showcase: EraShuffleShowcase,
        color: "bg-emerald-700",
        githubUrl: "https://github.com/SpillArena/EraShuffle",
        liveUrl: "https://spillarena.no/erashuffle",
        beta: true,
    },
    {
        id: 8,
        title: "MelodyRush",
        category: "music",
        descriptionKey: "melodyRushDescription",
        icon: "Music",
        showcase: MelodyRushShowcase,
        color: "bg-orange-600",
        githubUrl: "https://github.com/SpillArena/MelodyRush",
        liveUrl: "https://spillarena.no/melodyrush/",
        beta: true,
    }
];

/** Spillnavnet slik forsiden viser det, ut fra id-en tjeneren lagrer. */
export const GAME_TITLES: Record<GameId, string> = {
    atlasmaster: "AtlasMaster",
    scribblebot: "ScribbleBot",
    hangbot: "HangBot",
    proportionpanic: "ProportionPanic",
    pixelpanic: "PixelPanic",
    fleetbot: "FleetBot",
    erashuffle: "EraShuffle",
    melodyrush: "MelodyRush",
};
