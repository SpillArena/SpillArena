import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { authenticate, createRecoveryCode, recoverAccount } from '../../account'
import type { AuthAction } from '../../account'
import { useCookieConsent } from '../../context/useCookieConsent'
import RecoveryCodeNotice from './RecoveryCodeNotice'

/** `recover` er «Glemt PIN?»: ny PIN med en kode i stedet for den gamle. */
export type AuthMode = AuthAction | 'recover'

interface AuthModalProps {
    open: boolean
    onClose: () => void
    /** Hvilket skjema vinduet åpner på. Lenken fra spillene ber om `recover`. */
    initialMode?: AuthMode
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
function AuthForm({ onClose, initialMode }: { onClose: () => void; initialMode: AuthMode }) {
    const { t } = useTranslation()
    const [action, setAction] = useState<AuthMode>(initialMode)
    const [username, setUsername] = useState('')
    const [pin, setPin] = useState('')
    const [confirm, setConfirm] = useState('')
    const [code, setCode] = useState('')
    /**
     * Gjenopprettingskoden som skal vises, når det er en. Da er skjemaet borte,
     * og vinduet lukkes bare med «Fortsett» — ikke med Escape eller et klikk
     * ved siden av, for koden vises aldri igjen.
     */
    const [shown, setShown] = useState<{ username: string; code: string } | null>(null)
    const [error, setError] = useState<string | null>(null)
    /** Sekunder igjen av en utestenging, når tjenesten sier det. */
    const [retryAfter, setRetryAfter] = useState<number | undefined>(undefined)
    const [busy, setBusy] = useState(false)
    const { consent, showBanner } = useCookieConsent()

    useEffect(() => {
        if (shown) return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [shown, onClose])

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
        if (action !== 'login' && pin !== confirm) {
            setError('pin_mismatch')
            setConfirm('')
            return
        }

        setBusy(true)
        setError(null)
        setRetryAfter(undefined)

        if (action === 'recover') {
            const result = await recoverAccount(username, code, pin)
            setBusy(false)
            if (!result.ok) {
                setError(result.error)
                setRetryAfter(result.retryAfter)
                return
            }
            setPin('')
            setConfirm('')
            setCode('')
            setShown({ username: result.session.username, code: result.recoveryCode })
            return
        }

        const result = await authenticate(action, username, pin)
        if (!result.ok) {
            setBusy(false)
            setError(result.error)
            setRetryAfter(result.retryAfter)
            return
        }

        /*
         * En ny konto får en gjenopprettingskode med en gang, mens PIN-en
         * fortsatt står i skjemaet. Feiler det, er kontoen likevel laget, og
         * kontomenyen ber om en kode senere — da er det ikke verdt å stoppe her.
         */
        if (action === 'register') {
            const recovery = await createRecoveryCode(pin)
            if (recovery.ok) {
                setBusy(false)
                setPin('')
                setConfirm('')
                setShown({ username: result.session.username, code: recovery.data.recoveryCode })
                return
            }
        }

        setBusy(false)
        setPin('')
        setConfirm('')
        onClose()
    }

    const switchMode = (next: AuthMode) => {
        setAction(next)
        setError(null)
        setRetryAfter(undefined)
        setConfirm('')
        setCode('')
    }

    /*
     * «Prøv igjen senere» er ikke en beskjed, det er en avvisning. Tjenesten vet
     * nøyaktig hvor lenge det er igjen, så den sier det, og her blir sekundene
     * til noe et menneske ville sagt.
     */
    const waitText = (seconds: number): string =>
        seconds < 60
            ? t('account.wait.seconds', { count: seconds })
            : Math.ceil(seconds / 60) === 1
              ? t('account.wait.minute')
              : t('account.wait.minutes', { count: Math.ceil(seconds / 60) })

    const errorText = (error: string): string =>
        error === 'locked' && retryAfter && retryAfter > 0
            ? t('account.errors.locked_wait', { wait: waitText(retryAfter) })
            : // «feil PIN» er feil beskjed når det var koden som ikke stemte
              action === 'recover' && error === 'bad_credentials'
              ? t('account.recovery.badCode')
              : t(`account.errors.${error}`, { defaultValue: t('account.errors.service_failed') })

    const title = t(
        shown
            ? 'account.recovery.savedTitle'
            : action === 'login'
              ? 'account.signIn'
              : action === 'register'
                ? 'account.register'
                : 'account.recovery.title',
    )
    const submitLabel = t(
        action === 'login' ? 'account.signIn' : action === 'register' ? 'account.register' : 'account.recovery.submit',
    )
    const pinInputClass =
        'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm tracking-[0.4em] text-slate-900 outline-none focus:border-[color:var(--accent)] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'

    return (
                <motion.div
                    key="auth-overlay"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={shown ? undefined : onClose}
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
                                {title}
                            </h2>
                            {!shown && (
                                <button
                                    onClick={onClose}
                                    className="cursor-pointer text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                    aria-label={t('close')}
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>

                        {shown ? (
                            <div className="p-6">
                                <RecoveryCodeNotice username={shown.username} code={shown.code} onDone={onClose} />
                            </div>
                        ) : (
                        <form onSubmit={submit} className="flex flex-col gap-4 p-6">
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                {t(action === 'recover' ? 'account.recovery.intro' : 'account.blurb')}
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

                            {action === 'recover' && (
                                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t('account.recovery.code')}
                                    <input
                                        value={code}
                                        onChange={(event) => setCode(event.target.value.toUpperCase())}
                                        maxLength={20}
                                        autoComplete="off"
                                        autoCapitalize="characters"
                                        spellCheck={false}
                                        required
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm tracking-wider text-slate-900 outline-none focus:border-[color:var(--accent)] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    />
                                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                        {t('account.recovery.codeHint')}
                                    </span>
                                </label>
                            )}

                            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                                {t(action === 'recover' ? 'account.recovery.newPin' : 'account.pin')}
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
                                    className={pinInputClass}
                                />
                                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                    {t('account.pinHint')}
                                </span>
                            </label>

                            {action !== 'login' && (
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
                                        className={pinInputClass}
                                    />
                                </label>
                            )}

                            {/* Uten samtykke blir ingenting lagret, og økten dør når fanen gjør
                                det — spillene ser en utlogget spiller. Bedre å si det før
                                innlogging enn å la den forsvinne, og å la det rettes her. */}
                            {consent !== 'accepted' && (
                                <div className="flex flex-col items-start gap-1.5 rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                                    <p>{t('account.noConsent')}</p>
                                    <button
                                        type="button"
                                        onClick={showBanner}
                                        className="cursor-pointer font-semibold underline underline-offset-2"
                                    >
                                        {t('account.enableStorage')}
                                    </button>
                                </div>
                            )}

                            {error && (
                                <p role="alert" className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-900/40 dark:text-red-100">
                                    {errorText(error)}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={busy}
                                className="cursor-pointer rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg disabled:cursor-progress disabled:opacity-60"
                            >
                                {submitLabel}
                            </button>

                            {action === 'login' && (
                                <button
                                    type="button"
                                    onClick={() => switchMode('recover')}
                                    className="cursor-pointer text-sm text-slate-600 underline-offset-2 hover:underline dark:text-slate-300"
                                >
                                    {t('account.recovery.forgotPin')}
                                </button>
                            )}

                            {action === 'recover' && (
                                <p className="text-xs leading-snug text-slate-500 dark:text-slate-400">
                                    {t('account.recovery.noCode')}
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={() => switchMode(action === 'login' ? 'register' : 'login')}
                                className="cursor-pointer text-sm text-slate-600 underline-offset-2 hover:underline dark:text-slate-300"
                            >
                                {t(
                                    action === 'login'
                                        ? 'account.switchToRegister'
                                        : action === 'register'
                                          ? 'account.switchToSignIn'
                                          : 'account.recovery.backToSignIn',
                                )}
                            </button>
                        </form>
                        )}
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
export default function AuthModal({ open, onClose, initialMode = 'login' }: AuthModalProps) {
    // Escape bor i skjemaet: det er det som vet om en kode står på skjermen
    return (
        <AnimatePresence>{open && <AuthForm onClose={onClose} initialMode={initialMode} />}</AnimatePresence>
    )
}
