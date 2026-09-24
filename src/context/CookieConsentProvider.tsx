import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { CookieConsentContext } from './cookie-consent-context'
import { CONSENT_KEY, OPTIONAL_KEYS, type ConsentStatus } from '../lib/cookieConsent'
import { getSession, setSession } from '../account'

function readConsent(): ConsentStatus {
    if (typeof window === 'undefined') return null
    const stored = window.localStorage.getItem(CONSENT_KEY)
    return stored === 'accepted' || stored === 'declined' ? stored : null
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
    const [consent, setConsent] = useState<ConsentStatus>(readConsent)
    const [bannerVisible, setBannerVisible] = useState<boolean>(() => readConsent() === null)

    function accept() {
        window.localStorage.setItem(CONSENT_KEY, 'accepted')
        /*
         * En spiller som logget inn før de svarte, har økten bare i minnet. Skrives
         * den ikke ned nå, er de logget ut i det øyeblikket de åpner et spill —
         * akkurat det de nettopp sa ja til å slippe.
         */
        const session = getSession()
        if (session) setSession(session)
        setConsent('accepted')
        setBannerVisible(false)
    }

    function decline() {
        window.localStorage.setItem(CONSENT_KEY, 'declined')
        // også innloggingen: spillene leser den samme nøkkelen, og et nei skal ikke
        // etterlate et tegn på disken de fortsatt kan finne. Økten i minnet blir
        // stående, så spilleren er logget inn til fanen lukkes.
        OPTIONAL_KEYS.forEach((key) => window.localStorage.removeItem(key))
        setConsent('declined')
        setBannerVisible(false)
    }

    function showBanner() {
        setBannerVisible(true)
    }

    // lukker uten å endre svaret — bare mulig når det finnes et svar fra før.
    // Stabil, fordi banneret låser fokus i en effekt som avhenger av den.
    const hideBanner = useCallback(() => {
        if (consent !== null) setBannerVisible(false)
    }, [consent])

    return (
        <CookieConsentContext.Provider value={{ consent, bannerVisible, accept, decline, showBanner, hideBanner }}>
            {children}
        </CookieConsentContext.Provider>
    )
}
