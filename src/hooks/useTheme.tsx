import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

interface ThemeContextValue {
    isDark: boolean
    toggleTheme: () => void
    setIsDark: (value: boolean | ((prev: boolean) => boolean)) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readInitialTheme(): boolean {
    if (typeof window === 'undefined') return true

    if (
        document.documentElement.classList.contains('dark') ||
        document.body.classList.contains('dark')
    ) return true

    const savedTheme = window.localStorage.getItem('theme')
    if (savedTheme === 'dark') return true
    if (savedTheme === 'light') return false

    return true
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [isDark, setIsDark] = useState<boolean>(readInitialTheme)

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark)
        document.body.classList.toggle('dark', isDark)
        window.localStorage.setItem('theme', isDark ? 'dark' : 'light')
    }, [isDark])

    const toggleTheme = () => setIsDark((value) => !value)

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, setIsDark }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
