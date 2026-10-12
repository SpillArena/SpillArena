/**
 * Delt kode for kontaktskjemaet: validering, vern mot søppel og e-postvarsling.
 *
 * Ligger utenfor functions/ av samme grunn som account-server.js: alt som
 * ligger der blir en rute.
 */

import { toBase64Url } from './account-server.js'

export const TOPICS = ['question', 'bug', 'account', 'privacy', 'other']
export const LIMITS = { name: 60, email: 120, message: 2000, minMessage: 10 }

/** Raskere enn dette har ingen fylt ut skjemaet. */
export const MIN_FILL_MS = 2500
/** Meldinger per avsender per time. */
export const MAX_PER_HOUR = 5
export const HOUR_MS = 60 * 60 * 1000
export const RETENTION_MS = 365 * 24 * 60 * 60 * 1000
export const MAX_BODY_BYTES = 8 * 1024

const EMAIL_RE = /^[^\s@<>]{1,64}@[^\s@<>]+\.[^\s@<>]{2,}$/
// kontrolltegn bort, men linjeskift og tabulator beholdes i selve meldingen
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g

const clean = (value) => String(value).replace(CONTROL, '').trim()

/**
 * Kroppen som en ren verdi, eller en feilkode.
 *
 * `spam: true` betyr at honningfella eller klokka slo ut. Kalleren svarer da
 * som om alt gikk bra og lagrer ingenting, så en bot ikke får vite hva som
 * stoppet den.
 */
export function validateContact(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { error: 'bad_body' }

  const honeypot = typeof body.website === 'string' ? body.website.trim() : ''
  const filledIn = typeof body.t === 'number' ? body.t : Number.POSITIVE_INFINITY
  if (honeypot || filledIn < MIN_FILL_MS) return { spam: true }

  if (!TOPICS.includes(body.topic)) return { error: 'bad_topic' }

  const name = body.name == null || body.name === '' ? '' : typeof body.name === 'string' ? clean(body.name) : null
  if (name === null || name.length > LIMITS.name) return { error: 'bad_name' }

  const email = typeof body.email === 'string' ? clean(body.email) : ''
  if (email.length > LIMITS.email || !EMAIL_RE.test(email)) return { error: 'bad_email' }

  const message = typeof body.message === 'string' ? clean(body.message) : ''
  if (message.length < LIMITS.minMessage) return { error: 'message_short' }
  if (message.length > LIMITS.message) return { error: 'message_long' }

  const lang = body.lang === 'en' ? 'en' : 'no'
  return { value: { topic: body.topic, name, email, message, lang } }
}

/**
 * Hva som skiller én avsender fra en annen i telleren, uten å lagre adressen.
 * Skifter hver dag fordi datoen er med.
 */
export async function senderHash(secret, ip, now = new Date()) {
  const day = now.toISOString().slice(0, 10)
  const bytes = new TextEncoder().encode(`${secret ?? ''}|${ip || 'unknown'}|${day}`)
  return toBase64Url(await crypto.subtle.digest('SHA-256', bytes))
}

/**
 * Varsler support på e-post, når RESEND_API_KEY er satt. Uten nøkkel gjør den
 * ingenting: meldingen ligger uansett i databasen og i adminpanelet.
 *
 * Feil her skal aldri velte innsendingen — spilleren har allerede fått meldingen
 * lagret — så de går til loggen og ikke til klienten.
 */
export async function notifySupport(env, message) {
  if (!env.RESEND_API_KEY) return
  const subject = `[SpillArena] ${message.topic}: ${message.message.replace(/\s+/g, ' ').slice(0, 60)}`
  const lines = [
    `Fra: ${message.name || '(uten navn)'} <${message.email}>`,
    `Emne: ${message.topic}`,
    `Konto: ${message.username ?? '(ikke innlogget)'}`,
    `Språk: ${message.lang}`,
    '',
    message.message,
  ]
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.CONTACT_FROM || 'SpillArena <no-reply@spillarena.no>',
        to: [env.CONTACT_TO || 'support@spillarena.no'],
        reply_to: message.email,
        subject,
        text: lines.join('\n'),
      }),
    })
    if (!response.ok) console.error('contact mail failed', response.status)
  } catch (error) {
    console.error('contact mail failed', error)
  }
}
