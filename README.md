# SpillArena

SpillArena is a lightweight game hub that presents game cards with live links, beta gating, language switching (Norwegian/English), and theme switching (dark/light).

## Features

- Modern card-based game overview
- Beta flow with confirmation modal before entering beta games
- Dark and light mode with persisted user preference
- Language selector with persisted user preference
- Automatic default language:
  - Norwegian system language -> Norwegian (no)
  - Any other system language -> English (en)
- Footer links for repository and portfolio
- App version displayed from package metadata

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- i18next + react-i18next
- lucide-react icons
- ESLint 9

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start development server

```bash
npm run dev
```

### 3. Build for production

```bash
npm run build
```

### 4. Preview production build

```bash
npm run preview
```

## Available Scripts

- npm run dev: Run Vite in development mode
- npm run build: Type-check and build production bundle
- npm run lint: Run ESLint
- npm run preview: Preview production build locally

## Project Structure

```text
src/
  App.tsx
  i18n.ts
  index.css
  assets/
    games/
    icons/
  components/
    HeaderSection.tsx
    GamesSection.tsx
    GameCard.tsx
    BetaWarningModal.tsx
    FooterSection.tsx
  data/
    games.ts
```

## Game Configuration

Games are defined in src/data/games.ts.

Each game supports:

- id: number
- title: string
- descriptionKey: i18n key for description
- icon: lucide icon key
- showcase: optional image
- color: badge color class
- githubUrl: repository URL
- liveUrl: game URL
- disabled: optional, marks a non-clickable game
- beta: optional, shows beta badge and requires modal confirmation

## Localization

Translations are configured in src/i18n.ts.

- Supported languages: no, en
- User language is stored in localStorage key language
- On first visit, language falls back to system language rules described above

## Theme Behavior

- Theme is toggled in the header
- Current theme is stored in localStorage key theme
- Dark mode class is applied to html and body

## Notes

- Footer version label is pulled from package.json version
- Portfolio icon automatically switches between light/dark variants based on current theme

## Contributing

1. Create a branch from development
2. Make your changes
3. Run lint and build locally
4. Open a pull request

## The SpillArena account

One account, five games. The front page is the only service on the domain that
issues a sign-in; every game trusts it and none of them ask again.

### Why it is this simple

Every game is served from `https://spillarena.no` — the router strips
`/<game>` before it proxies on to that game's Pages project, so the browser
never leaves the origin. One origin means one `localStorage`, and the token the
front page writes is already in the browser when the player clicks into a game.
There is no cross-domain handshake, because there is no second domain.

The token is signed, not encrypted: `base64url({username, expiry}).signature`,
HMAC-SHA256 with `AUTH_SECRET`. A game verifies it by recomputing the
signature. That is the whole trick — a game learns who the player is without a
database lookup, without calling the front page, and without sharing a database
with it.

### The pieces

| Path | What it is |
|---|---|
| `functions/api/auth/` | Register, sign in, and check a token. The only issuer. |
| `functions/api/profile/[game].js` | One JSON document per (account, game). The game owns its shape. |
| `functions/api/profile/` | Every game at once — what the header panel shows. |
| `functions/api/account/` | Change PIN, delete the account and its profiles. |
| `shared/account-server.js` | PBKDF2, HMAC, token issue and verify. |
| `shared/games-registry.js` | Which game ids exist, and the size limits on a profile. |
| `src/account/` | The client. **Vendored** — identical copies live in every game repo. |

`src/account/` is the canonical copy. Fix it here, then copy it out:

```bash
for g in AtlasMaster ScribbleBot ProportionPanic HangBot FleetBot/battleship-frontend; do
  rm -rf ../$g/src/account && cp -R src/account ../$g/src/account
done
```

Each game verifies tokens with its own copy of `shared/verify-token.{js,ts}`,
which mirrors the computation in `shared/account-server.js`.

### What a PIN protects

Four to six digits is ten thousand to a million values, and no key derivation
makes that number big. What stops guessing is the attempt limit — five wrong in
a row locks the account for fifteen minutes. PBKDF2 is there for the other case:
if the database leaks, the PINs should not be readable with one lookup. Both are
needed; neither alone is enough. This is a game account on a scoreboard, and
that is the level chosen deliberately.

### Setting it up

```bash
# 1. the account database, once
npx wrangler d1 create spillarena-accounts
#    paste the id into wrangler.toml, then
npx wrangler d1 migrations apply spillarena-accounts --remote

# 2. the signing key, once — the SAME string on every project below
npx wrangler pages secret put AUTH_SECRET            # in SpillArena/
#    AtlasMaster/, ScribbleBot/, FleetBot/battleship-frontend/  (pages secret put)
#    ProportionPanic/worker/                                    (wrangler secret put)

# 3. move the accounts that already exist in AtlasMaster
node scripts/migrate-atlasmaster-accounts.mjs          # writes the SQL
node scripts/migrate-atlasmaster-accounts.mjs --apply  # and runs it
```

Use **AtlasMaster's existing `AUTH_SECRET`** as the domain-wide one. The PIN
hashes are copied across verbatim, so players sign in with the same PIN they
always had — and reusing the secret keeps the tokens already sitting in their
browsers valid through the switch.

One thing lives outside these repos: the router has to send `/api/*` to this
Pages project. Everything else is already on this origin, but if `/api/auth`
404s in production, that rule is why.

### Local development

The router does not exist locally, so each game proxies `/api/auth`,
`/api/profile` and `/api/account` to port 8789 (see each `vite.config`). Run the
account service beside the game:

```bash
cd SpillArena && npx wrangler pages dev --port 8789
```

With nothing on 8789 the games still run — they just have no accounts, which is
the same path a player without one takes.

### What changed in the games

- **AtlasMaster** had its own accounts; they moved here. `src/game/auth.ts` is
  now a thin shim, and its `functions/api/auth` and `functions/api/profile` are
  gone. Sessions stored under the old `auth` key are adopted on first load.
- **ScribbleBot, HangBot, FleetBot** took a name from a text field. Posting to
  the shared board now requires an account, and the name on a row comes from the
  token. Playing without one still works — the score stays in that browser's
  local board, as it always did when the API was unreachable.
- **HangBot and FleetBot** also let anyone delete any row by id. Deleting now
  requires a token and only touches your own rows.
- **ProportionPanic** identified a player by a random per-device `clientId`.
  Signed in, the daily row is keyed to the account instead, so today's result
  follows the player between devices and still collapses to one row per day.
