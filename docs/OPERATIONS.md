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

### Account deletion

The signed-in profile has a **Delete account and data** section. Deletion asks
for the current PIN and an explicit acknowledgement, with the usual PIN attempt
limit. `DELETE /api/account { pin }` takes the identity from the verified session.
One database batch removes the account (including avatar and recovery codes),
all saved profiles, leaderboard rows for that username, linked contact messages
and matching admin history. References in `players.banned_by` are cleared.
A failed write rolls the whole deletion back. No schema migration is needed.

The client signs out only after `{ deleted: true }` and shows a confirmation on
the lobby. The account service rejects sessions issued before the current
account was created, so re-registering a deleted username does not revive its
old sessions. Games that verify token signatures without an account lookup
still accept old tokens until expiry; this change does not update those games.

The confirmation explains the limits: local game saves on devices, active
multiplayer rooms, scores under previous usernames and already delivered emails
are not removed. Those stores do not have a deletion path in this account API.
Anonymous guest entries are not matched by their displayed nickname.

Run `npm run test:account` for authentication, PIN lockout, deletion scope,
transaction rollback and username reuse checks against the migrated schema.

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
#    workers/parties/                                           (wrangler secret put -c workers/parties/wrangler.toml)

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

**The panel asks for the PIN every time it opens.** `/api/admin/*` does not
take the 30-day sign-in token. It takes a separate admin token from
`POST /api/admin/session { pin }`, which lasts 15 minutes. The client keeps it
in memory only (`src/admin/api.ts`) and revokes it with
`DELETE /api/admin/session` when the panel closes. If it expires while the
panel is open, the PIN field comes back. Wrong PINs count towards the same
lockout as signing in (`checkPin` in `shared/account-server.js`), and every
unlock is written to the log as `open-panel`. The sign-in token sits in
`localStorage`, where any script on the page can read it, including the ad tag.
Without this, that token alone could issue a one-time code for any player, take
over that player's account, delete accounts, or make another account admin.
`requireAdmin` answers a sign-in token with `403 pin_required`.

| Path | What it is |
|---|---|
| `functions/api/admin/` | Overview, player list, and one player (read and act). `session.js` gives and revokes the panel's own token. |
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

## Ads (Google AdSense)

Built and **off**. The switch is `VITE_ADSENSE_CLIENT` in `.env.production`: the
publisher id exactly as AdSense shows it (`ca-pub-` and 16 digits). It is not a
secret: it ends up in the page, in `ads.txt` and in every ad request. That is
why it lives in git and not in the Pages settings. Empty means no tag, no
`ads.txt`, no verification tag, and a consent dialog that behaves as it did
before ads existed.

| Path | What it is |
|---|---|
| `src/account/ads.ts` | Loads Google's consent message (IAB TCF) on its own, and the AdSense tag only once the message has an answer. **Vendored** like the rest of `src/account/`. |
| `src/account/ConsentDialog.tsx` | Waits for Google's message and points to Google's ad settings (also vendored). |
| `vite.config.ts` | Writes `/ads.txt` and `<meta name="google-adsense-account">` from the id, and stops the build on a malformed one. |
| `src/main.tsx` | Loads AdSense only on the home catalogue, before the first render; `isAdFreePage()` excludes guides, help, contact and account pages, including legacy hashes. |
| `tests/ads-consent.test.mjs` | `npm run test:ads`: the consent rules below, against a fake Google tag. |

### Two questions, one prompt

SpillArena asks one thing of its own: may it keep the sign-in and settings in
this browser (`cookie-consent`). Ads need a second answer, about Google's
cookies and personalised ads. In the EEA (Norway included), the UK and
Switzerland, Google serves personalised ads only when that answer comes from a
**Google-certified CMP using IAB TCF**. Our dialog is not one, so it cannot ask.
Google's free CMP qualifies.

### Nothing for ads loads before the answer

