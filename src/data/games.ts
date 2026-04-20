export type Game = {
    id: number;
    title: string;
    description: string;
    icon: string; // Lucide-ikonnavn (PascalCase)
    backgroundPicture?: string;
    route: string;
    color: string;
    githubUrl: string;
    liveUrl: string;
};

export const games: Game[] = [
    {
        id: 1,
        title: "FleetBot",
        description:
            "Battleship - plasser skipene dine og senk motstanderens flåte!",
        icon: "Anchor",
        route: "/fleet",
        color: "bg-blue-600",
        githubUrl: "https://github.com/SpillArena/FleetBot",
        liveUrl: "https://fleetbot.pages.dev",
    },
    {
        id: 2,
        title: "HangBot",
        description:
            "Hangman - gjett bokstavene riktig før det er for sent!",
        icon: "Type",
        route: "/hang",
        color: "bg-red-500",
        githubUrl: "https://github.com/SpillArena/HangBot",
        liveUrl: "https://hangbot.pages.dev",
    },
];