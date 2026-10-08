/**
 * Innlogging for hele SpillArena.
 *
 * POST /api/auth  { action: 'register' | 'login', username, pin }
 *   → 200 { username, token, expiresAt }
 *   → 4xx { error: <kode> }
 *
 * POST /api/auth  { action: 'recover', username, code, newPin }
 *   → 200 { username, token, expiresAt, recoveryCode }
 *   → 4xx { error: <kode> }
 *   Glemt PIN. `code` er spillerens gjenopprettingskode eller en engangskode
 *   fra admin — se migrations/0010_pin_recovery.sql og `recover` under.
 *
 * POST /api/auth  { action: 'logout' }  (Authorization: Bearer <tegn>)
 *   → 200 { signedOut: true }
 *   Tilbakekaller DETTE tegnet, så det ikke kan brukes på /api/* igjen. Andre
 *   enheter er fortsatt innlogget. Se `logout` under.
 *
 * GET  /api/auth  (Authorization: Bearer <tegn>)
 *   → 200 { username, admin }       — tegnet er gyldig
 *   → 401 { error: 'unauthorized' } — det er det ikke
 *   → 401 { error: 'banned' }       — kontoen er utestengt
 *
 * Feilkodene er stabile strenger, ikke setninger: klienten oversetter dem.
 * En engelsk setning fra en Worker kan den bare vise fram.
 *
 * HVORFOR ÉN KONTO. Før dette hadde AtlasMaster kontoer og de andre spillene
 * hadde et tekstfelt. Fem spill betydde fem identiteter, og fire av dem var
 * ingen identitet i det hele tatt. Nå er det én: spillene ligger på samme
 * opphav, så tegnet herfra ligger allerede i nettleseren når spilleren går fra
 * forsiden inn i et spill.
 *
 * HVA EN PIN FAKTISK VERNER. Fire til seks siffer er ti tusen til en million
 * mulige verdier. Ingen nøkkelutledning gjør det tallet stort. Det som stopper
 * gjeting er GRENSA PÅ FORSØK — fem feil, så er kontoen stengt et kvarter — og
 * utledningen er der for at en lekket database ikke skal være lesbar med ett
 * oppslag. Begge trengs; ingen av dem alene er nok. Dette er en spillkonto på
 * en poengtavle, og det er det sikkerhetsnivået som er valgt.
 */

import {
  PIN_RE,
  RECOVERY_CODE_LENGTH,
  RESET_CODE_LENGTH,
  TOKEN_TTL_MS,
  bearer,
  codeWithHash,
  countFailedPin,
  hashCode,
  hashPin,
  issueToken,
  json,
  lockedResponse,
  newSalt,
  normalizeCode,
  requireUser,
  serviceFailed,
  timingSafeEqual,
  toBase64Url,
  tokenHash,
  validateUsername,
  verifyTokenClaims,
} from '../../../shared/account-server.js'
import { logStatement } from '../../../shared/admin-server.js'

/*
 * Det samme som for PIN-en (MAX_FAILED i shared/account-server.js) for koder
 * ved glemt PIN, med egen teller. Kodene har 40–60 bit, så
 * grensa er ikke det som gjør dem trygge — den er der så ingen kan bruke
 * endepunktet til å brenne CPU. Den kan derfor være rausere enn for PIN-en.
 */
const RECOVER_MAX_FAILED = 10
const RECOVER_LOCKOUT_MS = 60 * 60 * 1000

function validate(username, pin) {
  // navneregelen bor i shared/account-server.js, fordi navnebytte i
  // functions/api/account/ må bruke nøyaktig den samme
  const invalidName = validateUsername(username)
  if (invalidName) return invalidName
  if (typeof pin !== 'string' || !PIN_RE.test(pin)) return 'bad_pin'
  return null
}

export async function onRequestGet(context) {
  const { env, request } = context
  const auth = await requireUser(env, request)
  if (auth.response) return auth.response

  // last_seen er det eneste stedet som vet at kontoen fortsatt er i bruk —
  // tegnet verifiseres uten et eneste databaseoppslag, så uten dette ville en
  // aktiv spiller sett ut som forlatt siden forrige innlogging.
  try {
    await env.DB.prepare(`UPDATE players SET last_seen = ? WHERE username = ?`)
      .bind(new Date().toISOString(), auth.username)
      .run()
  } catch {
    // et mislykket stempel er ikke verdt å avvise en gyldig økt for
  }

  return json({ username: auth.username, admin: auth.admin })
}

