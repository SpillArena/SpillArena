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

import { checkName } from '../src/account/username-policy.ts'

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

export const PIN_MIN = 4
export const PIN_MAX = 6
export const PIN_RE = new RegExp(`^\\d{${PIN_MIN},${PIN_MAX}}$`)
export const USERNAME_MAX = 20

/**
 * Regelen for et brukernavn — ETT sted.
 *
 * Den sto i functions/api/auth/ og trengs nå også av navnebytte i
 * functions/api/account/. To kopier av en slik regel driver fra hverandre i
 * det stille: den ene slipper inn et navn den andre ville nektet, og hvilken
 * av dem som gjelder blir et spørsmål om hvilket endepunkt du traff.
 *
 * Regelen er med vilje løsere enn reglene spillene har for gjestenavn. Den
 * tillater mellomrom, punktum og apostrof, fordi et navn på en tavle skal kunne
 * være et navn. Se src/account/identity.ts for hvorfor spillene da MÅ hoppe
 * over sin egen strengere sjekk for en innlogget spiller.
 *
 * Returnerer en feilkode, eller null når navnet er greit.
 */
export function validateUsername(username) {
  if (typeof username !== 'string') return 'bad_username'
  const trimmed = username.trim()

  /*
   * ÉN KODE PER GRUNN.
   *
   * Alle tre sa `bad_username` før, og klienten kunne bare svare «det navnet
   * kan ikke brukes» — sant, men ubrukelig: spilleren vet fortsatt ikke om
   * navnet var for langt, hadde et tegn som ikke er lov, eller var tomt. En
   * feilmelding som ikke sier hva som skal endres, ber spilleren gjette.
   */
  if (!trimmed) return 'username_empty'
  if (trimmed.length > USERNAME_MAX) return 'username_too_long'
  // ingen kontroll- eller formateringstegn: et navn på en tavle skal være det
  // samme navnet uansett hva som renderer det
  if (!/^[\p{L}\p{N} ._'-]+$/u.test(trimmed)) return 'username_chars'

  /*
   * Navnefilteret kjører HER, på tjeneren, og ikke bare i skjemaet.
   * Registrering er et POST-kall hvem som helst kan gjøre med curl, så en
   * sjekk som bare finnes i klienten er ingen sjekk. Dette var hullet:
   * spillene hadde hver sin liste, mens kontoen — den ene identiteten på tvers
   * av alle fem — ble laget helt uten.
   */
  const rejected = checkName(trimmed)
  if (rejected) return rejected === 'reserved' ? 'name_reserved' : 'name_not_allowed'

  return null
}

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
  /*
   * `i` er når tegnet ble utstedt. Det er det requireUser holder opp mot
   * `tokens_valid_from` på raden, så et bytte av PIN kan kaste ut tegn som ble
   * gitt før. Spillenes egne kopier av verifyToken leser bare `u` og `e`, så
   * feltet er usynlig for dem.
   */
  const payload = toBase64Url(
    encoder.encode(JSON.stringify({ u: username, e: now + TOKEN_TTL_MS, i: now })),
  )
  return `${payload}.${await hmac(secret, payload)}`
}

/**
 * Navnet og utstedelsestida i et gyldig tegn, eller null. Kaster aldri.
 *
 * Tegn fra før `i` fantes regnes som utstedt `TOKEN_TTL_MS` før de går ut —
 * nøyaktig det de ble, så lenge levetida ikke er endret siden.
 */
export async function verifyTokenClaims(secret, token, now = Date.now()) {
  if (!secret || typeof token !== 'string') return null
  const dot = token.indexOf('.')
  if (dot < 1) return null
  const payload = token.slice(0, dot)
  const signature = token.slice(dot + 1)
  if (!timingSafeEqual(signature, await hmac(secret, payload))) return null
  try {
    const { u, e, i } = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)))
    if (typeof u !== 'string' || typeof e !== 'number' || e < now) return null
    return { username: u, issuedAt: typeof i === 'number' ? i : e - TOKEN_TTL_MS }
  } catch {
    return null
  }
}

/** Brukernavnet i et gyldig tegn, eller null. Kaster aldri. */
export async function verifyToken(secret, token, now = Date.now()) {
  return (await verifyTokenClaims(secret, token, now))?.username ?? null
}

/*
 * KODER FOR GLEMT PIN — se migrations/0010_pin_recovery.sql.
 *
 * Crockfords base32: ingen I, L, O eller U. Det som ser likt ut, leses likt —
 * O blir 0, I og L blir 1 — så en kode skrevet av fra en lapp virker selv om
 * spilleren gjettet feil på hvilket tegn det var.
 */
