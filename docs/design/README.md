# SpillArena design proposal: a playful, clear arcade lobby

The proposed lobby gives players a clear starting point, makes the games easier to scan, and brings back **“Alt står på spill.”** as the main introduction. A warm cream background and deep plum controls complement the existing colorful game posters; a dark plum theme offers the same hierarchy at night.

## Review the design

Open `index.html` directly in a browser, or run `npm run dev -- --host 127.0.0.1` from the repository and visit `/docs/design/`. The prototype has no dependencies beyond a browser and the repository's existing SVG artwork.

The preview includes all eight current games, working category filters, Norwegian and English copy, Light/System/Dark theme choices, a random game picker, and confirmation before entering the two beta games. System follows the device's color preference, including changes while the page is open. Play links open the existing games. Sign-in and privacy buttons show explanatory preview dialogs.

The footer keeps Changelog and the current version visible. Changelog opens the complete existing release history, rather than a placeholder. `release-data.js` is a static preview snapshot of `package.json` and `src/data/changelog.ts`; production should use the existing release data directly. Decorative stars have been removed from the introduction.

Saved previews: [desktop, light](desktop-light.png), [desktop, dark](desktop-dark.png), [mobile, light](mobile-light.png), [settings with System selected](settings-system.png), and [Changelog](changelog.png).

## What changes and why

| Current lobby | Proposed experience |
| --- | --- |
| A header followed by a grid with little introduction | The existing tagline, a short invitation, and a prominent action explain what to do first. |
| All games have equal visual weight | One editorially selected game in the spotlight gives first-time visitors an easy starting point. AtlasMaster is the example, not a popularity claim. |
| Tilted and vertically offset cards | Aligned cards with consistent artwork, concise descriptions, category labels, and visible play actions are easier to scan. |
| One undifferentiated list | Five simple category filters make it easier to choose by interest. “Surprise me” helps indecisive players. |
| Account benefits sit inside the account menu | A modest explanation below the games makes cross-game progress discoverable while keeping guest play prominent. |
| Large animated background decoration | Color comes primarily from the game artwork; small interaction feedback provides motion without competing with content. |

## Visual system

- **Light:** cream `#f7f5ef`, near-white cards `#fffdf9`, plum ink `#292335`, muted ink `#6c6572`, primary plum `#613c83`.
- **Dark:** plum-black `#18151e`, card `#211d29`, pale ink `#f5f0f7`, muted ink `#b6aebb`, lavender primary `#ceb1ed`.
- **Typography:** the current Fraunces and Space Grotesk families are the intended production fonts. The standalone preview uses local fallbacks, including Georgia and Segoe UI, with no external font requests.
- **Layout:** retains the shared 1760px shell and 36/22/17px gutters. Three game columns on desktop, two on tablets, one on small phones. The featured game stacks below the introduction on mobile.
- **Interaction:** targets at least 44px high for primary controls, visible keyboard focus, native modal dialogs, live filter counts, reduced-motion support, and text labels in addition to color. Verify contrast and assistive technology behavior during production integration.

## Production integration

Use the existing React components and account, consent, language, theme, and accent providers. Add category metadata to `src/data/games.ts`, the hero and account explanation to `src/App.tsx`, and filters to `GamesSection`. Replace card rotation/offset styling with the aligned layout and add the explicit play treatment in `GameCard`. Move the prototype's copy into the existing translation files. Connect account and storage actions to the current dialogs; retain recovery, admin access, and release history.

The proposal introduces no new backend, leaderboard aggregation, popularity scores, tracking, or mandatory account step. Game categories are proposed editorial metadata. The random picker chooses from the full collection and shows the destination before navigation. Beta picks retain their warning. A spotlight feature can be a manual game selection; no recommendation service is needed.

Theme and language selections in this preview stay in memory. Production should continue to use the existing consent-aware preferences and system defaults, and retain accent customization. The feature is an isolated design study: application source, shared branding assets, and vendored game shells are unchanged.

## Validation

Browser checks passed for both languages at 320, 390, 768, 1050, 1440, and 1760px, with no horizontal overflow. The checks also covered all eight game cards, filter results and live counts, beta confirmation, Escape dismissal, random selection without immediate repeats, language updates, theme switching, local image loading, and poster proportions. No browser exceptions or failed requests were observed. Desktop light/dark and mobile previews were visually inspected. Account authentication, storage consent, and gameplay use explanatory preview dialogs or existing external destinations and were not exercised against production.

The System option was checked with emulated light and dark device preferences, including changes while the dialog remained open. Explicit Light/Dark choices continued to override device preferences. Both translations and the three-option layout passed checks at 320, 390, and 1440px.

The visible footer version and Changelog entry were checked in both languages at 320, 390, 768, and 1440px. The Changelog dialog contains every release from the existing source, with the current release first. Saved previews reflect the introduction without stars.
