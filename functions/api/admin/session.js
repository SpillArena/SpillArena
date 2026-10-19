/**
 * Adminpanelets eget tegn: PIN-en på nytt, og et kvarter.
 *
 * POST   /api/admin/session  { pin }  (Authorization: Bearer <vanlig tegn>)
 *   → 200 { token, expiresAt }      — tegnet requireAdmin krever
 *   → 401 { error: 'bad_credentials' }, 429 { error: 'locked', retryAfter }
 *   → 403 { error: 'forbidden' }    — kontoen er ikke admin
 *
 * DELETE /api/admin/session          (Authorization: Bearer <admintegn>)
 *   → 200 { signedOut: true }       — tegnet virker ikke lenger, også før det går ut
 *
 * Hvorfor panelet ikke slipper inn på det vanlige tegnet, står ved
 * issueAdminToken i shared/account-server.js. Kort sagt: det tegnet kan leses av
 * alt som kjører på siden, og alene skal det ikke kunne ta over andres kontoer.
 *
 * PIN-en telles mot SAMME grense som innloggingen (checkPin): fem feil stenger
 * kontoen et kvarter, her som der. Ellers kunne den som fikk tak i tegnet prøve
 * alle PIN-ene her i stedet.
 *
 * Hver åpning skrives til admin_log, så en åpning ingen kjenner seg igjen i
 * synes for alle adminene.
 */

import {
  ADMIN_TOKEN_TTL_MS,
  bearer,
  checkPin,
  issueAdminToken,
  json,
  requireUser,
  serviceFailed,
  tokenHash,
  verifyTokenClaims,
} from '../../../shared/account-server.js'
import { logStatement } from '../../../shared/admin-server.js'

export async function onRequestPost({ request, env }) {
  const auth = await requireUser(env, request)
  if (auth.response) return auth.response
  if (!auth.admin) return json({ error: 'forbidden' }, 403)

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'bad_body' }, 400)
  }

  try {
    const checked = await checkPin(env, auth.username, body?.pin)
    if (checked.error) return checked.error

    const now = Date.now()
    const token = await issueAdminToken(env.AUTH_SECRET, auth.username, now)
    await logStatement(env, auth.username, 'open-panel', auth.username).run()
    return json({ token, expiresAt: now + ADMIN_TOKEN_TTL_MS })
  } catch (error) {
    return serviceFailed(error)
  }
}

/**
 * Panelet lukkes: tegnet tilbakekalles, så det ikke virker resten av kvarteret.
 *
 * Alltid 200, som utloggingen i functions/api/auth/: et tegn som ikke er gyldig,
 * er det ingenting å lukke for. Bare admintegn tas imot — dette er ikke en vei
 * til å logge ut det vanlige tegnet.
 */
export async function onRequestDelete({ request, env }) {
  const token = bearer(request)
  const claims = await verifyTokenClaims(env.AUTH_SECRET, token)
  if (!claims || claims.scope !== 'admin') return json({ signedOut: true })
  try {
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM revoked_tokens WHERE expires_at < ?`).bind(new Date().toISOString()),
      env.DB.prepare(`INSERT OR IGNORE INTO revoked_tokens (token_hash, expires_at) VALUES (?, ?)`).bind(
        await tokenHash(token),
        new Date(claims.expiresAt).toISOString(),
      ),
    ])
  } catch (error) {
    return serviceFailed(error)
  }
  return json({ signedOut: true })
}
