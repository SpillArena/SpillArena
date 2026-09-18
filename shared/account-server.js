/**
 * Delt kode for konto-endepunktene under functions/api/.
 *
 * Ligger utenfor functions/ med vilje: alt som ligger DER blir en rute, og
 * dette er ikke en rute. Pages-byggeren følger den relative importen hit uten
 * videre.
 *
 * Kryptografien er flyttet ordrett fra AtlasMaster sin functions/api/auth/ —
 * den var alt i drift med ekte kontoer, og hashene i databasen er de samme
 * radene. Endres PBKDF2_ROUNDS eller hash-funksjonen her, slutter alle
 * eksisterende PIN-er å stemme.
 */

/** Hvor lenge en innlogging varer. */
export const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Runder i PBKDF2.
 *
 * Satt av CPU-taket i en Pages Function, ikke av kryptografi: gratisplanen gir
 * ti millisekund. For en PIN på fire siffer er dette uansett det minst viktige
 * leddet — det som stopper gjeting er forsøksgrensa i functions/api/auth/.
 * Utledningen er der for det andre tilfellet: lekker databasen, skal ikke alle
 * PIN-ene være lesbare med ett oppslag.
 *
 * MÅ være det samme tallet som AtlasMaster brukte da radene ble skrevet.
 */
export const PBKDF2_ROUNDS = 25000

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })

const encoder = new TextEncoder()

export const toBase64Url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

export const fromBase64Url = (text) => {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

/**
 * Sammenligning som bruker like lang tid uansett hvor det første avviket er.
 *
 * `a === b` på en signatur forteller en tålmodig angriper hvor mange tegn som
 * stemte, ett tegn om gangen.
 */
export function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function hashPin(pin, saltB64) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromBase64Url(saltB64), iterations: PBKDF2_ROUNDS },
    key,
    256,
  )
  return toBase64Url(bits)
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return toBase64Url(await crypto.subtle.sign('HMAC', key, encoder.encode(message)))
}

/**
 * Et tegn er `base64url(payload).signatur`.
 *
 * Payloaden er lesbar for alle — den er ikke hemmelig, bare signert. Det som
 * ikke kan forfalskes er signaturen, og den dekker både navnet og utløpstida.
 *
 * DETTE er hva som gjør én konto mulig på tvers av spillene: et spill som
 * kjenner AUTH_SECRET kan avgjøre hvem spilleren er uten å slå opp i
 * kontodatabasen i det hele tatt. Ingen delt database, ingen kall mellom
 * tjenestene — bare en signatur alle kan regne ut på nytt.
 */
export async function issueToken(secret, username, now = Date.now()) {
  const payload = toBase64Url(encoder.encode(JSON.stringify({ u: username, e: now + TOKEN_TTL_MS })))
  return `${payload}.${await hmac(secret, payload)}`
}

/** Brukernavnet i et gyldig tegn, eller null. Kaster aldri. */
export async function verifyToken(secret, token, now = Date.now()) {
  if (!secret || typeof token !== 'string') return null
  const dot = token.indexOf('.')
  if (dot < 1) return null
  const payload = token.slice(0, dot)
  const signature = token.slice(dot + 1)
  if (!timingSafeEqual(signature, await hmac(secret, payload))) return null
  try {
    const { u, e } = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)))
    if (typeof u !== 'string' || typeof e !== 'number' || e < now) return null
    return u
  } catch {
    return null
  }
}

/** Tegnet i `Authorization: Bearer …`, eller tom streng. */
export function bearer(request) {
  const header = request.headers.get('Authorization') ?? ''
  return header.startsWith('Bearer ') ? header.slice(7) : ''
}

/**
 * Brukernavnet bak forespørselen, eller et ferdig 401/503-svar.
 *
 * Navnet kommer ALLTID herfra og aldri fra kroppen. Det er hele grunnen til at
 * en toppplassering er verdt noe.
 */
export async function requireUser(env, request) {
  if (!env.AUTH_SECRET) return { response: json({ error: 'not_configured' }, 503) }
  const username = await verifyToken(env.AUTH_SECRET, bearer(request))
  if (!username) return { response: json({ error: 'unauthorized' }, 401) }
  return { username }
}
