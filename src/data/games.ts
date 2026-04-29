import FleetBotShowcase from "../assets/games/FleetBot.png";
import HangBotShowcase from "../assets/games/HangBot.png";
import ScribbleBotShowcase from "../assets/games/ScribbleBot.png";

export type Game = {
    id: number;
    title: string;
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
        descriptionKey: "scribbleBotDescription",
        icon: "PenTool",
        showcase: ScribbleBotShowcase,
        color: "bg-green-500",
        githubUrl: "https://github.com/SpillArena/ScribbleBot",
        liveUrl: "https://spillarena.no/scribblebot",
        beta: true,
    }
];