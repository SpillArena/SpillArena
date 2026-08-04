import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { useCookieConsent } from '../context/useCookieConsent'

export default function CookieConsentBanner() {
    const { t } = useTranslation()
    const { bannerVisible, accept, decline } = useCookieConsent()

    return (
        <AnimatePresence>
            {bannerVisible && (
                <motion.div
                    role="dialog"
                    aria-label={t('cookieConsent.section')}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 24 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="fixed inset-x-0 bottom-0 z-[500] flex justify-center px-4 pb-4 sm:px-6"
                >
                    <div
                        className="flex w-full max-w-screen-md flex-col gap-3 rounded-2xl border p-4 shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between"
                        style={{
                            background: 'color-mix(in srgb, var(--surface-card) 94%, transparent)',
                            borderColor: 'var(--border)',
                        }}
                    >
                        <p className="text-sm text-[var(--text-subtle)]">
                            {t('cookieConsent.message')}
                        </p>
                        <div className="flex shrink-0 gap-2">
                            <button
                                type="button"
                                onClick={decline}
                                className="cursor-pointer rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-subtle)] transition-colors duration-200 hover:text-[var(--text)]"
                            >
                                {t('cookieConsent.decline')}
                            </button>
                            <button
                                type="button"
                                onClick={accept}
                                className="cursor-pointer rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {t('cookieConsent.accept')}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
