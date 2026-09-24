import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { CookieConsentContext } from './cookie-consent-context'
import { OPTIONAL_KEYS } from '../lib/cookieConsent'
import { declareStoredKeys, getConsent, onConsentChange, setConsent as recordConsent } from '../account'
import type { ConsentStatus } from '../account'

/*
 * Svaret eies av src/account/consent.ts, som er felles for forsiden og alle
 * spillene — samme nøkkel, samme regler. Et nei her gjelder også i spillene, og
 * et ja gitt i et spill gjelder her. Denne providerens jobb er bare å speile
 * svaret i React og styre når dialogen vises.
 *
 * Nøklene forsiden selv bruker meldes inn ved oppstart, så et nei — gitt her
 * eller i et spill — rydder dem bort. Økten er meldt inn av consent.ts selv.
 */
declareStoredKeys(OPTIONAL_KEYS)

export function CookieConsentProvider({ children }: { children: ReactNode }) {
    const [consent, setConsent] = useState<ConsentStatus>(getConsent)
    const [bannerVisible, setBannerVisible] = useState<boolean>(() => getConsent() === null)

    // svar gitt i en annen fane — et spill, eller forsiden i et annet vindu
    useEffect(
        () =>
            onConsentChange((status) => {
                setConsent(status)
                if (status !== null) setBannerVisible(false)
            }),
        [],
    )

    /*
     * recordConsent tar seg av det som må skje ved et svar: ja skriver en økt
     * som bare lå i minnet ned på disken, nei sletter økten og innstillingene fra
     * disken, men lar spilleren være innlogget til fanen lukkes.
     */
    function accept() {
        recordConsent('accepted')
        setBannerVisible(false)
    }

    function decline() {
        recordConsent('declined')
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
