/**
 * Delt kode for kontaktskjemaet: validering, vern mot søppel og e-postvarsling.
 *
 * Ligger utenfor functions/ av samme grunn som account-server.js: alt som
 * ligger der blir en rute.
 */

import { bearer, requireUser, toBase64Url } from './account-server.js'
import nodemailer from 'nodemailer'

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
  if (!name || name.length > LIMITS.name) return { error: 'bad_name' }

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

/** Only verified, current accounts may be attached to a support request. */
export async function contactAccount(env, request) {
  if (!bearer(request)) return { account: null }
  const auth = await requireUser(env, request)
  if (auth.response) return auth
  const account = await env.DB.prepare(
    `SELECT username, created_at AS createdAt, last_seen AS lastSeen FROM players WHERE username = ?`,
  ).bind(auth.username).first()
  return { account }
}

export function mailConfigured(env) {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD) || Boolean(env.RESEND_API_KEY)
}

/** Fixed recipients and authenticated sender; replies go to the form's email. */
export function supportMail(env, message) {
  const subject = `[SpillArena] ${message.topic}: ${message.message.replace(/\s+/g, ' ').slice(0, 60)}`
  const lines = [
    `Fra: ${message.name || '(uten navn)'} <${message.email}>`,
    `Emne: ${message.topic}`,
    `Konto: ${message.username ?? '(ikke innlogget)'}`,
    ...(message.account ? [
      `Konto opprettet: ${message.account.createdAt}`,
      `Sist aktiv: ${message.account.lastSeen}`,
    ] : []),
    `Meldingsnummer: ${message.id}`,
    `Språk: ${message.lang}`,
    '',
    message.message,
  ]
  return {
    from: env.CONTACT_FROM || 'SpillArena <support@spillarena.no>',
    to: [env.CONTACT_TO || 'support@spillarena.no'],
    replyTo: message.email,
    subject,
    text: lines.join('\n'),
    messageId: `<contact-${message.id}@spillarena.no>`,
  }
}

/** SMTP uses implicit TLS on 465, with normal certificate verification. */
export function smtpOptions(env) {
  return {
    host: env.SMTP_HOST,
    port: 465,
    secure: true,
    name: 'spillarena.no',
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    logger: false,
    debug: false,
    disableFileAccess: true,
    disableUrlAccess: true,
  }
}

/** A notification failure never discards the message stored in the inbox. */
export async function notifySupport(env, message) {
  if (!mailConfigured(env)) return 'not_configured'
  const mail = supportMail(env, message)
  let transport
  let deadline
  try {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD) {
      transport = nodemailer.createTransport(smtpOptions(env))
      const result = await Promise.race([
        transport.sendMail(mail),
        new Promise((_, reject) => {
          deadline = setTimeout(() => {
            transport.close()
            reject(new Error('smtp_timeout'))
          }, 20000)
        }),
      ])
      return result.accepted?.length === mail.to.length ? 'sent' : 'failed'
    }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `contact/${message.id}`,
      },
      body: JSON.stringify({
        from: mail.from,
        to: mail.to,
        reply_to: mail.replyTo,
        subject: mail.subject,
        text: mail.text,
      }),
    })
    const result = await response.json().catch(() => null)
    if (response.ok && typeof result?.id === 'string' && result.id) return 'sent'
    console.error('contact mail failed', { id: message.id, status: response.status })
  } catch (error) {
    const reason = ['EAUTH', 'ECONNECTION', 'ETIMEDOUT', 'ESOCKET', 'EDNS', 'ETLS'].includes(error?.code)
      ? error.code : 'transport_failed'
    console.error('contact mail failed', { id: message.id, reason })
  } finally {
    clearTimeout(deadline)
    transport?.close()
  }
  return 'failed'
}

/** Keep a saved support request successful even if notification delivery fails. */
export async function notifyStoredContact(env, message) {
  try {
    const status = await notifySupport(env, message)
    await env.DB.prepare(`UPDATE contact_messages SET notification_status = ? WHERE id = ?`)
      .bind(status, message.id).run()
  } catch {
    console.error('contact notification status failed', { id: message.id })
  }
}
