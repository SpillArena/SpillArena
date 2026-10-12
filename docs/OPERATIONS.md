# Operations and account architecture

Developer reference for the SpillArena hub. For the product overview and quick start, see [README](../README.md).

## Traffic analytics

### Popular game in the spotlight

The lobby checks `GET /api/popular-games` for the most visited playable game
over a rolling 24-hour window. It reads the same Cloudflare analytics credential
as the admin traffic panel. Only successful `GET` requests (200 or 304) to the
known game entry paths on `spillarena.no` are counted. Both trailing-slash
variants are combined; assets, API calls, redirects and other hostnames are
excluded. Equal counts use a stable game-name order.

The public endpoint returns aggregate game counts and timestamps, never the
analytics token or visitor identities. Provider results are cached at the edge
for five minutes. The lobby checks once per minute while visible and when the
visitor returns to the tab. Missing configuration, empty traffic, stale data and
provider failures show a neutral “Discover a game” fallback without claiming
that it is the most popular. The selected game's own poster, description and
beta warning follow the current ranking.

Popularity here means game-page loads, not completed rounds or unique players.
Cloudflare's [HTTP analytics](https://developers.cloudflare.com/analytics/graphql-api/tutorials/end-customer-analytics/)
can include bots and [sampled estimates](https://developers.cloudflare.com/analytics/graphql-api/sampling/).
No additional browser tracking or database migration is needed.
Run `npm run test:popularity` to check ranking, freshness, scope, caching and
provider-failure behavior. To exercise the endpoint locally, serve the build
with Pages Functions and the existing ignored `.dev.vars`; plain Vite serves
only the frontend and will show the neutral fallback.

### Admin-only traffic report

The admin panel's **Traffic** tab reads existing Cloudflare zone analytics via
`GET /api/admin/traffic?days=1|7|30`. Every request verifies the signed-in account
and its current admin flag. The Cloudflare credential never reaches the browser.
The report refreshes once per minute while the tab is visible, and includes
unique IP estimates, requests, page views, bytes, daily traffic, countries,
cache usage and HTTP errors. Periods are UTC calendar days including today.
Period-wide unique IPs are queried separately rather than summed across days.
Zone traffic includes bots, API calls, files and proxied subdomains; it is not a
count of human players. No additional tracking script is installed.

`CLOUDFLARE_ZONE_ID` is configured in `wrangler.toml`. Create a dedicated read-only
Analytics API token scoped to SpillArena's zone/account, following
[Cloudflare's Analytics token instructions](https://developers.cloudflare.com/analytics/graphql-api/getting-started/authentication/api-token-auth/).
Add it as the **CLOUDFLARE_ANALYTICS_TOKEN** secret in the `spillarena` Pages
project (Settings → Variables and Secrets). Apply it to production and any
preview environment that needs the report. Redeploy after configuring it.
Do not use a `VITE_` variable for the token. Available history depends on the
zone's Cloudflare plan; provider failures are displayed instead of fabricated
zeroes. Available datasets and date ranges depend on the zone plan.

For local Pages Functions development, put `CLOUDFLARE_ANALYTICS_TOKEN` and
`AUTH_SECRET` in the ignored `.dev.vars` file, use the local D1 migrations,
and serve the build with Pages Functions. Plain `npm run dev` serves the frontend
only. Without the analytics secret, the Traffic tab shows setup instructions.

## The SpillArena account

One account, every game. The front page is the only service on the domain that
issues a sign-in; every game trusts it and none of them ask again.

### Why it is this simple

Every game is served from `https://spillarena.no`. The router strips `/<game>`
before it proxies on to that game's Pages project, so the browser never leaves
the origin. One origin means one `localStorage`. The token the front page
writes is already sitting in the browser when the player clicks into a game.
No cross-domain handshake, because there is no second domain.

The token is signed rather than encrypted: `base64url({username,
expiry}).signature`, HMAC-SHA256 with `AUTH_SECRET`. A game verifies it by
recomputing the signature. So a game learns who the player is without a
database lookup, without calling the front page, and without sharing a database
with it.

### The pieces

| Path | What it is |
|---|---|
| `functions/api/auth/` | Register, sign in, and check a token. The only issuer. |
| `functions/api/profile/[game].js` | One JSON document per (account, game). The game owns its shape. |
| `functions/api/profile/` | Every game in one call, for the header panel. |
| `functions/api/account/` | Change PIN, delete the account and its profiles. |
| `shared/account-server.js` | PBKDF2, HMAC, token issue and verify. |
| `shared/games-registry.js` | Which game ids exist, and the size limits on a profile. |
| `src/account/` | The client. **Vendored**: identical copies live in every game repo. |

`src/account/` is the canonical copy. Review changes before syncing to games; the optional avatar field is currently consumed only by the lobby. A full sync can be done with:

```bash
for g in AtlasMaster ScribbleBot ProportionPanic PixelPanic HangBot EraShuffle FleetBot/battleship-frontend; do
  rm -rf ../$g/src/account && cp -R src/account ../$g/src/account
done
```

Each game verifies tokens with its own copy of `shared/verify-token.{js,ts}`,
which mirrors the computation in `shared/account-server.js`.

### What a PIN protects

Four to six digits is ten thousand to a million values, and no key derivation
makes that number big. The attempt limit is what stops someone guessing: five
wrong in a row locks the account for fifteen minutes. PBKDF2 covers the other
case. If the database leaks, nobody should be able to read a PIN straight out
of it. You need both. This guards a game account on a scoreboard, which is the
level I picked on purpose.

### Setting it up

```bash
# 1. the account database, once
npx wrangler d1 create spillarena-accounts
#    paste the id into wrangler.toml, then
npx wrangler d1 migrations apply spillarena-accounts --remote

# 2. the signing key, once. The SAME string on every project below
npx wrangler pages secret put AUTH_SECRET            # in SpillArena/
#    AtlasMaster/, ScribbleBot/, FleetBot/battleship-frontend/  (pages secret put)
#    ProportionPanic/worker/                                    (wrangler secret put)

# 3. move the accounts that already exist in AtlasMaster
node scripts/migrate-atlasmaster-accounts.mjs          # writes the SQL
node scripts/migrate-atlasmaster-accounts.mjs --apply  # and runs it
```

Use **AtlasMaster's existing `AUTH_SECRET`** as the domain-wide one. The PIN
hashes are copied across verbatim, so players sign in with the PIN they already
have. Reusing the secret also keeps the tokens sitting in their browsers valid
through the switch.

One thing lives outside these repos: the router has to send `/api/*` to this
Pages project. Everything else is already on this origin, but if `/api/auth`
404s in production, that rule is why.

### The admin panel

Accounts with `players.admin = 1` get an **Admin panel** button in the
account menu. It shows sign-up and activity numbers, every player's saved
progress and leaderboard rows, and a log of what admins have done. From a
player's card an admin can ban and unban, lift a PIN lockout, set a new PIN,
rename, remove leaderboard rows, make another player admin, and delete the
account.

| Path | What it is |
|---|---|
| `functions/api/admin/` | Overview, player list, and one player (read and act). |
| `shared/admin-server.js` | The admin check, the audit log, and which leaderboards live in the hub database. |
| `src/admin/`, `src/components/admin/` | The panel. Front page only; not vendored. |

`admin` is a 0/1 column on the `players` row, read on every call and never from
the token, so clearing it takes effect on the next click. Migration 0009 sets it
for `Emil`; if that account does not exist yet, create it and run
`UPDATE players SET admin = 1 WHERE username = 'Emil'` by hand.

The panel can make someone admin but cannot take it away, and admins cannot
ban, rename, reset or delete each other. All admins are equal, so a remove
button would let any one of them remove the rest. Removing admin is done in the
database: `UPDATE players SET admin = 0 WHERE username = '<name>'`.

**A ban reaches the games only partly.** Every `/api/*` call here looks up the
row, so a banned player is signed out on the front page and in every game the
next time that game syncs a profile, and cannot sign in again. The games'
leaderboard endpoints verify the token by signature alone, though, so a token
issued before the ban can still post scores until it expires (30 days). Closing
that gap means each game checking `players.banned_at`, which the shared database
now allows.

Apply the migration **before** deploying this code:

```bash
npx wrangler d1 migrations apply spillarena-hub --remote
```

The account endpoints read the row with `SELECT *` so they keep working either
way, but the panel needs the new columns.

### Local development

The router does not exist locally, so each game proxies `/api/auth`,
`/api/profile` and `/api/account` to port 8789 (see each `vite.config`). Run the
account service beside the game:

```bash
npm run build
npx wrangler pages dev dist --port 8789
```

With nothing on 8789 the games still run, without accounts. That is the path a
player without one takes anyway.

### What changed in the games

- **AtlasMaster** had its own accounts; they moved here. `src/game/auth.ts` is
  now a thin shim, and its `functions/api/auth` and `functions/api/profile` are
  gone. Sessions stored under the old `auth` key are adopted on first load.
- **ScribbleBot, HangBot, FleetBot** took a name from a text field. Posting to
  the shared board now requires an account, and the name on a row comes from the
  token. Playing without one still works. The score stays on the device, the
  way it always did when the API was unreachable.
- **HangBot and FleetBot** also let anyone delete any row by id. Deleting now
  requires a token and only touches your own rows.
- **ProportionPanic** identified a player by a random per-device `clientId`.
  Signed in, the daily row is keyed to the account instead, so today's result
  follows the player between devices and still collapses to one row per day.


## Account pictures

Apply `0015_profile_avatar.sql` before deploying the avatar feature:

```bash
npx wrangler d1 migrations apply spillarena-hub --local
# For a production rollout, apply to the remote database before deploying:
npx wrangler d1 migrations apply spillarena-hub --remote
```

`GET /api/profile` returns an optional `avatar` with a DiceBear style, seed, and optional `options`.
Authenticated `PUT /api/account/avatar` saves `{ "avatar": { "style": "bottts", "seed": "random-id" } }`; `{ "avatar": null }` restores the first-letter picture.
The endpoint accepts only `bottts`, `fun-emoji`, and `pixel-art`, plus a bounded alphanumeric seed. Optional `options` select eyes and mouth, robot head/antenna, or pixel hair/clothes, plus colors. For example:

```json
{ "avatar": { "style": "bottts", "seed": "random-id", "options": { "eyesVariant": "happy", "mouthVariant": "smile01", "baseColor": "#448ef4", "backgroundColor": "#e8dff5" } } }
```

The editor and server share the allowlist in `shared/avatar-options.js`. Only supported variants for the selected style and six-digit hex colors are accepted; arbitrary DiceBear options are rejected. The endpoint uses the same banned-account and token-revocation checks as other account routes. Customization reuses the existing JSON column, so no further migration is needed after `0015`. Old pictures without `options` retain their original appearance.
Avatar generation runs locally through the DiceBear JavaScript library. Seeds are random, so renaming preserves a picture. No uploads or requests to a third-party avatar service are required.

## Game traffic breakdown

The admin Traffic tab ranks every registered game by successful entry-page requests and displays its share of game visits for the selected UTC period. The query reuses the public popularity filter, combines trailing-slash variants, and includes games with zero visits. It excludes assets, API calls, other hostnames, and redirects. Counts can include bots and Cloudflare sampling; they are page visits, not unique people or completed rounds. Missing or malformed analytics return an explicit error rather than invented zero counts. No new analytics secret or database migration is required for this breakdown.