`loadAdSense()` does not add `adsbygoogle.js` up front. It adds only Google's
consent message, the Privacy & messaging tag
(`fundingchoicesmessages.google.com/i/pub-…?ers=1`, plus the empty
`googlefcPresent` frame Google's snippet makes), because that message is the
question. `adsbygoogle.js`, and every ad request, cookie and pixel behind it, is
added when TCF reports an answer: `useractioncomplete` (answered now) or
`tcloaded` (answered on an earlier visit). Any answer loads it; what the answer
allows is Google's to enforce. `gdprApplies: false` (outside the EEA, UK and
Switzerland) loads it straight away. A blocked message, or one that never
answers, means no ad tag at all. Fonts are self-hosted (`src/assets/fonts/`),
so a first visit to the lobby contacts no one but `spillarena.no` and, on a
page with ads, Google's consent message.

On a page that calls `loadAdSense()`:

- **Google's message shows**, or was answered on an earlier visit: our dialog
  does not open by itself. If `cookie-consent` has no answer yet, it gets
  Google's answer to TCF purpose 1 ("store and/or access information on a
  device"). After that the two answers are separate, and changing one never
  changes the other. A player who refused Google gets the existing "progress is
  not being saved" strip, which can still turn SpillArena's own storage on.
- **No message comes**: ad blocker, CSP, outside the regions Google asks in, or
  nothing within four seconds. Our dialog asks, as on any page. If Google's
  message shows up later anyway, an unanswered dialog of ours steps aside.

"Storage & privacy" still opens our dialog. On a page with ads it also says
where ads come from, and once Google's message is live it has an **Ad settings**
button (`googlefc.showRevocationMessage`). A page without ads never calls
`loadAdSense()`, so the games' dialogs work as before. The only change there is
that the "no ads" line no longer claims anything for the whole domain.

### Which pages may show ads

| Page | Ads | Why |
|---|---|---|
| Lobby | Yes, once switched on | |
| AtlasMaster, EraShuffle, FleetBot, HangBot, PixelPanic, ProportionPanic, ScribbleBot | Later, menus and result screens only, never during play | Each game opts in by calling `loadAdSense()` itself. Not done yet. |
| SipZone | **No** | Drinking games and snus fall under Google's publisher restrictions (alcohol misuse: "competition drinking"; tobacco). |
| MelodyRush, Hitline | **No, never** | The music comes from the Deezer API. Deezer's developer terms restrict commercial use, and `MelodyRush/docs/MUSIC_SOURCE.md` asks Deezer for an *ad-free* quiz. Revisit only with Deezer's written approval. Enforced in code, see below. |

### How MelodyRush and Hitline stay ad-free

Four layers, so one mistake does not put ads next to Deezer's music:

1. **Game CSP.** `MelodyRush/public/_headers` and `Hitline/public/_headers` set `script-src 'self' 'unsafe-inline'`.
   Google's ad tag cannot run there, even if someone adds `loadAdSense()` by mistake. Each game has `tests/no-ads.test.ts`
   (no ad code in the sources, no Google host in the CSP).
2. **Hub paths.** `AD_FREE_GAMES` in `shared/games-registry.js` (`melodyrush`, `hitline`, `sipzone`). `isAdFreePage()`
   returns true for any path containing one of them, so `/games/melodyrush/` stays ad-free even if guides get ads later.
3. **Party mode.** The leader can open either game in an iframe over the lobby, and a loaded ad tag cannot be removed.
   So a tab that holds a party code (`isInParty()`) does not load the tag, and `PartyGameFrame` reloads the page instead
   of showing an ad-free game next to a tag that did load.
4. **Text.** The privacy policy ("Ads"), the FAQ and the guides' FAQ say these games have no ads and why.

Adding a game that uses Deezer, or another source with the same limit: add its slug to `AD_FREE_GAMES`, give it the same
CSP and test. Test: `node --test tests/site-content.test.mjs`.

### Turning it on

1. Create the AdSense account (18+, payee and tax details) and add the site
   `spillarena.no`. Every game sits under that one site, because they share the
   origin.
