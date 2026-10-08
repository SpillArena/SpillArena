import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useTheme } from './ThemeContext'
import { useCookieConsent } from './useCookieConsent'
import { readPreference, writePreference } from '../lib/cookieConsent'
import { ACCENT_PRESETS, ACCENT_STORAGE_KEY, AccentContext, DEFAULT_ACCENT } from './accent-context'
import type { AccentColor } from './accent-context'

function luminance(hex: string): number {
    const linear = [1, 3, 5].map(offset => {
        const value = parseInt(hex.slice(offset, offset + 2), 16) / 255
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
}

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
        const color = preset[currentTheme]
        document.documentElement.style.setProperty('--accent', color)
        const lightContrast = 1.05 / (luminance(color) + 0.05)
        const darkContrast = (luminance(color) + 0.05) / (luminance('#24172f') + 0.05)
        const buttonInk = Math.max(lightContrast, darkContrast) < 4.5 ? '#000000' : lightContrast >= darkContrast ? '#ffffff' : '#24172f'
        document.documentElement.style.setProperty('--on-accent', buttonInk)

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
