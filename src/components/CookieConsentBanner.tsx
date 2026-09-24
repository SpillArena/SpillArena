import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { CircleCheck, Cloud, Cookie, KeyRound, Palette, TriangleAlert, X } from 'lucide-react'
import { useCookieConsent } from '../context/useCookieConsent'
import { STORAGE_ITEMS } from '../lib/cookieConsent'

const ITEM_ICONS = { session: KeyRound, settings: Palette, choice: CircleCheck } as const

const CONSEQUENCES = ['signin', 'progress', 'results', 'settings'] as const

/**
 * Samtykket — midt på skjermen, og det står der til spilleren har svart.
 *
 * Det lå før som en stripe nederst som lett ble oversett eller lukket uten å
 * leses, og et nei kostet mer enn det så ut som: uten lagring overlever ikke
 * innloggingen at spilleren går inn i et spill, og da havner verken fremgang
 * eller resultater på kontoen. Derfor sier dialogen det rett ut FØR valget, og
 * forklarer med vanlige ord hva som lagres (STORAGE_ITEMS, samme liste som et
 * nei rydder bort).
 *
 * Første gang kan den ikke lukkes uten et svar: ingen krysset, Escape eller klikk
 * utenfor. Åpnes den igjen fra innstillingene, finnes det alt et svar, og da kan
 * den lukkes som en vanlig dialog.
 *
 * Avslå og Godta er like store og like lette å nå. Et nei skal være et ekte valg.
 */
