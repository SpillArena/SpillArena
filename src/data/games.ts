import type { GameId } from "../account";
import { gameArt, type ArtLanguage } from "./game-art";

export type GameCategory = 'strategy' | 'words' | 'knowledge' | 'music';

export type Game = {
    id: number;
    title: string;
    category: GameCategory;
    descriptionKey: string;
    icon: string; // Lucide-ikonnavn (PascalCase)
    color: string;
    githubUrl: string;
    liveUrl: string;
    disabled?: boolean;
    beta?: boolean;
};

/** Språket bildene finnes på. Norsk er standard, som resten av siden. */
export const artLanguage = (language: string | undefined): ArtLanguage => language?.startsWith('en') ? 'en' : 'no'

/** Banneret (1200×675) på valgt språk — teksten i bildet følger språket på siden. */
export const gameBanner = (game: Game, language: string | undefined): string | undefined =>
    gameArt[game.id]?.banner[artLanguage(language)]

/** Det kvadratiske ikonet (512×512), uten tekst. Til små flater der banneret blir uleselig. */
export const gameIcon = (game: Game): string | undefined => gameArt[game.id]?.icon

export const games: Game[] = [
    {
        id: 1,
        title: "FleetBot",
        category: "strategy",
        descriptionKey: "fleetBotDescription",
        icon: "Anchor",
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
        color: "bg-orange-600",
        githubUrl: "https://github.com/SpillArena/MelodyRush",
        liveUrl: "https://spillarena.no/melodyrush/",
        beta: true,
    },
    {
        id: 9,
        title: "Hitline",
        category: "music",
        descriptionKey: "hitlineDescription",
        icon: "Music",
        color: "bg-teal-700",
        githubUrl: "https://github.com/SpillArena/Hitline",
        liveUrl: "https://spillarena.no/hitline/",
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
    hitline: "Hitline",
};
