import { useTheme } from '../../context/ThemeContext'

function MoonIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    )
}

function SystemIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
    )
}

function SunIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
                <line
                    key={a}
                    x1={12 + 6.5 * Math.cos(a * Math.PI / 180)}
                    y1={12 + 6.5 * Math.sin(a * Math.PI / 180)}
                    x2={12 + 9.5 * Math.cos(a * Math.PI / 180)}
                    y2={12 + 9.5 * Math.sin(a * Math.PI / 180)}
                />
            ))}
        </svg>
    )
}

const INDICATOR_BG: Record<string, string> = {
    dark: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.5))',
    system: 'linear-gradient(135deg, rgba(156,163,175,0.3), rgba(107,114,128,0.4))',
    light: 'linear-gradient(135deg, rgba(251,191,36,0.4), rgba(249,115,22,0.45))',
}

const INDICATOR_TRANSLATE: Record<string, string> = {
    dark: 'translateX(4px)',
    system: 'translateX(calc(100% + 4px))',
    light: 'translateX(calc(200% + 4px))',
}

const SLOTS = [
    { value: 'dark' as const, label: 'Dark', Icon: MoonIcon, activeColor: '#a5b4fc' },
    { value: 'system' as const, label: 'System', Icon: SystemIcon, activeColor: 'var(--text)' },
    { value: 'light' as const, label: 'Light', Icon: SunIcon, activeColor: '#fbbf24' },
]

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme()

    return (
        <div
            role="group"
            aria-label="Theme"
            className="relative inline-grid grid-cols-3 items-center rounded-full p-1 shrink-0"
            style={{
                width: 120,
                height: 40,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                backdropFilter: 'blur(12px)',
            }}
        >
            <span
                className="absolute inset-y-1 rounded-full transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
                style={{
                    width: 'calc(33.333% - 3px)',
                    transform: INDICATOR_TRANSLATE[theme],
                    background: INDICATOR_BG[theme],
                }}
            />
            {SLOTS.map(({ value, label, Icon, activeColor }) => (
                <button
                    key={value}
                    type="button"
                    aria-label={label}
                    aria-pressed={theme === value}
                    onClick={() => setTheme(value)}
                    className="relative z-10 flex h-full items-center justify-center cursor-pointer transition-colors duration-200"
                    style={{ color: theme === value ? activeColor : 'var(--text-subtle)' }}
                >
                    <Icon />
                </button>
            ))}
        </div>
    )
}
