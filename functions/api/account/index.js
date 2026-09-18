/**
 * Kontoen selv: bytte PIN, og slette alt.
 *
 * POST   /api/account  { action: 'change-pin', pin, newPin } → 200 { username, token, expiresAt }
 * DELETE /api/account  { pin }                                → 200 { deleted: true }
 *
 * Begge krever BÅDE et gyldig tegn og PIN-en på nytt. Tegnet sier hvem du er,
 * men det ligger i nettleseren i tretti dager — en åpen enhet skal ikke kunne
 * bytte PIN-en eller slette kontoen uten å vite den.
 *
 * Bytte av PIN gir et nytt tegn tilbake. Det gamle er fortsatt gyldig til det
 * går ut: signaturen dekker navn og utløpstid, ikke PIN-hashen, og et tegn kan
 * ikke trekkes tilbake uten et oppslag i databasen for hvert kall — noe hele
 * poenget med å signere var å slippe. Vurderes det å være for svakt, er stedet
 * å fikse det en `tokens_valid_from`-kolonne som verifiseringen leser, og da
 * koster hvert kall et oppslag.
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
const PIN_RE = new RegExp(`^\\d{${PIN_MIN},${PIN_MAX}}$`)

/** Sjekker PIN-en mot raden. Teller IKKE feil forsøk: kontoen er alt bevist. */
async function checkPin(env, username, pin) {
  if (typeof pin !== 'string' || !PIN_RE.test(pin)) return { error: json({ error: 'bad_pin' }, 400) }
  const row = await env.DB.prepare(`SELECT pin_hash, pin_salt FROM players WHERE username = ?`)
    .bind(username)
    .first()
  if (!row) return { error: json({ error: 'unauthorized' }, 401) }
  const attempted = await hashPin(pin, row.pin_salt)
  if (!timingSafeEqual(attempted, row.pin_hash)) {
    return { error: json({ error: 'bad_credentials' }, 401) }
  }
  return {}
}

export async function onRequestPost(context) {
  const { env, request } = context
  const auth = await requireUser(env, request)
  if (auth.response) return auth.response

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'bad_body' }, 400)
  }
  if (body?.action !== 'change-pin') return json({ error: 'bad_action' }, 400)
  if (typeof body.newPin !== 'string' || !PIN_RE.test(body.newPin)) {
    return json({ error: 'bad_pin' }, 400)
  }

  try {
    const check = await checkPin(env, auth.username, body.pin)
    if (check.error) return check.error

    const salt = toBase64Url(crypto.getRandomValues(new Uint8Array(16)))
    const now = Date.now()
    await env.DB.prepare(
      `UPDATE players SET pin_hash = ?, pin_salt = ?, failed = 0, locked_until = NULL WHERE username = ?`,
    )
      .bind(await hashPin(body.newPin, salt), salt, auth.username)
      .run()

    return json({
      username: auth.username,
      token: await issueToken(env.AUTH_SECRET, auth.username, now),
      expiresAt: now + TOKEN_TTL_MS,
    })
  } catch (error) {
    return json({ error: 'service_failed', details: String(error) }, 500)
  }
}

/**
 * Sletter kontoen og alle profildokumentene den eier.
 *
 * Det dette IKKE rører er radene på spillenes egne ledertavler. De ligger i
 * hver sin database, og en poengsum på en tavle er et resultat i en liste
 * andre leser — ikke personlige data kontoen bærer med seg. Skal en tavlerad
 * bort, må det skje i spillet som eier tavla.
 */
export async function onRequestDelete(context) {
  const { env, request } = context
  const auth = await requireUser(env, request)
  if (auth.response) return auth.response

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'bad_body' }, 400)
  }

  try {
    const check = await checkPin(env, auth.username, body?.pin)
    if (check.error) return check.error

    await env.DB.batch([
      env.DB.prepare(`DELETE FROM player_progress WHERE username = ?`).bind(auth.username),
      env.DB.prepare(`DELETE FROM players WHERE username = ?`).bind(auth.username),
    ])
    return json({ deleted: true })
  } catch (error) {
    return json({ error: 'service_failed', details: String(error) }, 500)
  }
}