export async function onRequestPost(context) {
  const { env, request } = context

  /*
   * Uten nøkkel kan ingen tegn signeres, og da er det eneste ærlige svaret at
   * tjenesten ikke er satt opp. Å falle tilbake på noe som ser ut til å virke
   * ville gitt kontoer som ikke verner noe.
   */
  if (!env.AUTH_SECRET) return json({ error: 'not_configured' }, 503)

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'bad_body' }, 400)
  }

  const { action } = body
  if (action === 'logout') {
    try {
      return await logout(env, request, new Date())
    } catch (error) {
      return serviceFailed(error)
    }
  }
  if (action === 'recover') {
    try {
      return await recover(env, body, new Date())
    } catch (error) {
      return serviceFailed(error)
    }
  }
  if (action !== 'register' && action !== 'login') return json({ error: 'bad_action' }, 400)

  const username = typeof body.username === 'string' ? body.username.trim() : ''
  const pin = body.pin
  const invalid = validate(username, pin)
  if (invalid) return json({ error: invalid }, 400)

  const now = new Date()
  const nowIso = now.toISOString()

  try {
    // SELECT * av samme grunn som i requireUser: `banned_at` finnes ikke før
    // migrasjon 0009 er kjørt, og innloggingen skal ikke falle på det
    const existing = await env.DB.prepare(`SELECT * FROM players WHERE username = ?`)
      .bind(username)
      .first()

    if (action === 'register') {
      if (existing) return json({ error: 'name_taken' }, 409)
      const salt = toBase64Url(crypto.getRandomValues(new Uint8Array(16)))
      await env.DB.prepare(
        `INSERT INTO players (username, pin_hash, pin_salt, created_at, last_seen)
         VALUES (?, ?, ?, ?, ?)`,
      )
        .bind(username, await hashPin(pin, salt), salt, nowIso, nowIso)
        .run()
      return json({
        username,
        token: await issueToken(env.AUTH_SECRET, username, now.getTime()),
        expiresAt: now.getTime() + TOKEN_TTL_MS,
      })
    }

    /*
     * «Finnes ikke» og «feil PIN» får samme svar med vilje. Skiller en dem,
     * blir innloggingsskjemaet en liste over hvem som spiller.
     */
    if (!existing) return json({ error: 'bad_credentials' }, 401)

    if (existing.locked_until && existing.locked_until > nowIso) {
      return lockedResponse(existing.locked_until, now)
    }

    const attempted = await hashPin(pin, existing.pin_salt)
    if (!timingSafeEqual(attempted, existing.pin_hash)) {
      // femte feil stenger kontoen et kvarter — det er dette, og ikke
      // rundetallet i PBKDF2, som gjør en PIN på fire siffer verdt noe
      await countFailedPin(env, existing, now)
      return json({ error: 'bad_credentials' }, 401)
    }

    /*
     * Utestengingen sjekkes ETTER PIN-en, ikke før. Svarte vi «utestengt» på
     * et hvilket som helst navn, kunne hvem som helst slå opp hvem som er
     * utestengt — og dermed hvem som finnes. Bare den som kan PIN-en får vite
     * det.
     */
    if (existing.banned_at) return json({ error: 'banned' }, 403)

    await env.DB.prepare(
      `UPDATE players SET failed = 0, locked_until = NULL, last_seen = ? WHERE username = ?`,
    )
      .bind(nowIso, username)
      .run()

    return json({
      username: existing.username,
      token: await issueToken(env.AUTH_SECRET, existing.username, now.getTime()),
      expiresAt: now.getTime() + TOKEN_TTL_MS,
    })
  } catch (error) {
    return serviceFailed(error)
  }
}

/**
 * Logger ut på tjeneren: dette tegnet slutter å virke på /api/*.
 *
 * Tegnet er signert, ikke lagret, så å slette det i nettleseren gjør det ikke
 * ugyldig. Den som hadde kopiert det — fra en delt maskin, en logg, et
 * XSS-hull — kunne brukt det i tretti dager til. Nå legges en hash av det i
 * `revoked_tokens`, og requireUser avviser det.
 *
 * BARE DETTE TEGNET. `tokens_valid_from` ville kastet ut alle enheter, og det
 * er ikke det «Logg ut» på telefonen betyr. Bytte av PIN gjør det fortsatt.
 *
 * Spillene verifiserer tegn uten oppslag og ser ikke denne tabellen. Et
 * tilbakekalt tegn kan derfor fortsatt sende inn resultater til det går ut,
 * akkurat som etter et PIN-bytte — men det kommer ikke inn på kontoen.
 *
 * Alltid 200, også for et tegn som ikke er gyldig: da er det ingenting å
 * logge ut av, og klienten har allerede glemt økten.
 */
