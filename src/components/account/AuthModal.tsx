import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { authenticate } from '../../account'
import type { AuthAction } from '../../account'
import { hasConsent } from '../../lib/cookieConsent'

interface AuthModalProps {
    open: boolean
    onClose: () => void
}

/**
 * The form is its own component so that closing the modal UNMOUNTS it.
 *
 * It used to be one component that cleared the PIN and the error in an effect
 * whenever `open` went false. That worked, but it meant the typed PIN sat in
 * React state for as long as the page was open, and it made closing a render
 * that sets state during another render. Letting it unmount does both jobs at
 * once: the state is gone because the component is gone.
 */
function AuthForm({ onClose }: { onClose: () => void }) {
    const { t } = useTranslation()
    const [action, setAction] = useState<AuthAction>('login')
    const [username, setUsername] = useState('')
    const [pin, setPin] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)

    const submit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (busy) return

        /*
         * En ny PIN bekreftes før noe sendes.
         *
         * Registrerer du deg med en tastefeil, har du en konto ingen kommer inn
         * i: PIN-en vises aldri tilbake, det finnes ingen e-post å nullstille
         * med, og navnet er opptatt fra da av. Innlogging har ingen slik felle
         * — feil PIN feiler bare, og kan prøves på nytt — så det andre feltet
         * ville bare vært i veien der.
         *
         * `pin_mismatch` er ikke en kode fra tjeneren. Den ligger likevel under
         * samme `account.errors.*` som resten, fordi spilleren ikke bryr seg om
         * hvor feilen ble oppdaget.
         */
        if (action === 'register' && pin !== confirm) {
            setError('pin_mismatch')
            setConfirm('')
            return
        }

        setBusy(true)
        setError(null)
        const result = await authenticate(action, username, pin)
        setBusy(false)
        if (result.ok) {
            setPin('')
            setConfirm('')
            onClose()
            return
        }
        setError(result.error)
    }

    return (
                <motion.div
                    key="auth-overlay"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="w-full max-w-sm rounded-2xl border border-[color:color-mix(in_srgb,var(--accent)_35%,transparent)] bg-white/95 shadow-2xl dark:bg-slate-900/95"
                        initial={{ opacity: 0, scale: 0.92, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 16 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label={t('account.title')}
                    >
                        <div className="flex items-center justify-between border-b border-[color:color-mix(in_srgb,var(--accent)_20%,transparent)] p-6">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                {t(action === 'login' ? 'account.signIn' : 'account.register')}
                            </h2>
                            <button
                                onClick={onClose}
                                className="cursor-pointer text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                aria-label={t('close')}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={submit} className="flex flex-col gap-4 p-6">
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                {t('account.blurb')}
                            </p>

                            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                                {t('account.username')}
                                <input
                                    value={username}
                                    onChange={(event) => setUsername(event.target.value)}
                                    maxLength={20}
                                    autoComplete="username"
                                    required
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[color:var(--accent)] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                />
                            </label>

                            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                                {t('account.pin')}
                                <input
                                    value={pin}
                                    onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
                                    inputMode="numeric"
                                    pattern="\d{4,6}"
                                    minLength={4}
                                    maxLength={6}
                                    autoComplete={action === 'login' ? 'current-password' : 'new-password'}
                                    type="password"
                                    required
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm tracking-[0.4em] text-slate-900 outline-none focus:border-[color:var(--accent)] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                />
                                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                    {t('account.pinHint')}
                                </span>
                            </label>

                            {action === 'register' && (
                                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t('account.repeatPin')}
                                    <input
                                        value={confirm}
                                        onChange={(event) => setConfirm(event.target.value.replace(/\D/g, ''))}
                                        inputMode="numeric"
                                        pattern="\d{4,6}"
                                        minLength={4}
                                        maxLength={6}
                                        autoComplete="new-password"
                                        type="password"
                                        required
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm tracking-[0.4em] text-slate-900 outline-none focus:border-[color:var(--accent)] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    />
                                </label>
                            )}

                            {/* Uten samtykke blir ingenting lagret, og økten dør når fanen gjør
                                det. Bedre å si det før innlogging enn å la den forsvinne. */}
                            {!hasConsent() && (
                                <p className="rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                                    {t('account.noConsent')}
                                </p>
                            )}

                            {error && (
                                <p role="alert" className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-900/40 dark:text-red-100">
                                    {t(`account.errors.${error}`, { defaultValue: t('account.errors.service_failed') })}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={busy}
                                className="cursor-pointer rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg disabled:cursor-progress disabled:opacity-60"
                            >
                                {t(action === 'login' ? 'account.signIn' : 'account.register')}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setAction(action === 'login' ? 'register' : 'login')
                                    setError(null)
                                    setConfirm('')
                                }}
                                className="cursor-pointer text-sm text-slate-600 underline-offset-2 hover:underline dark:text-slate-300"
                            >
                                {t(action === 'login' ? 'account.switchToRegister' : 'account.switchToSignIn')}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
    )
}

/**
 * Registrering og innlogging for hele SpillArena.
 *
 * Feilen fra tjeneren er en kode, ikke en setning — `account.errors.<kode>` i
 * oversettelsene. Det er derfor spilleren får norsk feilmelding av en Worker
 * som ikke kan norsk.
 */
export default function AuthModal({ open, onClose }: AuthModalProps) {
    useEffect(() => {
        if (!open) return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [open, onClose])

    return (
        <AnimatePresence>{open && <AuthForm onClose={onClose} />}</AnimatePresence>
    )
}
