/**
 * Kontoen selv: bytte PIN, og slette alt.
 *
 * POST   /api/account  { action: 'change-pin', pin, newPin }      → 200 { username, token, expiresAt }
 * POST   /api/account  { action: 'rename', pin, newUsername }   → 200 { username, token, expiresAt }
 * DELETE /api/account  { pin }                                  → 200 { deleted: true }
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
  PIN_RE,
  TOKEN_TTL_MS,
  hashPin,
  issueToken,
  json,
  requireUser,
  timingSafeEqual,
  toBase64Url,
  validateUsername,
} from '../../../shared/account-server.js'

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

/**
 * Bytter brukernavn.
 *
 * TEGNET MÅ BYTTES SAMTIDIG. Signaturen dekker navnet, så tegnet du kom inn med
 * peker på en konto som ikke finnes lenger i det øyeblikket raden er omdøpt.
 * Uten et nytt tegn tilbake ville spilleren vært logget ut av alle fem spillene
 * av å bytte navn.
 *
 * PROFILENE FØLGER MED. `player_progress` er nøklet på brukernavn, ikke på en
 * id, så radene må omdøpes i samme slengen. Begge setningene går i én `batch`,
 * som D1 kjører som én transaksjon: enten flytter kontoen og profilene sammen,
 * eller så flytter ingenting. Alternativet — to kall — har en tilstand imellom
 * der kontoen heter det nye og profilene det gamle, og da er profilene borte.
 *
 * DET SOM IKKE FØLGER MED er radene på spillenes egne ledertavler. De ligger i
 * fem andre databaser (se SpillArena/README.md om hvorfor de ikke er slått
 * sammen), og en poengsum der er en oppføring i en liste andre har lest, ikke
 * data kontoen bærer med seg. Gamle resultater blir stående under det gamle
 * navnet. Klienten sier fra om det før byttet — se AccountMenu.
 */
async function rename(env, currentName, newName) {
  const invalid = validateUsername(newName)
  if (invalid) return json({ error: invalid }, 400)

  const trimmed = newName.trim()

  /*
   * Å bytte til sitt eget navn med annen bokstavstørrelse er lov — «emil» til
   * «Emil». Primærnøkkelen er COLLATE NOCASE, så det er SAMME rad, og en
   * opptatthets-sjekk ville sagt at navnet er tatt av deg selv.
   */
  const sameRow = trimmed.toLowerCase() === currentName.toLowerCase()
  if (!sameRow) {
    const taken = await env.DB.prepare(`SELECT username FROM players WHERE username = ?`)
      .bind(trimmed)
      .first()
    if (taken) return json({ error: 'name_taken' }, 409)
  }

  const now = Date.now()
  try {
    await env.DB.batch([
      env.DB.prepare(`UPDATE player_progress SET username = ? WHERE username = ?`).bind(
        trimmed,
        currentName,
      ),
      env.DB.prepare(`UPDATE players SET username = ? WHERE username = ?`).bind(
        trimmed,
        currentName,
      ),
    ])
  } catch (error) {
    /*
     * Primærnøkkelen er siste ord. Sjekken over kan tape et kappløp mot noen
     * som registrerer det samme navnet i mellomtiden, og da er det databasen —
     * ikke sjekken — som avgjør, med nøyaktig samme svar til klienten.
     */
    if (String(error).includes('UNIQUE') || String(error).includes('PRIMARY KEY')) {
      return json({ error: 'name_taken' }, 409)
    }
    return json({ error: 'service_failed', details: String(error) }, 500)
  }

  return json({
    username: trimmed,
    token: await issueToken(env.AUTH_SECRET, trimmed, now),
    expiresAt: now + TOKEN_TTL_MS,
  })
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
  if (body?.action !== 'change-pin' && body?.action !== 'rename') {
    return json({ error: 'bad_action' }, 400)
  }
  if (body.action === 'change-pin' && (typeof body.newPin !== 'string' || !PIN_RE.test(body.newPin))) {
    return json({ error: 'bad_pin' }, 400)
  }

  try {
    // begge handlingene krever PIN-en på nytt: tegnet ligger i nettleseren i
    // tretti dager, og en åpen enhet skal ikke kunne døpe om kontoen
    const check = await checkPin(env, auth.username, body.pin)
    if (check.error) return check.error

    if (body.action === 'rename') return await rename(env, auth.username, body.newUsername)

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
