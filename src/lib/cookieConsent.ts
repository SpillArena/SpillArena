export type ConsentStatus = 'accepted' | 'declined' | null

export const CONSENT_KEY = 'cookie-consent'

/**
 * Alt forsiden lagrer i nettleseren — ETT sted.
 *
 * Samtykkebanneret forklarer hver post med vanlige ord (nøklene vises ikke), og
 * et nei sletter nøklene. Står ny lagring ikke her, blir den verken forklart
 * eller ryddet bort, og da lover banneret noe siden ikke holder. Ny lagring på
 * forsiden: legg den til her, med en tekst i cookieConsent.items.
 *
 * `necessary` er svaret på selve spørsmålet. Det lagres også ved et nei, ellers
 * måtte vi spørre på nytt ved hvert besøk.
 */
export const STORAGE_ITEMS = [
    // samme nøkkel som STORAGE_KEY i src/account/session.ts — den er vendret og
    // eksporterer den ikke
    { id: 'session', keys: ['spillarena.session'], necessary: false },
    { id: 'settings', keys: ['theme', 'accent', 'lang'], necessary: false },
    { id: 'choice', keys: [CONSENT_KEY], necessary: true },
] as const

/** Nøklene et nei skal fjerne. */
export const OPTIONAL_KEYS: string[] = STORAGE_ITEMS.filter((item) => !item.necessary).flatMap(
    (item) => [...item.keys],
)

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
