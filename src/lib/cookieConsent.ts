export type ConsentStatus = 'accepted' | 'declined' | null

const CONSENT_KEY = 'cookie-consent'

export function getConsent(): ConsentStatus {
    if (typeof window === 'undefined') return null
    const stored = window.localStorage.getItem(CONSENT_KEY)
    return stored === 'accepted' || stored === 'declined' ? stored : null
}

export function hasConsent(): boolean {
    return getConsent() === 'accepted'
}

export function readPreference(key: string): string | null {
    if (typeof window === 'undefined' || !hasConsent()) return null
    return window.localStorage.getItem(key)
}

export function writePreference(key: string, value: string) {
    if (typeof window === 'undefined' || !hasConsent()) return
    window.localStorage.setItem(key, value)
}
