export interface ChangelogEntry {
    date: string
    title: string
    release: string
    changes: string[]
}

export const changelog: ChangelogEntry[] = [
    {
        date: '05-09-2026',
        title: 'AtlasMaster: world map, accounts and profiles',
        release: '1.1.7',
        changes: [
            'The world map in AtlasMaster now renders at full resolution, with every country a playable answer',
            'Microstates like San Marino, Monaco and the Vatican are now clickable on the world map instead of being left out',
            'Added accounts to AtlasMaster - a username and a PIN - so a leaderboard score cannot be taken over by someone else',
            'The AtlasMaster leaderboard now splits by pace and mode, so a fast round is never ranked against a careful one',
            'Added a profile to AtlasMaster with badges and personal best records',
            'Gave AtlasMaster a new aged-atlas visual theme - worn paper, ink and brass',
        ],
    },
    {
        date: '16-08-2026',
        title: 'New game preview posters',
        release: '1.1.6',
        changes: [
            'Redesigned all four game preview cards as modern, gamified poster art',
            'Removed the floating icon badge overlay on cards - branding now lives in the artwork itself',
        ],
    },
    {
        date: '16-08-2026',
        title: 'NorgesMester renamed to AtlasMaster',
        release: '1.1.5',
        changes: [
            'Renamed NorgesMester to AtlasMaster to reflect its broader scope beyond Norway (Europe, Asia, USA)',
        ],
    },
    {
        date: '05-08-2026',
        title: 'Settings menu and cookie consent',
        release: '1.1.4',
        changes: [
            'Replaced the separate language and theme switchers with a unified settings menu',
            'Added an accent color picker with 13 presets',
            'Added a cookie consent banner - preferences are only saved to this device after accepting',
            'The accent color now applies across the whole app, not just the header',
            'Redesigned the changelog as a scrollable timeline',
            'Redesigned the footer as a single glass card, with an improved tagline and link styling',
            'Updated the header tagline and page metadata (title, description, keywords)',
            'Added a themed thin scrollbar to the settings and changelog panels',
        ],
    },
    {
        date: '29-06-2026',
        title: 'Improved theme switcher and project structure',
        release: '1.1.3',
        changes: [
            'Added system as a theme option. The project now has a more organized and expandable structure.',
        ],
    },
    {
        date: '23-06-2026',
        title: 'Added new game: NorgesMester',
        release: '1.1.2',
        changes: [
            'Added NorgesMester to the games list',
        ],
    },
    {
        date: '30-04-2026',
        title: 'Background improvements',
        release: '1.1.1',
        changes: [
            'Added icons to the background for a more dynamic and engaging visual experience',
        ],
    },
    {
        date: '29-04-2026',
        title: 'Recent UI & UX improvements',
        release: '1.1.0',
        changes: [
            'Added a changelog component',
            'Added ScribbleBot to the games list as a beta release',
            'Footer improvements with new links and a more compact design',
            'Added site logo to header',
            'Page cards now use anchors and support beta gating with a modal - with a modal',
        ],
    },
]