async function logout(env, request, now) {
  const token = bearer(request)
  const claims = await verifyTokenClaims(env.AUTH_SECRET, token, now.getTime())
  if (!claims) return json({ signedOut: true })

  // utløpte rader ryddes her, så tabellen aldri blir større enn tegnene som
  // fortsatt kunne vært brukt
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM revoked_tokens WHERE expires_at < ?`).bind(now.toISOString()),
    env.DB.prepare(
      `INSERT OR IGNORE INTO revoked_tokens (token_hash, expires_at) VALUES (?, ?)`,
    ).bind(await tokenHash(token), new Date(claims.expiresAt).toISOString()),
  ])
  return json({ signedOut: true })
}

/**
 * Glemt PIN: ny PIN med en kode i stedet for den gamle.
 *
 * Koden er enten spillerens egen gjenopprettingskode (12 tegn) eller en
 * engangskode fra admin (8 tegn). Lengden avgjør hvilken som prøves.
 *
 * ETTER EN VELLYKKET NULLSTILLING
 *   - PIN-en er ny, og begge sperrene er opphevet.
 *   - Koden som ble brukt, virker ikke igjen. Spilleren får en NY
 *     gjenopprettingskode tilbake, også når det var admin sin kode som ble
 *     brukt — da har de en egen neste gang.
 *   - Alle tegn utstedt før nå avvises av /api/* (se requireUser). Kom noen
 *     seg inn på kontoen, er de ute når eieren tar den tilbake.
 *
 * Samme svar for «finnes ikke» og «feil kode», av samme grunn som ved
 * innlogging. Utestengt sjekkes ETTER at koden stemmer.
 */
async function recover(env, body, now) {
  if (!env.AUTH_SECRET) return json({ error: 'not_configured' }, 503)

  const username = typeof body.username === 'string' ? body.username.trim() : ''
  const invalidName = validateUsername(username)
  if (invalidName) return json({ error: invalidName }, 400)
  if (typeof body.newPin !== 'string' || !PIN_RE.test(body.newPin)) {
    return json({ error: 'bad_pin' }, 400)
  }
  const code = normalizeCode(body.code)
  if (!code) return json({ error: 'bad_code_format' }, 400)

  const nowIso = now.toISOString()
  // SELECT * av samme grunn som ved innlogging
  const existing = await env.DB.prepare(`SELECT * FROM players WHERE username = ?`)
    .bind(username)
    .first()
  if (!existing) return json({ error: 'bad_credentials' }, 401)

  if (existing.recover_locked_until && existing.recover_locked_until > nowIso) {
    return lockedResponse(existing.recover_locked_until, now)
  }

  const matches = async (hash, salt) =>
    Boolean(hash && salt) && timingSafeEqual(await hashCode(code, salt), hash)

  /** Kolonnen med hashen som stemte — den som skal være borte etterpå. */
  let used = null
  if (code.length === RECOVERY_CODE_LENGTH) {
    if (await matches(existing.recovery_hash, existing.recovery_salt)) used = 'recovery_hash'
  } else if (code.length === RESET_CODE_LENGTH) {
    const live = Boolean(existing.reset_expires && existing.reset_expires > nowIso)
    if (live && (await matches(existing.reset_hash, existing.reset_salt))) used = 'reset_hash'
  }

  if (!used) {
    const failed = (existing.recover_failed ?? 0) + 1
    const lockedUntil =
      failed >= RECOVER_MAX_FAILED ? new Date(now.getTime() + RECOVER_LOCKOUT_MS).toISOString() : null
    await env.DB.prepare(
      `UPDATE players SET recover_failed = ?, recover_locked_until = ? WHERE username = ?`,
    )
      .bind(failed >= RECOVER_MAX_FAILED ? 0 : failed, lockedUntil, existing.username)
      .run()
    return json({ error: 'bad_credentials' }, 401)
  }

  if (existing.banned_at) return json({ error: 'banned' }, 403)

  const fresh = await codeWithHash(RECOVERY_CODE_LENGTH)
  const pinSalt = newSalt()

  /*
   * `AND <kolonne> = <hashen som stemte>` gjør koden til en engangskode også
   * når to forespørsler kommer samtidig: bare den første finner raden slik den
   * var, den andre endrer ingenting og får nei.
   */
  const result = await env.DB.prepare(
    `UPDATE players
     SET pin_hash = ?, pin_salt = ?, failed = 0, locked_until = NULL,
         recover_failed = 0, recover_locked_until = NULL,
         recovery_hash = ?, recovery_salt = ?,
         reset_hash = NULL, reset_salt = NULL, reset_expires = NULL,
         tokens_valid_from = ?, last_seen = ?
     WHERE username = ? AND ${used} = ?`,
  )
    .bind(
      await hashPin(body.newPin, pinSalt),
      pinSalt,
      fresh.hash,
      fresh.salt,
      nowIso,
      nowIso,
      existing.username,
      existing[used],
    )
    .run()
  if ((result.meta?.changes ?? 0) !== 1) return json({ error: 'bad_credentials' }, 401)

  /*
   * I adminloggen, med spilleren selv som den som gjorde det. Da står det i
   * historikken på spillerkortet, rett under engangskoden admin ga dem. Etter
   * selve endringen og ikke i samme batch: en logg som feiler skal ikke gjøre
   * en nullstilling som virket, om til en feil.
   */
  try {
    await logStatement(env, existing.username, 'recover', existing.username, {
      via: used === 'recovery_hash' ? 'recovery-code' : 'reset-code',
    }).run()
  } catch {
    // se over
  }

  return json({
    username: existing.username,
    token: await issueToken(env.AUTH_SECRET, existing.username, now.getTime()),
    expiresAt: now.getTime() + TOKEN_TTL_MS,
    recoveryCode: fresh.code,
  })
}
