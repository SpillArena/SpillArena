# Site shell and branding

The lobby and all seven games use a 1760px maximum page width, including horizontal gutters of 36px on desktop, 22px below 720px and 17px below 420px. This follows EraShuffle. Puzzle boards, readable forms and dialogs may use smaller inner bounds.

`src/ui/SiteShell.tsx` supplies the home/logo link, lobby link, storage controls and slim footer. The home link uses Vite's `BASE_URL`, so it returns to this game when served at the lobby root. Lobby navigation points to `https://spillarena.no/`. Settings sit in the right-hand header slot. The lobby uses that slot for account and settings controls.

`src/ui/arena.css` contains the width, gutters and common shell styles, followed by game-specific adjustments. The components are vendored from SpillArena so each repository builds independently. Keep the common component and CSS rules synchronized when changing the shell; retain each game's theme adjustments.

## Cookies and storage

Every site uses the shared `src/account/ConsentDialog.tsx`, `consent.ts` and the `cookie-consent` key on the same origin. Settings and the footer can reopen the dialog. An undecided or declined choice keeps new optional data in memory. Accepting flushes that data to browser storage; declining removes the game's declared optional keys and keeps the current visit usable. The consent choice itself is remembered. The choice applies to the lobby and all games served on `spillarena.no`.

Storage controls show the same accept, decline, status and manage actions in English and Norwegian. Each game still explains its own stored data in the dialog.

## Branding and link previews

Page titles describe the game, without author or lobby suffixes. Author metadata identifies Emil Berglund / EmilB04. The footer links to SpillArena with “En del av SpillArena” in Norwegian or “Part of SpillArena” in English, with the SpillArena logo on the left. Canonical, Open Graph, Twitter and structured-data URLs use the public game URL. Favicons, touch icons and manifests resolve under the game's base path.

`src/ui/spillarena-logo.svg` is an unchanged copy of `SpillArena/src/assets/logo.svg`. Bundle it locally so the footer does not depend on another repository or a remote image. Keep this copy synchronized when the SpillArena logo changes.

The lobby retains its current logo, “Alt står på spill” tagline and 1200 × 630 link-preview image. The shared header uses `src/assets/logo.svg`, and the browser and touch icons remain the lobby’s own assets. Its titles describe the site while retaining this branding.

## Project details

The lobby shares the games' width, branding and consent dialog. Its own header/footer components use the same shell gutters and retain account and settings controls on the right. Changelog and the current package version are always visible in the footer; Changelog opens the full release history in a dialog.

The lobby's cream/plum design lives in `src/ui/lobby.css`. It provides a featured game, aligned game cards, category filters, and a game picker. Account views use hash navigation (`/#login`, `/#register`, `/#recover`, `/#profile`), so they do not require new server routes. Sign-in, registration and recovery use the existing account service; the profile displays saved XP/levels and preserves rename, recovery-code management, sign-out and admin access. System theme and accent customization remain consent-aware. The shared vendored shell components are retained for the individual games.

## Validation

Production build and consent/component rendering checks passed. The checks cover storage before a choice, acceptance, decline, both interface languages, home/lobby links and the shared width/gutter tokens. Link-preview PNGs and SVGs were inspected and their metadata dimensions checked.

Full lint passes.

Browser viewport checks and live gameplay verification remain to be performed.
