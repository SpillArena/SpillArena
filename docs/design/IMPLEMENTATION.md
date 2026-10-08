# Implemented SpillArena design

The React application now uses the approved cream/plum lobby design, without decorative stars. It includes the featured game, aligned game cards, category filters, game picker, an explanation of the shared account, and a visible Changelog and version in the footer.

## Account views

- `/#login` opens the redesigned sign-in page, with registration and forgotten-PIN flows.
- `/#register` opens registration directly.
- `/#recover` opens account recovery. Existing `?recover=1` links are adopted and cleared from the URL.
- `/#profile` shows actual account progress: total XP, arena level, saved progress per game, last-save dates, rename, recovery-code management, sign-out, and the existing admin shortcut for admins.

Profiles show loading and retry states when the account service is unavailable. No progress is invented when a request fails. Recovery codes appear in a protected dialog and require confirmation that the code has been saved before continuing. The dialog cannot be dismissed with Escape or a backdrop click.

The settings dialog retains Norwegian/English, Light/System/Dark, all existing accent presets plus the new default plum, and the existing storage information and controls. Preferences and sessions still use the existing consent-aware providers. System observes device theme changes while the page is open, including changes made while an explicit theme was selected.

## Preview and validation

Run `npm run dev` and use the local URL printed by Vite. Saved screenshots show the implemented [lobby](implemented-home.png), [sign-in page](implemented-login.png), [profile](implemented-profile.png), [mobile profile](implemented-profile-mobile.png), and [dark profile](implemented-profile-dark.png). Profile screenshots use local fixtures, not a real account.

`npm run build` and `npm run lint` passed. Browser checks covered Norwegian and English, responsive layouts from 320px to 1760px, game filters and beta warnings, random selection, Changelog, settings, sign-in errors and success, registration, forgotten PIN, renaming, recovery-code confirmation, profile fetch failure/retry, and sign-out. All account checks used intercepted local responses; no production account changes were made.

Additional checks covered maximum-length usernames, switching back to System after device preference changes, and signing in with declined storage without persisting the session. Primary button text passed a 4.5:1 contrast check for all 14 accents in both themes.

Other concurrent workspace changes to account endpoints, metadata, and search were preserved. The design implementation is in the lobby/account components, translations, theme/accent providers, and `src/ui/lobby.css`. The original standalone proposal remains in this folder for reference.