2. Put the id in `.env.production`, build and deploy. Check that
   `https://spillarena.no/ads.txt` returns the line
   `google.com, pub-…, DIRECT, f08c47fec0942fa0` and that the router serves it
   from this project like `robots.txt`, not as a 404 or a game. Then ask AdSense
   to verify the site with the meta tag method.
3. In AdSense, **Privacy & messaging → European regulations**: create a
   message in Norwegian Bokmål and English, give `https://spillarena.no/#privacy`
   as the privacy policy, and publish it. Without a published message no
   consent is collected, and EEA visitors get no personalised ads.
4. Once the message is published, open the lobby with DevTools and check the
   console for `Content Security Policy` errors, and in the Network tab that
   no `adsbygoogle.js` or `doubleclick` request goes out before you answer
   Google's message. The allowlist in
   `public/_headers` was tested against the tag with no message published. In
   that test the tag, Google's ad-traffic-quality checks and the frames loaded
   without a single violation. Google's consent message loads from
   `fundingchoicesmessages.google.com`, which is allowed but untested until a
   message exists. Add a host only after you have seen it blocked.
5. Add ad units (lobby, then the opted-in games' menus), with fixed slot
   heights so the layout does not jump.
6. After approval, apply for H5 Games Ads (`adBreak()`) for ads between rounds.

The privacy policy (`legal.privacy` in both locale files), the FAQ and the
consent texts already describe ads from Google AdSense and the separate choice.

### What the ad tag can reach, and the limits on it

The CSP lets Google's own hosts run script on `spillarena.no`. The ads
themselves render in frames on other origins, but the tag itself has the same
access as our code. It can read `localStorage`, including the 30-day session
token, and anything typed on the page. That risk is accepted, with two limits:

- **No admin power from the session token.** The admin API needs the PIN-issued
  token from the panel (see "The admin panel"). Taking over an ordinary account
  already needs the PIN: changing it, renaming, recovery codes and deletion all
  ask for it again.
- **No ad tag where a PIN is typed.** `#login`, `#register`, `#recover`,
  `#profile` and `?recover` load without it (`src/lib/adFreePages.ts`). Going to
  one of them from a page that already has the tag reloads the page, since a
  loaded script cannot be removed. The rest of that visit stays ad-free.

What is left: a compromised Google script could read the session token and use
it until it expires (30 days, or a sign-out). With it, someone could play
multiplayer as that player and post or overwrite their results. The way out is
an `HttpOnly` cookie for the session. Every game and room Worker sends the token
itself, so that is a change in all repos.

**For the games (step 5):** a game that calls `loadAdSense()` must keep its
PIN fields (the AccountBadge sign-in) off the pages with the tag, the same way.
Its own `_headers` needs the same Google hosts.

## Party mode

A party lets signed-in players follow one leader through the games. The leader opens `#party`, creates a party and shares a four-letter code; whatever game the leader picks opens for every member, and when the leader switches, so does everyone.

Games are separate documents on separate Pages projects, so a socket in the lobby would die on every game switch. The lobby is therefore the shell: it keeps the party socket open and runs the current game in an iframe on top of itself.

| Path | What it is |
|---|---|
| `shared/party.js` | The party as a JSON document and every transition (join, leave, leader hand-over, select game, kick). Pure, no I/O, shared by the Worker and the tests. |
| `workers/parties/` | Worker `spillarena-parties` with the `PartyRoom` Durable Object, one per party. SQLite-backed (free plan), hibernating sockets. A Pages project cannot define Durable Objects, hence a Worker. |
| `functions/api/party/[code].js` | Checks the code and hands the WebSocket upgrade to that party's object through the `PARTIES` binding in `wrangler.toml`. Answers 503 until the Worker is bound. |
| `src/party/` | `PartyProvider` (the socket, reconnect with backoff), `PartyPage` (create, join, members, game picker) and `PartyGameFrame` (the iframe and the slim party bar). |

**Identity.** Accounts only. The browser sends the account token as the second WebSocket subprotocol (browsers cannot set headers) and the object verifies it with `AUTH_SECRET`, exactly like `melodyrush-rooms`. A second tab from the same account replaces the first.

**Lifetime.** A party ends 24 hours after it was created, or 10 minutes after its last member disconnects. A dropped member keeps their seat so a reload rejoins; a leader who drops hands over to the longest-standing online member. The server holds only the code, member names, the leader and the open game.

**Storage.** The party code is kept in `sessionStorage` (`spillarena.party`, this tab only) after a yes to the storage question, and in memory otherwise. It is listed in the consent dialog and in the privacy page.

**Framing.** Eight of the eleven games send `X-Frame-Options: DENY` or `frame-ancestors 'none'`, which would leave the iframe blank. `spillarena-router/routes/proxy.js` (`allowSameOriginFraming`) narrows them to `SAMEORIGIN` and `'self'` for game responses only; the lobby stays unframeable, and the lobby CSP gets `frame-src 'self'`. The game keeps working standalone. A game's own link to the lobby is caught by the party frame: for the leader it ends the game, for everyone else it does nothing.

**Which games a party can pick.** `PARTY_LIMITS` in `shared/games-registry.js` lists the games with a multiplayer room and the players a room takes (FleetBot 2, the other seven 2 to 8). AtlasMaster, PixelPanic and Cracked are solo only and are rejected (`not_party_game`). `selectGame` also checks the party as it stands: at least `min` members **online** (`too_few_players`) and no more than `max` **seats** (`too_many_players`). While a game is open, a new joiner is refused with `game_full` when the room would exceed `max`; a member who dropped and comes back keeps their seat. The party picker greys out games that do not fit and says why. Change a limit in the registry and nowhere else.

**One code for every game.** The party code is the room code. Picking a game sets `host` (the leader at that moment) and bumps `round`; the lobby then loads the game at

```
/<slug>/?party=ABCD&partyRole=host|guest&partyRound=3
```

A game that supports this does the following when `party` is present, and nothing differently when it is absent:

1. Skips its own menu and lobby, and goes straight to the multiplayer room screen.
2. `partyRole=host`: opens a room whose id is the party code (the game's own room code format may differ; map the party code onto it). Do not let the user choose mode or code, use the game's default, and let the host change settings in the room as usual.
3. `partyRole=guest`: joins that room. The host may not have opened it yet, so retry for a few seconds before showing an error.
4. `partyRound` changes with every pick, also when the same game is picked twice. Treat a new round as a new room, never as a rematch of the old one.

The server never creates rooms in a game. Each game still has to read these parameters; until it does it behaves as before and its members create or join a room by hand. The iframe key includes `round`, so a repick remounts the game.

**Limits.** Only "which game is open", the host and the round are synced. The party server checks the game and the player counts; availability (`coming_soon`, `unavailable`) is enforced by the router when the iframe loads. Per-game modes with a different count (MelodyRush Versus is two players) are still the game's call inside the room.

### Deploying it

Order matters: the Pages deployment has the binding, so the Worker must exist first.

```bash
npm run parties:deploy
npx wrangler secret put AUTH_SECRET -c workers/parties/wrangler.toml   # the SAME value as the hub
# then deploy the lobby (Pages) and, last, spillarena-router
```

Before the Worker is deployed the party page works up to "Create party", which fails with a party error; nothing else on the site is affected. Local development: run `npx wrangler dev -c workers/parties/wrangler.toml` next to `vite` and the Pages dev server, with `AUTH_SECRET` in both `.dev.vars` files. Tests: `npm run test:party`.

## Release settings in the admin panel

The **Games** tab controls each game's availability (`available`, `coming_soon`,
`unavailable`) and its independent Beta flag. Settings live in
`spillarena-hub.game_settings`; writes require the existing PIN-issued admin
token and are committed together with a `game-settings` audit-log entry.
Hitline and Cracked start as coming soon. Other current statuses are preserved.

Apply `0016_game_settings.sql` before deploying this feature:

```sh
npx wrangler d1 migrations apply spillarena-hub --remote
```

Deploy both this Pages project and the updated `spillarena-router` Worker.
The router needs the `DB` binding to the same hub database and checks release
settings before forwarding game requests. Changing only the lobby cannot
block direct URLs. The router repository's README describes the rollout order
and access limits. No production deployment or remote migration is performed
by the local checks.

`GET /api/game-settings` is public and returns only game ids, titles,
availability, and beta flags with `Cache-Control: no-store`.
`GET /api/admin/games` and `PUT /api/admin/games` require admin access.
PUT accepts `{ game, availability, beta }` (the UI also supplies the title;
the server uses the catalogue's title when reading). Edits affect one game at
a time and do not touch accounts, progress, or scores. If two admins edit the
same game, the last successful save wins; each save is audited.

The lobby refreshes public settings every 30 seconds while visible and when
returning to the tab. A successful admin save updates the current lobby
immediately. Failed reads retain the last known settings, or the checked-in
initial settings before the first successful read. The router independently
blocks game requests on status lookup failures. It does not cache settings.
After the initial rollout, status edits need no deployment. New games still
need a catalogue entry, origin route, and seeded database setting.

Local checks: `npm run test:admin`, `npm run test:popularity`, `npm run lint`,
`npm run build`, and the router's `node --test tests/proxy.test.mjs`.

## Public content and AdSense review (7 November 2026)

- `src/content/guides.json` holds Norwegian and English rules, examples and tips for all eleven games. These are editorial instructions, not an approval guarantee.
- `/games/`, `/games/<slug>/`, `/about/`, `/faq/`, `/privacy/`, `/terms/` and `/contact/` are real document routes. Old `#faq`, `#privacy`, `#terms` and `#contact` links still resolve. Root-relative account/home links are required on these routes.
- `scripts/content-pages.ts` uses the same `EditorialArticle` renderer as React and writes all public documents with their own title, description and canonical. The initial HTML stays readable if JS is unavailable; the loader is used for transitions only. Run `npm run build` before the content tests.
- `/sitemap.xml` is served by `functions/sitemap.xml.js`, reading the existing `game_settings` table. Play URLs are included only for available games; guides remain available during maintenance. There are no fabricated `lastmod` dates. A static build has a defaults-based sitemap for preview; live Pages Functions overrides it. No migration is needed.
- Only the home catalogue requests advertising. Information pages, guides, contact and account pages do not load either the Google consent script or ad script. Hash navigation to an ad-free screen reloads a document that has not loaded advertising code.
- Each game's `index.html` has readable initial information and an expandable rules section outside React's root. `public/game-information.css` scopes styling and follows the document language. After changing guide introductions or rules, run `node scripts/sync-game-information.mjs --check`; `--write` explicitly updates the eleven sibling repos. This is never a side effect of the hub build. Review and deploy those repos separately.
- Validation: `npm run build`, `npm run lint`, `node --test tests/*.test.mjs`. Build each changed game. Publish the hub and game changes, verify the public documents/sitemap and game availability, then request AdSense review manually. Do not describe a passing local check as a live deployment or Google approval.

## Norwegian-first search appearance

The lobby and public documents default to Norwegian, both in initial HTML and
when React renders. An explicit English choice in Settings still works and is
remembered when preference storage is accepted. Browser language alone does not
switch these URLs to English: doing so let Google's rendered page replace the
Norwegian title and text with English at the same canonical URL.

Home search and sharing copy comes from `seoTitle` / `seoDescription` in the
locale files and must match `index.html`; `npm run seo:check` checks that agreement.
The longer visible introduction is separate from the concise search description.
Canonical URLs, sitemap and Norwegian initial text remain available without JS.
English is currently a visitor preference, not a separate indexed language site;
do not add English hreflang links until matching English document URLs exist.

After deploying, inspect `https://spillarena.no/` in Google Search Console and
request indexing. Google chooses its own title/snippet and must crawl the update
before an existing English result can change. Check `/games/` and a guide as well.
