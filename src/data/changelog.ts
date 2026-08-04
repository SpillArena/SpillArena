export interface ChangelogEntry {
    date: string
    title: string
    release: string
    changes: string[]
}

export const changelog: ChangelogEntry[] = [
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
