import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useTheme } from './ThemeContext'
import { useCookieConsent } from './useCookieConsent'
import { readPreference, writePreference } from '../lib/cookieConsent'
import { ACCENT_PRESETS, ACCENT_STORAGE_KEY, AccentContext, DEFAULT_ACCENT } from './accent-context'
import type { AccentColor } from './accent-context'

function getInitialAccent(): AccentColor {
    const stored = readPreference(ACCENT_STORAGE_KEY) as AccentColor | null
    if (stored && stored in ACCENT_PRESETS) return stored
    return DEFAULT_ACCENT
}

export function AccentProvider({ children }: { children: ReactNode }) {
    const { currentTheme } = useTheme()
    const { consent } = useCookieConsent()
    const [accent, setAccentState] = useState<AccentColor>(getInitialAccent)

    useEffect(() => {
        const preset = ACCENT_PRESETS[accent] ?? ACCENT_PRESETS[DEFAULT_ACCENT]
        document.documentElement.style.setProperty('--accent', currentTheme === 'dark' ? preset.dark : preset.light)

        if (consent === 'accepted') {
            writePreference(ACCENT_STORAGE_KEY, accent)
        }
    }, [accent, currentTheme, consent])

    return (
        <AccentContext.Provider value={{ accent, setAccent: setAccentState }}>
            {children}
        </AccentContext.Provider>
    )
}