const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/** Lengden på spillerens egen kode: 60 bit. */
export const RECOVERY_CODE_LENGTH = 12
/** Lengden på en engangskode fra admin: 40 bit, men den lever bare et døgn. */
export const RESET_CODE_LENGTH = 8
export const RESET_CODE_TTL_MS = 24 * 60 * 60 * 1000

/** En ny tilfeldig kode, i grupper på fire: `K7QM-2XRP-9FHD`. */
export function newCode(length) {
  // 256 er delelig med 32, så `% 32` gir like stor sjanse for hvert tegn
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  const chars = Array.from(bytes, (byte) => CODE_ALPHABET[byte % 32]).join('')
  return chars.match(/.{1,4}/g).join('-')
}

/**
 * Koden slik den lagres og sammenlignes: store bokstaver, uten bindestreker og
 * mellomrom, med forvekslingene rettet. Null når den ikke kan være en kode.
 */
export function normalizeCode(input) {
  if (typeof input !== 'string') return null
  const code = input
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
  if (code.length !== RECOVERY_CODE_LENGTH && code.length !== RESET_CODE_LENGTH) return null
  for (const char of code) if (!CODE_ALPHABET.includes(char)) return null
  return code
}

/**
 * SHA-256 over salt og kode. Ikke PBKDF2: en kode har 40–60 bit tilfeldighet,
 * og det er nok til at en lekket hash ikke kan prøves tilbake. Den sparer også
 * CPU — /api/auth { action: 'recover' } må hashe den nye PIN-en i samme kall.
 */
export async function hashCode(code, saltB64) {
  const salt = fromBase64Url(saltB64)
  const bytes = new Uint8Array(salt.length + code.length)
  bytes.set(salt)
  bytes.set(encoder.encode(code), salt.length)
  return toBase64Url(await crypto.subtle.digest('SHA-256', bytes))
}

export const newSalt = () => toBase64Url(crypto.getRandomValues(new Uint8Array(16)))

/** En ny kode, og hashen og saltet den skal lagres som. */
export async function codeWithHash(length) {
  const code = newCode(length)
  const salt = newSalt()
  return { code, salt, hash: await hashCode(normalizeCode(code), salt) }
}

/** Tegnet i `Authorization: Bearer …`, eller tom streng. */
export function bearer(request) {
  const header = request.headers.get('Authorization') ?? ''
  return header.startsWith('Bearer ') ? header.slice(7) : ''
}

/**
 * Brukernavnet bak forespørselen, og om kontoen er admin — eller et ferdig
 * feilsvar.
 *
 * Navnet kommer ALLTID herfra og aldri fra kroppen. Det er hele grunnen til at
 * en toppplassering er verdt noe.
 *
 * RADEN SLÅS OPP. Signaturen alene sier bare at tegnet en gang ble utstedt; den
 * vet ikke at kontoen siden er slettet eller utestengt. Hvert endepunkt her
 * snakker med databasen uansett, så ett oppslag på primærnøkkelen er billig.
 * Spillene verifiserer fortsatt uten oppslag — dette gjelder bare /api/*.
 *
 * En utestengt konto får 401, ikke 403: 401 er det hver kopi av src/account/,
 * også de i spillene, allerede tolker som «kast økten». Da blir spilleren
 * logget ut over alt ved neste kall, uten at spillene må oppdateres.
 */
export async function requireUser(env, request) {
  if (!env.AUTH_SECRET) return { response: json({ error: 'not_configured' }, 503) }
  const claims = await verifyTokenClaims(env.AUTH_SECRET, bearer(request))
  if (!claims) return { response: json({ error: 'unauthorized' }, 401) }
  const { username } = claims

  let row
  try {
    // SELECT * og ikke en kolonneliste: kjører koden før migrasjon 0009, finnes
    // ikke `admin` og `banned_at` ennå, og en navngitt kolonne ville felt hvert
    // eneste kall. Uten kolonnene er ingen admin og ingen utestengt.
    row = await env.DB.prepare(`SELECT * FROM players WHERE username = ?`).bind(username).first()
  } catch (error) {
    return { response: json({ error: 'service_failed', details: String(error) }, 500) }
  }
  if (!row) return { response: json({ error: 'unauthorized' }, 401) }
  if (row.banned_at) return { response: json({ error: 'banned' }, 401) }
  /*
   * Et tegn fra før PIN-en sist ble byttet. Spillene sjekker ikke dette — de
   * slår ikke opp raden — så et slikt tegn kan fortsatt sende inn resultater
   * til det går ut. Men det kommer ikke inn på kontoen.
   */
  if (row.tokens_valid_from && claims.issuedAt < Date.parse(row.tokens_valid_from)) {
    return { response: json({ error: 'unauthorized' }, 401) }
  }
  return { username: row.username, admin: row.admin === 1 }
}
