import { getToken } from '../account'

export const TOPICS = ['question', 'bug', 'account', 'privacy', 'other'] as const
export type Topic = (typeof TOPICS)[number]

export const CONTACT_LIMITS = { name: 60, email: 120, message: 2000, minMessage: 10 } as const

export interface ContactInput {
    topic: Topic
    name: string
    email: string
    message: string
    lang: string
    /** Honeypot. Real people never see it, so it is always empty for them. */
    website: string
    /** Milliseconds since the form was shown. */
    t: number
}

export type ContactResult = { ok: true } | { ok: false; error: string; retryAfter?: number }

const EMAIL_RE = /^[^\s@<>]{1,64}@[^\s@<>]+\.[^\s@<>]{2,}$/

/** The same checks as the server, so most mistakes never cost a round trip. */
export function checkContact(input: Pick<ContactInput, 'email' | 'message' | 'name'>): string | null {
    if (input.name.trim().length > CONTACT_LIMITS.name) return 'bad_name'
    const email = input.email.trim()
    if (email.length > CONTACT_LIMITS.email || !EMAIL_RE.test(email)) return 'bad_email'
    const length = input.message.trim().length
    if (length < CONTACT_LIMITS.minMessage) return 'message_short'
    if (length > CONTACT_LIMITS.message) return 'message_long'
    return null
}

const API_BASE = (import.meta.env.VITE_ACCOUNT_API as string | undefined) ?? '/api'

export async function sendContact(input: ContactInput): Promise<ContactResult> {
    const token = getToken()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    try {
        const response = await fetch(`${API_BASE}/contact`, {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify(input),
        })
        if (response.ok) return { ok: true }
        const body = (await response.json().catch(() => null)) as { error?: unknown } | null
        return { ok: false, error: typeof body?.error === 'string' ? body.error : 'service_failed' }
    } catch {
        return { ok: false, error: 'network' }
    } finally {
        clearTimeout(timer)
    }
}
