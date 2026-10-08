export interface ChangelogEntry {
    date: string
    title: string
    release: string
    changes: string[]
}

export const changelog: ChangelogEntry[] = [
    {
        date: '08-10-2026',
        title: 'Search, a new loading screen and safer accounts',
        release: '1.7.0',
        changes: [
            'Search every game from the header: click the search field or press Ctrl K / ⌘K or /, then browse with the arrow keys and press Enter to play',
            'Search finds games by name, category or topic in both Norwegian and English, so "hangman", "geografi" or "quiz" all lead somewhere',
            'New loading screen: the tiles of the SpillArena logo light up one by one along the S while the page or a game loads',
            'Starting a game now fades in the loading screen over a softly blurred lobby, instead of a blank page while the game loads',
            'Signing out now also ends the session on the server, so a copied sign-in key stops working on your account',
            'Confirming account changes with your PIN now has the same limit on wrong attempts as signing in',
            'Added a proper "page not found" page, and tightened the security headers on the site',
            'Faster first load: smaller favicon, fonts requested earlier, and unused images and libraries removed',
            'MelodyRush is now listed in the sitemap and search engine data',
        ],
    },
    {
        date: '07-10-2026',
        title: 'MelodyRush: playlists and a better listening experience',
        release: '1.6.1',
        changes: [
            'MelodyRush now includes curated playlists alongside the daily mixtape and practice by decade',
            'A new in-game header shows the current mode or playlist, and a wider layout gives listening and guessing their own space',
            'Clip indicators show how much you can hear, with playback time and volume controls together',
            'Click the record or press Space to start and stop playback; Enter selects a search result, confirms your answer and advances after the reveal',
            'Correct answers continue the preview at a lower volume with smooth fades, and a wrong song by the right artist reveals an artist hint',
            'Updated the MelodyRush preview with vinyl artwork and a clearer overview of its game modes',
        ],
    },
    {
        date: '07-10-2026',
        title: 'MelodyRush preview and Pixel Panic out of beta',
        release: '1.6.0',
        changes: [
            'Added MelodyRush to the game list with a new record-cover poster and a beta label',
            'MelodyRush challenges you to recognise pop songs from short audio clips, with a daily mixtape and practice by decade; less listening earns more points',
            'New MelodyRush logo and retro record player, plus a continuously spinning landing-page record that slides out of its sleeve on hover and a cover that flips on click',
            'MelodyRush includes XP, levels, daily streaks and achievement badges',
            'Pixel Panic is out of beta - removed the beta label and the warning before you play',
        ],
    },
    {
        date: '07-10-2026',
        title: 'A new look',
        release: '1.5.0',
        changes: [
            'New SpillArena logo - a pixel S of game tiles in the colours of every game in the arena, with a direct hit in the corner',
            'New tagline: Alt står på spill / Everything\'s at stake',
            'New link preview image, SVG favicon and home screen icon',
        ],
    },
    {
        date: '07-10-2026',
        title: 'EraShuffle joins the arena',
        release: '1.4.0',
        changes: [
            'Added EraShuffle to the game list - put five moments from history in order, then reveal the years and the stories behind them',
            'A new daily shuffle every day, and EraShuffle XP now counts towards your SpillArena profile',
        ],
    },
    {
        date: '23-09-2026',
        title: 'Pixel Panic joins the arena',
        release: '1.3.1',
        changes: [
            'Added Pixel Panic to the game list - name the film, game, place, animal or flag while a pixelated picture sharpens',
            'A new daily board of four pictures from seven categories every day, with a shared leaderboard',
        ],
    },
    {
        date: '18-09-2026',
        title: 'Global profile',
        release: '1.3.0',
        changes: [
            'Added global profile feature, allowing progress to be tracked across all games with a single account',
        ],
    },
    {
        date: '17-09-2026',
        title: 'A calmer, more organic look',
        release: '1.2.0',
        changes: [
            'Redesigned the whole page with a warmer, minimalist look and a new typeface pairing',
            'The background now shows a few slow, softly drifting shapes instead of scattered icons',
            'Game posters sit in a loosely staggered layout instead of a strict grid',
            'Poster artwork is no longer cropped and now has slightly rounded corners',
            'Beta and coming-soon labels on posters are now always visible, and shown in your chosen language',
            'Refreshed the header, footer and beta warning popup to match the new style',
        ],
    },
    {
        date: '17-09-2026',
        title: 'Proportion Panic joins the arena',
        release: '1.1.8',
        changes: [
            'Added Proportion Panic to the game list - guess how big real-world objects are on a logarithmic ruler before the panic timer runs out',
            'AtlasMaster now also covers South America and Africa, on top of Europe, Asia, the USA and Norway',
            'ScribbleBot is out of beta - no more beta warning before you play it',
            'Redesigned every game poster around one shared layout, with artwork that survives the card crop on phones and tablets',
        ],
    },
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
