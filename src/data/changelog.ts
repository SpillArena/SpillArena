export interface ChangelogEntry {
    date: string
    title: string
    release: string
    changes: string[]
}

export const changelog: ChangelogEntry[] = [
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
