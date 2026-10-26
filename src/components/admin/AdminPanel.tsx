import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Clock3, Eye, EyeOff, KeyRound, LoaderCircle, LockKeyhole, ShieldCheck, X } from 'lucide-react'
import { fetchOverview, isAdminUnlocked, lockAdmin, onAdminLock, unlockAdmin } from '../../admin/api'
import { errorText } from '../../admin/format'
import type { AdminErrorCode, LogEntry } from '../../admin/types'
import AdminOverview from './AdminOverview'
import AdminTraffic from './AdminTraffic'
import LogList from './LogList'
import AdminMessages from './AdminMessages'
import PlayerDetail from './PlayerDetail'
import PlayerList, { type ListState } from './PlayerList'
import { ErrorNotice, Muted } from './ui'
import './admin-login.css'

interface AdminPanelProps {
    open: boolean
    onClose: () => void
    /** Adminen som har panelet åpent. */
    username: string
}

type Tab = 'overview' | 'traffic' | 'players' | 'messages' | 'log'
const TABS: Tab[] = ['overview', 'traffic', 'players', 'messages', 'log']

/**
 * Adminpanelet — bare for kontoer med `players.admin = 1`.
 *
 * At knappen hit bare vises for admins er pynt; det som faktisk stenger er
 * requireAdmin på tjeneren, som sjekker flagget på nytt ved hvert eneste kall.
 * En som åpner dette uten å være admin, får et panel fullt av «ikke tilgang».
 *
 * PIN-EN HVER GANG. Panelet bruker sitt eget tegn, ikke økten: det fås med
 * PIN-en, varer et kvarter, finnes bare i minnet og tilbakekalles når panelet
 * lukkes (se src/admin/api.ts). Går det ut mens panelet er åpent, kommer
 * PIN-feltet tilbake i stedet for fanene.
 *
 * Tegnes i en portal rett under <body>. Headeren er animert med transform, og
 * `position: fixed` inni et element med transform er fast til det elementet,
 * ikke til vinduet.
 */
export default function AdminPanel({ open, onClose, username }: AdminPanelProps) {
    return createPortal(
        <AnimatePresence>{open && <Panel onClose={onClose} username={username} />}</AnimatePresence>,
        document.body,
    )
}

