import { useState } from 'react'
import type { ReactNode } from 'react'
import { CookieConsentContext } from './cookie-consent-context'
import type { ConsentStatus } from '../lib/cookieConsent'

const CONSENT_KEY = 'cookie-consent'
const PREFERENCE_KEYS = ['theme', 'accent', 'lang']

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
        setConsent('accepted')
        setBannerVisible(false)
    }

    function decline() {
        window.localStorage.setItem(CONSENT_KEY, 'declined')
        PREFERENCE_KEYS.forEach((key) => window.localStorage.removeItem(key))
        setConsent('declined')
        setBannerVisible(false)
    }

    function showBanner() {
        setBannerVisible(true)
    }

    return (
        <CookieConsentContext.Provider value={{ consent, bannerVisible, accept, decline, showBanner }}>
            {children}
        </CookieConsentContext.Provider>
    )
}