export default function CookieConsentBanner() {
    const { t } = useTranslation()
    const { consent, bannerVisible, accept, decline, showBanner, hideBanner } = useCookieConsent()
    const dismissible = consent !== null
    const dialogRef = useRef<HTMLDivElement>(null)
    // bare i minnet: å huske at påminnelsen er skjult, ville vært lagring uten samtykke
    const [reminderHidden, setReminderHidden] = useState(false)

    useEffect(() => {
        if (!bannerVisible) return
        const previousOverflow = document.body.style.overflow
        const previousFocus = document.activeElement as HTMLElement | null
        document.body.style.overflow = 'hidden'
        const frame = requestAnimationFrame(() => dialogRef.current?.focus())

        // fokus blir i dialogen: siden bak er dekket, og Tab skal ikke kunne gå dit
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                hideBanner()
                return
            }
            const dialog = dialogRef.current
            if (event.key !== 'Tab' || !dialog) return
            const focusable = dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')
            if (focusable.length === 0) return
            const first = focusable[0]
            const last = focusable[focusable.length - 1]
            const active = document.activeElement
            if (event.shiftKey && (active === first || active === dialog)) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && active === last) {
                event.preventDefault()
                first.focus()
            }
        }
        window.addEventListener('keydown', onKeyDown)

        return () => {
            cancelAnimationFrame(frame)
            window.removeEventListener('keydown', onKeyDown)
            document.body.style.overflow = previousOverflow
            previousFocus?.focus?.()
        }
    }, [bannerVisible, hideBanner])

    const showReminder = consent === 'declined' && !bannerVisible && !reminderHidden

    return (
        <>
            <AnimatePresence>
                {bannerVisible && (
                    <motion.div
                        key="consent-overlay"
                        className="fixed inset-0 z-[600] flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm sm:p-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={hideBanner}
                    >
                        <motion.div
                            ref={dialogRef}
                            tabIndex={-1}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="consent-title"
                            aria-describedby="consent-lead"
                            className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-3xl border shadow-2xl outline-none"
                            style={{ background: 'var(--surface-card)', borderColor: 'var(--border)', color: 'var(--text)' }}
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="pp-scroll flex-1 overflow-y-auto px-5 pb-5 pt-5 sm:px-7 sm:pt-7">
                                <div className="flex items-start gap-3">
                                    <span
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                                        style={{ background: 'color-mix(in srgb, var(--accent) 18%, transparent)' }}
                                    >
                                        <Cookie className="h-5 w-5" style={{ color: 'var(--accent)' }} aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--text-subtle)' }}>
                                            {t('cookieConsent.section')}
                                        </p>
                                        <h2 id="consent-title" className="font-[family-name:var(--font-serif)] text-xl font-semibold leading-snug sm:text-2xl">
                                            {t('cookieConsent.title')}
                                        </h2>
                                    </div>
                                    {dismissible && (
                                        <button
                                            type="button"
                                            onClick={hideBanner}
                                            aria-label={t('cookieConsent.close')}
                                            className="-mr-1 -mt-1 shrink-0 cursor-pointer rounded-full p-1.5 transition hover:bg-[var(--surface)]"
                                            style={{ color: 'var(--text-subtle)' }}
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>

                                <p id="consent-lead" className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-subtle)' }}>
                                    {t('cookieConsent.lead')}
                                </p>
                                <p className="mt-1.5 text-xs font-semibold" style={{ color: 'var(--text-subtle)' }}>
                                    {t('cookieConsent.scope')}
                                </p>

                                <div className="mt-4 rounded-2xl bg-amber-100 px-4 py-3 text-amber-950 dark:bg-amber-900/35 dark:text-amber-50">
                                    <p className="flex items-center gap-2 text-sm font-semibold">
                                        <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                                        {t('cookieConsent.withoutTitle')}
                                    </p>
                                    <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm leading-snug">
                                        {CONSEQUENCES.map((key) => (
                                            <li key={key}>{t(`cookieConsent.without.${key}`)}</li>
                                        ))}
                                    </ul>
                                </div>

                                <h3 className="mt-5 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--text-subtle)' }}>
                                    {t('cookieConsent.storedTitle')}
                                </h3>
                                <ul className="mt-2.5 flex flex-col gap-3">
                                    {STORAGE_ITEMS.map((item) => {
                                        const Icon = ITEM_ICONS[item.id]
                                        return (
                                            <li key={item.id} className="flex gap-3">
                                                <span
                                                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border"
                                                    style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                                                >
                                                    <Icon className="h-4 w-4" style={{ color: 'var(--text-subtle)' }} aria-hidden="true" />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
                                                        {t(`cookieConsent.items.${item.id}.title`)}
                                                        {item.necessary && (
                                                            <span
                                                                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                                                                style={{ background: 'var(--surface)', color: 'var(--text-subtle)' }}
                                                            >
                                                                {t('cookieConsent.alwaysStored')}
                                                            </span>
                                                        )}
                                                    </p>
                                                    {/* nøklene vises ikke — de sier en spiller ingenting;
                                                        teksten sier hva det er og hvorfor */}
                                                    <p className="text-xs leading-snug" style={{ color: 'var(--text-subtle)' }}>
                                                        {t(`cookieConsent.items.${item.id}.body`)}
                                                    </p>
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ul>

                                <p className="mt-4 flex gap-2.5 text-xs leading-snug" style={{ color: 'var(--text-subtle)' }}>
                                    <Cloud className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
                                    {t('cookieConsent.server')}
                                </p>
                                <p className="mt-2 text-xs font-medium" style={{ color: 'var(--text-subtle)' }}>
                                    {t('cookieConsent.noTracking')}
                                </p>
                            </div>

                            <div className="border-t px-5 py-4 sm:px-7" style={{ borderColor: 'var(--border)' }}>
                                {dismissible && (
                                    <p className="mb-2.5 text-xs" style={{ color: 'var(--text-subtle)' }}>
                                        {t('cookieConsent.current', {
                                            choice: t(consent === 'accepted' ? 'cookieConsent.choiceAccepted' : 'cookieConsent.choiceDeclined'),
                                        })}
                                    </p>
                                )}
                                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={decline}
                                        className="flex-1 cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors duration-200 hover:bg-[var(--surface)]"
                                        style={{ borderColor: 'var(--border)' }}
                                    >
                                        {t('cookieConsent.decline')}
                                    </button>
                                    {/* i mørk modus er aksenten en lys nyanse, og hvit tekst på den
                                        er vond å lese — derfor mørk tekst der */}
                                    <button
                                        type="button"
                                        onClick={accept}
                                        className="flex-1 cursor-pointer rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-transform dark:text-[var(--color-surface)] duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {t('cookieConsent.accept')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Et nei blir stående synlig. Ikke som mas — ett klikk skjuler den til
                neste besøk — men slik at ingen tror fremgangen lagres når den ikke gjør det. */}
            <AnimatePresence>
                {showReminder && (
                    <motion.div
                        key="consent-reminder"
                        role="status"
                        className="pointer-events-none fixed inset-x-0 bottom-4 z-[450] flex justify-center px-4"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                        <div
                            className="pointer-events-auto flex max-w-full items-center gap-2.5 rounded-full border py-1.5 pl-3.5 pr-1.5 text-sm shadow-[0_12px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl"
                            style={{ background: 'color-mix(in srgb, var(--surface-card) 94%, transparent)', borderColor: 'var(--border)' }}
                        >
                            <TriangleAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                            <span className="min-w-0 font-medium">{t('cookieConsent.reminder')}</span>
                            <button
                                type="button"
                                onClick={showBanner}
                                className="shrink-0 cursor-pointer rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white transition-transform dark:text-[var(--color-surface)] duration-200 hover:scale-[1.03] active:scale-[0.98]"
                            >
                                {t('cookieConsent.turnOn')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setReminderHidden(true)}
                                aria-label={t('cookieConsent.hideReminder')}
                                title={t('cookieConsent.hideReminder')}
                                className="shrink-0 cursor-pointer rounded-full p-1 transition hover:bg-[var(--surface)]"
                                style={{ color: 'var(--text-subtle)' }}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
