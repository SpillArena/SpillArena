/**
 * Innlogging for hele SpillArena.
 *
 * POST /api/auth  { action: 'register' | 'login', username, pin }
 *   → 200 { username, token, expiresAt }
 *   → 4xx { error: <kode> }
 *
 * GET  /api/auth  (Authorization: Bearer <tegn>)
 *   → 200 { username }             — tegnet er gyldig
 *   → 401 { error: 'unauthorized' } — det er det ikke
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
  TOKEN_TTL_MS,
  hashPin,
  issueToken,
  json,
  requireUser,
  timingSafeEqual,
  toBase64Url,
} from '../../../shared/account-server.js'

const PIN_MIN = 4
const PIN_MAX = 6
const USERNAME_MAX = 20

/** Feil på rad før kontoen blir stengt, og hvor lenge den er stengt. */
const MAX_FAILED = 5
const LOCKOUT_MS = 15 * 60 * 1000

function validate(username, pin) {
  if (typeof username !== 'string') return 'bad_username'
  const trimmed = username.trim()
  if (!trimmed || trimmed.length > USERNAME_MAX) return 'bad_username'
  // ingen kontroll- eller formateringstegn: et navn på en tavle skal være det
  // samme navnet uansett hva som renderer det
  if (!/^[\p{L}\p{N} ._'-]+$/u.test(trimmed)) return 'bad_username'
  if (typeof pin !== 'string' || !new RegExp(`^\\d{${PIN_MIN},${PIN_MAX}}$`).test(pin)) {
    return 'bad_pin'
  }
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

  return json({ username: auth.username })
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
  if (action !== 'register' && action !== 'login') return json({ error: 'bad_action' }, 400)

  const username = typeof body.username === 'string' ? body.username.trim() : ''
  const pin = body.pin
  const invalid = validate(username, pin)
  if (invalid) return json({ error: invalid }, 400)

  const now = new Date()
  const nowIso = now.toISOString()

  try {
    const existing = await env.DB.prepare(
      `SELECT username, pin_hash, pin_salt, failed, locked_until FROM players WHERE username = ?`,
    )
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
      return json({ error: 'locked' }, 429)
    }

    const attempted = await hashPin(pin, existing.pin_salt)
    if (!timingSafeEqual(attempted, existing.pin_hash)) {
      const failed = (existing.failed ?? 0) + 1
      // femte feil stenger kontoen et kvarter — det er dette, og ikke
      // rundetallet i PBKDF2, som gjør en PIN på fire siffer verdt noe
      const lockedUntil =
        failed >= MAX_FAILED ? new Date(now.getTime() + LOCKOUT_MS).toISOString() : null
      await env.DB.prepare(`UPDATE players SET failed = ?, locked_until = ? WHERE username = ?`)
        .bind(failed >= MAX_FAILED ? 0 : failed, lockedUntil, username)
        .run()
      return json({ error: 'bad_credentials' }, 401)
    }

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
    return json({ error: 'service_failed', details: String(error) }, 500)
  }
}
