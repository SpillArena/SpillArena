import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiSettings } from 'react-icons/fi'
import { SUPPORTED_LANGUAGES } from '../../i18n/i18n'
import { ACCENT_PRESETS, type AccentColor } from '../../context/accent-context'
import { useAccent } from '../../context/useAccent'
import { type Theme, useTheme } from '../../context/ThemeContext'
import { useCookieConsent } from '../../context/useCookieConsent'
import { writePreference } from '../../lib/cookieConsent'

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

export default function SettingsMenu() {
    const { i18n, t } = useTranslation()
    const { theme, currentTheme, setTheme } = useTheme()
    const { accent, setAccent } = useAccent()
    const { consent, accept, decline, showBanner } = useCookieConsent()
    const [open, setOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement | null>(null)

    const THEME_OPTIONS: { value: Theme; labelKey: string; Icon: () => React.JSX.Element; activeColor: string }[] = [
        { value: 'dark', labelKey: 'theme.dark', Icon: MoonIcon, activeColor: '#a5b4fc' },
        { value: 'system', labelKey: 'theme.system', Icon: SystemIcon, activeColor: 'var(--text)' },
        { value: 'light', labelKey: 'theme.light', Icon: SunIcon, activeColor: '#fbbf24' },
    ]

    const currentLanguage =
        SUPPORTED_LANGUAGES.find((language) => language.code === i18n.language)?.code ??
        i18n.resolvedLanguage ??
        'no'

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        window.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [])

    async function handleLanguageSelect(code: string) {
        await i18n.changeLanguage(code)
        writePreference('lang', code)
    }

    return (
        <div ref={rootRef} className="relative inline-flex">
            <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-label={t('settingsMenu.settings')}
                onClick={() => setOpen((value) => !value)}
                className={`
                    pp-dropdown-trigger group relative inline-flex h-10 w-10 items-center justify-center rounded-full border
                    motion-reduce:transition-none cursor-pointer
                    ${open
                        ? 'border-[var(--accent)] bg-[color:color-mix(in_srgb,var(--surface-card)_90%,#000_10%)] text-[var(--text)] shadow-[0_12px_30px_rgba(0,0,0,0.18)] ring-4 ring-[color:color-mix(in_srgb,var(--accent)_16%,transparent)]'
                        : 'border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_92%,#000_8%)] text-[var(--text)] shadow-[0_8px_24px_rgba(0,0,0,0.14)] hover:border-[var(--border-hover)] hover:bg-[color:color-mix(in_srgb,var(--surface-card)_88%,#000_12%)] active:translate-y-0 active:scale-[0.985] active:shadow-[0_4px_14px_rgba(0,0,0,0.14)]'
                    }
                `}
            >
                <FiSettings
                    aria-hidden="true"
                    className={`
                        h-4.5 w-4.5 shrink-0 transition-transform duration-300 ease-out
                        ${open ? 'rotate-45 text-[var(--accent)]' : 'text-[var(--text-subtle)] group-hover:text-[var(--text)]'}
                    `}
                />
            </button>

            <div
                role="dialog"
                aria-label={t('settingsMenu.settings')}
                className={`
                    pp-dropdown-panel pp-scroll absolute right-0 top-[calc(100%+0.6rem)] z-[400] w-72 max-w-[calc(100vw-2rem)]
                    max-h-[70vh] overflow-y-auto rounded-[1.4rem]
                    transition-all duration-200 ease-out origin-top-right motion-reduce:transition-none
                    ${open
                        ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
                        : 'pointer-events-none -translate-y-1 scale-[0.98] opacity-0'
                    }
                `}
            >
                <div className="flex flex-col gap-4 p-4">
                    <section>
                        <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-subtle)]">
                            {t('languageSwitcher.section')}
                        </h3>
                        <div role="listbox" aria-label={t('languageSwitcher.choose')} className="flex flex-col gap-1">
                            {SUPPORTED_LANGUAGES.map((language) => {
                                const selected = language.code === currentLanguage
                                return (
                                    <button
                                        key={language.code}
                                        type="button"
                                        role="option"
                                        aria-selected={selected}
                                        onClick={() => void handleLanguageSelect(language.code)}
                                        className={`
                                            pp-dropdown-item flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left
                                            motion-reduce:transition-none cursor-pointer
                                            ${selected
                                                ? 'text-[var(--text)]'
                                                : 'text-[var(--text-subtle)] hover:bg-[var(--surface)] hover:text-[var(--text)] active:scale-[0.99]'
                                            }
                                        `}
                                    >
                                        <span className="font-medium">{language.label}</span>
                                        {selected && (
                                            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" aria-hidden="true" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </section>

                    <section className="border-t border-[var(--border)] pt-4">
                        <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-subtle)]">
                            {t('settingsMenu.appearance')}
                        </h3>
                        <div className="relative grid grid-cols-3 gap-1 rounded-xl bg-[color:color-mix(in_srgb,var(--surface)_92%,#000_8%)] p-1.5 ring-1 ring-white/5">
                            <span
                                className="absolute inset-y-1 rounded-lg transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
                                style={{
                                    width: 'calc(33.333% - 3px)',
                                    transform: INDICATOR_TRANSLATE[theme],
                                    background: INDICATOR_BG[theme],
                                }}
                            />
                            {THEME_OPTIONS.map(({ value, labelKey, Icon, activeColor }) => {
                                const selected = theme === value
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        aria-label={t(labelKey)}
                                        aria-pressed={selected}
                                        onClick={() => setTheme(value)}
                                        style={{ color: selected ? activeColor : 'var(--text-subtle)' }}
                                        className="pp-dropdown-item relative z-10 flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold hover:text-[var(--text)] cursor-pointer"
                                    >
                                        <Icon />
                                        {t(labelKey)}
                                    </button>
                                )
                            })}
                        </div>
                    </section>

                    <section className="border-t border-[var(--border)] pt-4">
                        <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-subtle)]">
                            {t('settingsMenu.accentColor')}
                        </h3>
                        <div role="listbox" aria-label={t('settingsMenu.chooseAccent')} className="flex flex-wrap gap-2 px-1">
                            {(Object.keys(ACCENT_PRESETS) as AccentColor[]).map((color) => {
                                const preset = ACCENT_PRESETS[color]
                                const selected = color === accent
                                return (
                                    <button
                                        key={color}
                                        type="button"
                                        role="option"
                                        aria-selected={selected}
                                        aria-label={preset.label}
                                        onClick={() => setAccent(color)}
                                        className={`
                                            pp-dropdown-item flex h-9 w-9 items-center justify-center rounded-full border-2 cursor-pointer
                                            ${selected
                                                ? 'border-[var(--accent)] scale-110'
                                                : 'border-transparent hover:scale-105'
                                            }
                                        `}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="h-6 w-6 rounded-full ring-1 ring-black/10"
                                            style={{ background: preset[currentTheme] }}
                                        />
                                    </button>
                                )
                            })}
                        </div>
                    </section>

                    <section className="border-t border-[var(--border)] pt-4">
                        <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-subtle)]">
                            {t('cookieConsent.section')}
                        </h3>
                        <p className="mb-2 px-1 text-xs text-[var(--text-subtle)]">
                            {consent === 'accepted'
                                ? t('cookieConsent.statusAccepted')
                                : consent === 'declined'
                                    ? t('cookieConsent.statusDeclined')
                                    : t('cookieConsent.statusUndecided')}
                        </p>
                        {consent === null && (
                            <div className="flex gap-2 px-1">
                                <button
                                    type="button"
                                    onClick={accept}
                                    className="flex-1 rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                >
                                    {t('cookieConsent.accept')}
                                </button>
                                <button
                                    type="button"
                                    onClick={decline}
                                    className="flex-1 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-subtle)] transition-colors duration-200 hover:text-[var(--text)] cursor-pointer"
                                >
                                    {t('cookieConsent.decline')}
                                </button>
                            </div>
                        )}
                        {consent !== null && (
                            <button
                                type="button"
                                onClick={showBanner}
                                className="mt-2 w-full px-1 text-left text-xs underline text-[var(--text-subtle)] hover:text-[var(--text)] cursor-pointer"
                            >
                                {t('cookieConsent.manage')}
                            </button>
                        )}
                    </section>
                </div>
            </div>
        </div>
    )
}
