import { createContext } from 'react'
import type { ConsentStatus } from '../lib/cookieConsent'

export interface CookieConsentContextValue {
    consent: ConsentStatus
    bannerVisible: boolean
    accept: () => void
    decline: () => void
    showBanner: () => void
}

export const CookieConsentContext = createContext<CookieConsentContextValue | null>(null)
