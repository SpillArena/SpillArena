export interface ChangelogEntry {
    date: string
    title: string
    release: string
    changes: string[]
}

export const changelog: ChangelogEntry[] = [
    {
        date: '29-10-2026',
        title: 'Cracked is coming soon',
        release: '1.17.0',
        changes: [
            'Added Cracked to the Words & pictures collection as Coming Soon: crack a daily code word in five tries, with arrows guiding you through the alphabet',
            'Added Norwegian and English descriptions, dedicated posters and a lock icon',
            'Cracked stays unavailable to play and is excluded from search, random picks and the spotlight until launch',
        ],
    },
    {
        date: '27-10-2026',
        title: 'EraShuffle: new look and multiplayer',
        release: '1.16.0',
        changes: [
            'EraShuffle now has multiplayer: create a room or join one with a code or invite link, and race the same three timelines against the same clock, with live standings and rematches',
            'New bold, game-like design with a clearer menu, daily challenge and practice modes, round view and results, plus new illustrations on the front page',
            'Scoring is simpler: every card in its exact place earns 1,000 points, with your result shown as, for example, 1,000 / 5,000 and how many cards were correct. The speed bonus is gone',
            'Level, XP, records and achievements now sit at the bottom of the page, and multiplayer matches earn XP too',
            'Removed the timeline playground from the front page',
        ],
    },
    {
        date: '27-10-2026',
        title: 'HitLine: Temporally removed from the arena',
        release: '1.15.2',
        changes: [
            'HitLine has been temporarily removed from the arena due to a licensing issue. We are working to resolve this and will bring it back as soon as possible.',
        ],
    },
    {
        date: '27-10-2026',
        title: 'Smoother sign-in and a cleaner footer',
        release: '1.15.1',
        changes: [
            'The shared SpillArena loading animation now appears while signing in, signing out, creating an account or recovering a PIN, and clears when the request finishes or times out',
            'Sign-in and account creation now share a sliding selector, with fields revealed from top to bottom and smooth form resizing; keyboard navigation and reduced-motion preferences are supported',
            'Made the Back to games control clearer and more consistent across account, profile, contact and information pages',
            'Improved footer spacing, branding alignment and link wrapping from small phones to wide desktop screens, while keeping comfortable tap targets',
            'Removed the standalone footer version number; the current version is shown inside Changelog',
        ],
    },
    {
        date: '19-10-2026',
        title: 'SipZone joins the arena in beta',
        release: '1.15.0',
        changes: [
            'Added SipZone as a beta game, with the beta badge and the shared warning before entering the game',
            'Added the Party games category, Norwegian and English game descriptions, and dedicated SipZone posters and icon',
            'SipZone is included in search, the multiplayer filter, game traffic and the most-visited game spotlight',
        ],
    },
    {
        date: '13-10-2026',
        title: 'MelodyRush: refreshed style and out of beta',
        release: '1.14.1',
        changes: [
            'MelodyRush has a refreshed in-game style with a new look',
            'MelodyRush is out of beta - removed the beta label and the warning before you play',
        ],
    },
    {
        date: '13-10-2026',
        title: 'ProportionPanic: new look and multiplayer',
        release: '1.14.0',
        changes: [
            'ProportionPanic now has multiplayer: create a room or join one with a code or invite link, and play together with your SpillArena profile',
            'New bold, high-contrast design with a clearer menu, mode selection, game board and round results, built to be easier to read and use',
            'Singleplayer and multiplayer sit side by side on the mode screen, using the same room chooser as the other games',
        ],
    },
    {
        date: '13-10-2026',
        title: 'FleetBot: meet the captains',
        release: '1.13.1',
        changes: [
            'FleetBot now plays as a captain in four ranks - Cadet, Captain, Commander and Admiral FleetBot - each with their own look, from a rubber duck on the cadet\'s cap to the admiral\'s bicorne and monocle',
            'The captains replace the difficulty buttons on FleetBot\'s home screen, and the chosen captain greets you with a new line every few seconds',
            'During a game FleetBot reacts to every hit, miss and sinking with his own lines and expressions, in Norwegian and English',
            'Fleet lists grow into the free space beside the boards on large screens, and selected buttons now use an amber ring instead of an underline',
            'New Norwegian and English FleetBot posters with Admiral FleetBot leaning over the board, used in the lobby and for link previews',
        ],
    },
    {
        date: '13-10-2026',
        title: 'Your profile picture and one way to play together',
        release: '1.13.0',
        changes: [
            'Your SpillArena profile picture now follows you into every game: in the account badge, where the game shows who you play as, and next to every player in multiplayer rooms',
            'The account badge is smaller: just your picture, name and level, now written out as "Nivå"',
            'Every game has a clearer "Back to the Arena" button in the top bar',
            'All games with multiplayer share one chooser: Create room or Join room, with the game\'s modes picked when you create a room',
            'Invite links in Hitline and ScribbleBot now join the room automatically once you are signed in, like the other games',
        ],
    },
    {
        date: '12-10-2026',
        title: 'Personal profiles and game traffic',
        release: '1.12.0',
        changes: [
            'Added a DiceBear profile picture editor with robot, emoji and pixel art styles, customizable features and colors saved to the account; profiles without a picture show the first letter of the name',
            'Moved the admin button to the top of the profile and gave logout a red button',
            'Added traffic per game and share of game visits to the admin Traffic tab for the selected period',
            'Moved the version number to the left of the footer and refreshed the GitHub README and developer guides',
        ],
    },
    {
        date: '12-10-2026',
        title: 'Contact form that reads the FAQ',
        release: '1.11.0',
        changes: [
            'Added a contact form at #contact with a topic, message and reply email, linked from the footer and the FAQ',
            'While you type, the form suggests FAQ answers that match your message in Norwegian or English, so many questions are answered before you send anything',
            'Messages are stored with spam protection (hidden trap field, speed check and a per-hour limit using a daily one-way hash of the sender, never the address) and kept for at most a year',
            'Added a Messages tab to the admin panel to read, answer by email, mark done and delete messages; setting RESEND_API_KEY also forwards each message to support@spillarena.no',
            'Added six more FAQ answers and updated the privacy policy to cover contact messages',
        ],
    },
    {
        date: '12-10-2026',
        title: 'ScribbleBot: new posters and icon',
        release: '1.10.1',
        changes: [
            'Updated the Norwegian and English ScribbleBot posters to the game\'s new navy and purple look, with a canvas showing a real drawing from the game, red, orange and green guess tiles and the ScribbleBot mascot holding its pencil',
            'Refreshed the square ScribbleBot icon with the same canvas, paint splashes and mascot',
            'Gave ScribbleBot a purple accent in the lobby to match the game',
            'Moved the source artwork used to build the posters from scripts/art to src/assets/games/art, next to the other game images',
        ],
    },
    {
        date: '12-10-2026',
        title: 'The lobby spotlights the most visited game',
        release: '1.10.0',
        changes: [
            'The "In the spotlight" card now shows the most visited game of the last 24 hours, with its own poster, description and beta label',
            'The lobby checks the ranking once a minute while open and again when you return to the tab',
            'If popularity data is missing or unavailable, the card shows a neutral "Discover a game" label instead of claiming a most popular game',
            'Popularity counts game page loads only - no extra tracking, and no visitor details are shared',
        ],
    },
    {
        date: '11-10-2026',
        title: 'HangBot: a new look and choose-a-word challenges',
        release: '1.9.3',
        changes: [
            'Redesigned HangBot with a charcoal and lime palette, a hand-drawn hangman figure, a talking bot companion and smooth transitions',
            'Added a multiplayer mode where one player chooses a secret word and an optional hint while the others race to guess it',
            'Moved the XP overview to the bottom of the start screen',
            'Updated the Norwegian and English posters with the hangman drawing as the main illustration, a small bot beside it and letter tiles in the shared SpillArena style',
            'Refreshed the square game icon with the same gallows illustration and removed remaining-chance ticks from the artwork',
        ],
    },
    {
        date: '11-10-2026',
        title: 'FleetBot: a new naval look',
        release: '1.9.2',
        changes: [
            'Refreshed the game itself with deep blue sea boards, detailed steel ships, amber controls and matching light and dark themes',
            'Updated the Norwegian and English FleetBot posters with the game\'s own ship silhouettes, a naval grid, hit markers and a targeting reticle',
            'Refreshed the FleetBot icon with a battleship and yellow targeting ring in the game\'s dark blue naval palette',
            'Matched the lobby artwork to FleetBot\'s latest game artwork and link preview images',
        ],
    },
    {
        date: '11-10-2026',
        title: 'Hitline cover refresh',
        release: '1.9.1',
        changes: [
            'Updated the Norwegian and English Hitline posters with a release-year timeline, coloured song markers and a red needle for the unknown song',
            'Matched the posters to the other games with Fraunces titles, a dotted background and the shared layout; removed the header divider',
            'Updated the Hitline icon with the timeline motif and kept the poster tagline clear of the beta badge on small screens',
        ],
    },
    {
        date: '11-10-2026',
        title: 'Hitline joins the arena',
        release: '1.9.0',
        changes: [
            'Added Hitline to the game list with a beta label - recognise the song and place it on your timeline by release year',
            'Play solo, take turns with up to 8 players on one screen, or invite friends to an online room with a link or a six-character code',
            'Choose all hits, classics from 1970-1999 or modern favourites from 2000-2025, and earn bonus points for naming the song and the artist',
            'Hitline has its own Norwegian and English poster and a square game icon in the shared game art style',
            'Search finds Hitline by words like "musikk", "tidslinje", "release year" or "party"',
        ],
    },
    {
        date: '08-10-2026',
        title: 'New game art',
        release: '1.8.0',
        changes: [
            'Every game has a new banner in one shared style: its own colour, the Fraunces title from the lobby, and an illustration built from the same rounded tiles as the SpillArena logo',
            'Banners now come in Norwegian and English and switch with the language you choose',
            'New square game icons in search and on your profile, where the banners were too small to read',
            'AtlasMaster shows a detailed globe with real country borders and Norway highlighted',
            'Proportion Panic compares a giraffe and a sailboat against a ruler instead of stacks of tiles',
        ],
    },
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
