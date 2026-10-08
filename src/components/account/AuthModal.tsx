import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Dialog from '../../ui/Dialog'
import logo from '../../assets/logo.svg'
import { ArrowLeft, ArrowUpRight, Check } from 'lucide-react'
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
    presentation?: 'page' | 'modal'
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
function AuthForm({ onClose, initialMode, presentation }: { onClose: () => void; initialMode: AuthMode; presentation: 'page' | 'modal' }) {
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
    const content = shown ? <RecoveryCodeNotice username={shown.username} code={shown.code} onDone={onClose} /> : (
      <>
        {action !== 'recover' && <div className="option-row auth-tabs" role="group" aria-label={t('account.title')}>
          <button className="option" type="button" disabled={busy} aria-pressed={action === 'login'} onClick={() => switchMode('login')}>{t('account.signIn')}</button>
          <button className="option" type="button" disabled={busy} aria-pressed={action === 'register'} onClick={() => switchMode('register')}>{t('account.register')}</button>
        </div>}
        <form onSubmit={submit} className="sa-form">
          <p className="form-intro">{t(action === 'recover' ? 'account.recovery.intro' : 'account.blurb')}</p>
          <label>{t('account.username')}<input value={username} onChange={event => setUsername(event.target.value)} maxLength={20} autoComplete="username" autoFocus required disabled={busy} /></label>
          {action === 'recover' && <label>{t('account.recovery.code')}
            <input className="code-input" value={code} onChange={event => setCode(event.target.value.toUpperCase())} maxLength={20} autoComplete="off" autoCapitalize="characters" spellCheck={false} required disabled={busy} />
            <span className="field-hint">{t('account.recovery.codeHint')}</span>
          </label>}
          <label>{t(action === 'recover' ? 'account.recovery.newPin' : 'account.pin')}
            <input className="pin-input" value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, ''))} inputMode="numeric" pattern="\d{4,6}" minLength={4} maxLength={6} autoComplete={action === 'login' ? 'current-password' : 'new-password'} type="password" required disabled={busy} />
            <span className="field-hint">{t('account.pinHint')}</span>
          </label>
          {action !== 'login' && <label>{t('account.repeatPin')}
            <input className="pin-input" value={confirm} onChange={event => setConfirm(event.target.value.replace(/\D/g, ''))} inputMode="numeric" pattern="\d{4,6}" minLength={4} maxLength={6} autoComplete="new-password" type="password" required disabled={busy} />
          </label>}
          {consent !== 'accepted' && <div className="form-warning"><p>{t('account.noConsent')}</p><button type="button" className="inline-link" onClick={showBanner}>{t('account.enableStorage')}</button></div>}
          {error && <p role="alert" className="form-error">{errorText(error)}</p>}
          <button type="submit" disabled={busy} className="button primary full-width">{busy ? t('profile.working') : submitLabel}<ArrowUpRight size={17} aria-hidden="true" /></button>
          {action === 'login' && <button type="button" disabled={busy} className="inline-link" onClick={() => switchMode('recover')}>{t('account.recovery.forgotPin')}</button>}
          {action === 'recover' && <><p className="field-hint">{t('account.recovery.noCode')}</p><button type="button" disabled={busy} className="inline-link" onClick={() => switchMode('login')}>{t('account.recovery.backToSignIn')}</button></>}
        </form>
      </>
    )
    if (presentation === 'modal') return <Dialog open onClose={onClose} title={title} dismissible={!shown}>{content}</Dialog>
    return <div className="account-page-layout">
      <aside className="auth-story">
        {!shown && <a className="back-link" href="#"><ArrowLeft size={16} aria-hidden="true" />{t('profile.backToGames')}</a>}
        <img src={logo} alt="" className="auth-logo" width={58} height={58} />
        <p className="eyebrow">SpillArena</p><h1>{t('lobby.accountTitle')}</h1><p className="hero-description">{t('lobby.accountDescription')}</p>
        <ul className="auth-benefits"><li><Check size={16} aria-hidden="true" />{t('profile.benefitProgress')}</li><li><Check size={16} aria-hidden="true" />{t('profile.benefitGames')}</li><li><Check size={16} aria-hidden="true" />{t('profile.benefitGuest')}</li></ul>
        {!shown && <a className="button secondary" href="#">{t('profile.guestPlay')}<ArrowUpRight size={16} aria-hidden="true" /></a>}
      </aside>
      <section className="auth-panel" aria-labelledby="auth-title"><p className="eyebrow">{t('account.title')}</p><h2 id="auth-title">{title}</h2>{shown ? <><p className="field-hint">{t('account.recovery.saveIntro')}</p><Dialog open onClose={onClose} title={title} dismissible={false}>{content}</Dialog></> : content}</section>
    </div>
}

export default function AuthModal({ open, onClose, initialMode = 'login', presentation = 'modal' }: AuthModalProps) {
  return open ? <AuthForm onClose={onClose} initialMode={initialMode} presentation={presentation} /> : null
}