function Panel({ onClose, username }: Omit<AdminPanelProps, 'open'>) {
    const { t } = useTranslation()
    const [tab, setTab] = useState<Tab>('overview')
    const [selected, setSelected] = useState<string | null>(null)
    const [list, setList] = useState<ListState>({ query: '', filter: 'all', sort: 'seen' })
    const [notice, setNotice] = useState<string | null>(null)
    const [unlocked, setUnlocked] = useState(isAdminUnlocked)
    const dialogRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef(document.activeElement as HTMLElement | null)
    const reduceMotion = useReducedMotion()

    useEffect(() => onAdminLock(() => setUnlocked(false)), [])
    // lukket panel, ingen tilgang: tegnet tilbakekalles med en gang
    useEffect(() => () => lockAdmin(), [])

    useEffect(() => {
        if (unlocked) dialogRef.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus()
    }, [unlocked])

    const openPlayer = useCallback((name: string) => {
        setNotice(null)
        setSelected(name)
        setTab('players')
    }, [])

    // siden bak skal ikke rulle mens panelet er oppe
    useEffect(() => {
        const previous = document.body.style.overflow
        const trigger = triggerRef.current
        document.body.style.overflow = 'hidden'
        // PIN-feltet har alt tatt fokus; det skal det få beholde
        if (!dialogRef.current?.contains(document.activeElement)) {
            const pinInput = dialogRef.current?.querySelector<HTMLInputElement>('#admin-pin')
            if (pinInput) pinInput.focus()
            else dialogRef.current?.focus()
        }
        return () => {
            document.body.style.overflow = previous
            trigger?.focus({ preventScroll: true })
        }
    }, [])

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Tab') {
                const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled):not([hidden]), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]')
                if (!controls?.length) return
                const first = controls[0]
                const last = controls[controls.length - 1]
                if (!dialogRef.current?.contains(document.activeElement) || document.activeElement === dialogRef.current) {
                    event.preventDefault()
                    const next = event.shiftKey ? last : first
                    next.focus()
                } else if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault()
                    last.focus()
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault()
                    first.focus()
                }
                return
            }
            if (event.key !== 'Escape') return
            // Behold et halvskrevet skjema i det ulåste panelet.
            const target = event.target as HTMLElement | null
            if (unlocked && target?.closest('input, textarea, select')) return
            event.preventDefault()
            if (selected) setSelected(null)
            else onClose()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [selected, onClose, unlocked])

    return (
        <motion.div
            className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
        >
            <motion.div
                ref={dialogRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby={unlocked ? 'admin-panel-title' : 'admin-unlock-title'}
                className={`admin-panel flex w-full flex-col overflow-hidden rounded-3xl border shadow-2xl outline-none ${unlocked ? 'h-full max-h-[56rem] max-w-4xl' : 'admin-panel--locked'}`}
                style={{ borderColor: 'var(--border)', background: 'var(--surface-card)', color: 'var(--text)' }}
                initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96, y: reduceMotion ? 0 : 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.96, y: reduceMotion ? 0 : 16 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                onClick={(event) => event.stopPropagation()}
            >
                <header
                    className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-6 sm:py-4 ${unlocked ? 'border-b' : 'admin-login-header'}`}
                    style={{ borderColor: 'var(--border)' }}
                >
                    <div className="flex min-w-0 items-center gap-3">
                        {unlocked && <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                            style={{ background: 'color-mix(in srgb, var(--accent) 18%, transparent)' }}
                        >
                            <ShieldCheck className="h-4.5 w-4.5" style={{ color: 'var(--accent)' }} aria-hidden="true" />
                        </span>}
                        <div className="min-w-0">
                            <h2 id="admin-panel-title" className={unlocked ? 'font-[family-name:var(--font-serif)] text-lg font-semibold leading-tight' : 'admin-login-eyebrow'}>
                                {!unlocked && <LockKeyhole size={13} aria-hidden="true" />}
                                {t('admin.title')}
                            </h2>
                            {unlocked && <p className="truncate text-xs" style={{ color: 'var(--text-subtle)' }}>
                                {t('admin.signedInAs', { name: username })}
                            </p>}
                        </div>
                    </div>

                    {unlocked && <div className="order-last flex w-full items-center gap-2 sm:order-none sm:w-auto">
                        <div
                            role="tablist"
                            aria-label={t('admin.title')}
                            className="grid flex-1 grid-cols-5 gap-1 rounded-xl p-1 sm:flex-none"
                            style={{ background: 'color-mix(in srgb, var(--surface) 92%, #000 8%)' }}
                        >
                            {TABS.map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    role="tab"
                                    aria-selected={tab === value}
                                    onClick={() => {
                                        setTab(value)
                                        setSelected(null)
                                        setNotice(null)
                                    }}
                                    className="pp-dropdown-item cursor-pointer rounded-lg px-2 py-1.5 text-xs font-semibold sm:px-4"
                                    style={{ color: tab === value ? 'var(--text)' : 'var(--text-subtle)' }}
                                >
                                    {t(`admin.tabs.${value}`)}
                                </button>
                            ))}
                        </div>
                    </div>}

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('close')}
                        className="admin-panel-close cursor-pointer rounded-full p-1.5 transition hover:bg-[var(--surface)]"
                        style={{ color: 'var(--text-subtle)' }}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </header>

                <div className={`pp-scroll min-h-0 overflow-y-auto ${unlocked ? 'flex-1 px-4 py-5 sm:px-6' : 'admin-login-content'}`}>
                    {notice && (
                        <p role="status" className="mb-4 rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100">
                            {notice}
                        </p>
                    )}

                    {!unlocked && <UnlockForm username={username} onUnlocked={() => setUnlocked(true)} />}

                    {unlocked && tab === 'overview' && <AdminOverview onOpenPlayer={openPlayer} onShowLog={() => setTab('log')} />}

                    {unlocked && tab === 'traffic' && <AdminTraffic />}

                    {unlocked && tab === 'players' &&
                        (selected ? (
                            <PlayerDetail
                                username={selected}
                                selfName={username}
                                onBack={() => setSelected(null)}
                                onRenamed={setSelected}
                                onDeleted={(name) => {
                                    setSelected(null)
                                    setNotice(t('admin.done.delete', { name }))
                                }}
                            />
                        ) : (
                            <PlayerList state={list} onChange={setList} onOpen={openPlayer} />
                        ))}

                    {unlocked && tab === 'messages' && <AdminMessages />}

                    {unlocked && tab === 'log' && <LogTab onOpenPlayer={openPlayer} />}
                </div>
            </motion.div>
        </motion.div>
    )
}

/**
 * PIN-en, før panelet viser noe.
 *
 * Samme forsøksgrense som innloggingen: fem feil stenger kontoen et kvarter,
 * også innloggingen. Feltet tømmes etter hvert forsøk.
 */
function UnlockForm({ username, onUnlocked }: { username: string; onUnlocked: () => void }) {
    const { t } = useTranslation()
    const [pin, setPin] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)
    const [showPin, setShowPin] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const submit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (busy || pin.length < 4) return
        setBusy(true)
        setError(null)
        const result = await unlockAdmin(pin)
        setBusy(false)
        setPin('')
        setShowPin(false)
        if (result.ok) {
            onUnlocked()
            return
        }
        setError(
            result.error === 'bad_credentials'
                ? t('admin.unlock.wrong')
                : result.error === 'locked'
                  ? t('admin.unlock.locked', { minutes: Math.max(1, Math.ceil((result.retryAfter ?? 900) / 60)) })
                  : errorText(t, result.error as AdminErrorCode),
        )
        inputRef.current?.focus()
    }

    return (
        <form onSubmit={submit} className="admin-login" aria-busy={busy}>
            <input type="text" name="username" value={username} autoComplete="username" readOnly hidden />
            <div className="admin-login-mark" aria-hidden="true"><ShieldCheck size={30} strokeWidth={1.6} /></div>
            <h3 id="admin-unlock-title">{t('admin.unlock.title')}</h3>
            <p className="admin-login-intro" id="admin-unlock-help">
                {t('admin.unlock.help')}
            </p>
            <div className="admin-login-account">
                <span className="admin-login-avatar" aria-hidden="true">{Array.from(username)[0]?.toLocaleUpperCase()}</span>
                <div><span>{t('admin.unlock.account')}</span><strong title={username}>{username}</strong></div>
                <ShieldCheck size={18} aria-hidden="true" />
            </div>
            <label className="admin-login-label" htmlFor="admin-pin">{t('admin.unlock.pin')}</label>
            <div className="admin-login-pin" data-invalid={!!error}>
                <KeyRound size={19} aria-hidden="true" />
                <input
                    ref={inputRef}
                    id="admin-pin"
                    name="pin"
                    value={pin}
                    onChange={(event) => {
                        setPin(event.target.value.replace(/\D/g, ''))
                        if (error) setError(null)
                    }}
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]{4,6}"
                    minLength={4}
                    maxLength={6}
                    required
                    autoFocus
                    autoComplete="current-password"
                    placeholder={t('admin.unlock.placeholder')}
                    readOnly={busy}
                    aria-invalid={!!error}
                    aria-describedby={`admin-unlock-help admin-unlock-attempts${error ? ' admin-unlock-error' : ''}`}
                />
                <button type="button" className="admin-login-reveal" disabled={busy} aria-label={t(showPin ? 'admin.unlock.hidePin' : 'admin.unlock.showPin')} aria-pressed={showPin} onClick={() => setShowPin(value => !value)}>
                    {showPin ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
                </button>
            </div>
            {error && (
                <p role="alert" id="admin-unlock-error" className="form-error admin-login-error">
                    {error}
                </p>
            )}
            <p className="admin-login-attempts" id="admin-unlock-attempts">{t('admin.unlock.attempts')}</p>
            <button type="submit" disabled={busy || pin.length < 4} className="button primary admin-login-submit">
                {busy ? <><LoaderCircle className="admin-login-spinner" size={18} aria-hidden="true" />{t('admin.unlock.verifying')}</> : <>{t('admin.unlock.submit')}<ArrowRight size={18} aria-hidden="true" /></>}
            </button>
            <span className="sr-only" role="status">{busy ? t('admin.unlock.verifying') : ''}</span>
            <div className="admin-login-session"><span><Clock3 size={14} aria-hidden="true" />{t('admin.unlock.duration')}</span><span><LockKeyhole size={13} aria-hidden="true" />{t('admin.unlock.sessionOnly')}</span></div>
        </form>
    )
}

/** Hele loggen, så langt oversikten henter den. */
function LogTab({ onOpenPlayer }: { onOpenPlayer: (username: string) => void }) {
    const { t } = useTranslation()
    const [result, setResult] = useState<{ log?: LogEntry[]; error?: AdminErrorCode } | null>(null)
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        let cancelled = false
        void fetchOverview().then((r) => {
            if (!cancelled) setResult(r.ok ? { log: r.data.log } : { error: r.error })
        })
        return () => {
            cancelled = true
        }
    }, [attempt])

    if (result?.error) {
        return <ErrorNotice onRetry={() => setAttempt((n) => n + 1)}>{errorText(t, result.error)}</ErrorNotice>
    }
    if (!result?.log) return <Muted>{t('admin.loading')}</Muted>
    return <LogList entries={result.log} onOpenPlayer={onOpenPlayer} />
}
