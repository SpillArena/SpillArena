import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LogOut, Pencil, User } from 'lucide-react'
import { fetchAccount, levelProgress, useAccount } from '../../account'
import type { AccountOverview, GameId } from '../../account'
import { games, type Game } from '../../data/games'
import { formatDate } from '../../lib/formatDate'
import AuthModal from './AuthModal'
import RenameForm from './RenameForm'

/** Spillnavnet slik forsiden viser det, ut fra id-en tjeneren lagrer. */
const TITLES: Record<GameId, string> = {
    atlasmaster: 'AtlasMaster',
    scribblebot: 'ScribbleBot',
    hangbot: 'HangBot',
    proportionpanic: 'ProportionPanic',
    fleetbot: 'FleetBot',
}

/** The account server keys profiles by the route slug (see src/account/session.ts),
 * not the display title — "Proportion Panic" has a space the title lacks a
 * slug for. `liveUrl` already carries that slug, so read it from there. */
const idOf = (game: Game) => (game.liveUrl.split('/').filter(Boolean).pop() ?? '') as GameId

/**
 * XP-en et spill har lagret på kontoen.
 *
 * Forsiden kjenner ikke formen på et profil-dokument — det er spillets eget, og
 * spillene legger til felt uten å spørre her. Men `xp` er felles for alle fem:
 * det er tallet hele nivåsystemet er bygget på (src/account/progress.ts), og
 * AtlasMaster sin eldre, rikere profil har det også. Å lese akkurat det ene
 * feltet er derfor trygt; alt annet i dokumentet lar vi være.
 */
function xpOf(progress: unknown): number | null {
    if (typeof progress !== 'object' || progress === null) return null
    const xp = (progress as { xp?: unknown }).xp
    return typeof xp === 'number' && Number.isFinite(xp) && xp >= 0 ? xp : null
}

/**
 * Kontoen i toppen av forsiden: logg inn, se hva hvert spill har samlet, og
 * bytt navn.
 *
 * Forsiden viser XP og nivå per spill, og når spillet sist lagret noe. Hva
 * ellers som står inni et profil-dokument er spillets sak — se `xpOf`.
 */
export default function AccountMenu() {
    const { t } = useTranslation()
    const { username, isSignedIn, signOut } = useAccount()
    const [open, setOpen] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [overview, setOverview] = useState<AccountOverview | null>(null)
    const [renaming, setRenaming] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const onPointerDown = (event: MouseEvent) => {
            // et halvutfylt navnebytte skal ikke forsvinne av et bomklikk
            if (renaming) return
            if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
        }
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return
            if (renaming) setRenaming(false)
            else setOpen(false)
        }
        window.addEventListener('mousedown', onPointerDown)
        window.addEventListener('keydown', onKeyDown)
        return () => {
            window.removeEventListener('mousedown', onPointerDown)
            window.removeEventListener('keydown', onKeyDown)
        }
    }, [open, renaming])

    // hentes når panelet faktisk åpnes, ikke ved hver sidelast: en konto som
    // aldri åpner panelet skal ikke koste et kall
    useEffect(() => {
        if (!open || !isSignedIn) return
        let cancelled = false
        void fetchAccount().then((result) => {
            if (!cancelled && result.ok) setOverview(result.data)
        })
        return () => {
            cancelled = true
        }
    }, [open, isSignedIn, username])

    if (!isSignedIn) {
        return (
            <>
                <button
                    onClick={() => setModalOpen(true)}
                    className="flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:shadow-md"
                    style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface) 80%, transparent)' }}
                >
                    <User className="h-4 w-4" />
                    {t('account.signIn')}
                </button>
                <AuthModal open={modalOpen} onClose={() => setModalOpen(false)} />
            </>
        )
    }

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                className="flex max-w-[12rem] cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:shadow-md"
                style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface) 80%, transparent)' }}
            >
                <User className="h-4 w-4 shrink-0" />
                <span className="truncate">{username}</span>
            </button>

            {open && (
                <div
                    className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border p-4 shadow-xl backdrop-blur-md"
                    style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface) 95%, transparent)' }}
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-subtle)' }}>
                                {t('account.yourProfile')}
                            </p>
                            <p className="truncate text-base font-semibold">{username}</p>
                            {overview?.createdAt && (
                                <p className="text-[11px]" style={{ color: 'var(--text-subtle)' }}>
                                    {t('account.memberSince', { date: formatDate(overview.createdAt) })}
                                </p>
                            )}
                        </div>
                        {!renaming && (
                            <button
                                onClick={() => setRenaming(true)}
                                className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition hover:shadow-sm"
                                style={{ borderColor: 'var(--border)' }}
                            >
                                <Pencil className="h-3 w-3" />
                                {t('account.rename')}
                            </button>
                        )}
                    </div>

                    {renaming ? (
                        <RenameForm
                            current={username ?? ''}
                            onCancel={() => setRenaming(false)}
                            onDone={() => {
                                setRenaming(false)
                                // profilen er nøklet på navnet, så den hentes på
                                // nytt under det nye
                                void fetchAccount().then((r) => r.ok && setOverview(r.data))
                            }}
                        />
                    ) : (
                        <>
                            <ul className="mt-3 flex flex-col gap-2.5">
                                {games.map((game) => {
                                    const id = idOf(game)
                                    const entry = overview?.games?.[id]
                                    const xp = xpOf(entry?.progress)
                                    const level = xp === null ? null : levelProgress(xp)
                                    return (
                                        <li key={game.id} className="flex flex-col gap-1">
                                            <div className="flex items-baseline justify-between gap-3 text-sm">
                                                <span className="truncate">{TITLES[id] ?? game.title}</span>
                                                <span className="shrink-0 text-xs tabular-nums" style={{ color: 'var(--text-subtle)' }}>
                                                    {xp === null
                                                        ? t('account.notPlayed')
                                                        : t('account.xpAndLevel', { xp, level: level?.level })}
                                                </span>
                                            </div>
                                            {level && (
                                                <div className="flex items-center gap-2">
                                                    <span className="h-1 flex-1 overflow-hidden rounded-full" style={{ background: 'color-mix(in srgb, var(--accent) 22%, transparent)' }}>
                                                        <span
                                                            className="block h-full rounded-full"
                                                            style={{ width: `${level.pct}%`, background: 'var(--accent)' }}
                                                        />
                                                    </span>
                                                    <span className="shrink-0 text-[10px] tabular-nums" style={{ color: 'var(--text-subtle)' }}>
                                                        {formatDate(entry?.updatedAt)}
                                                    </span>
                                                </div>
                                            )}
                                        </li>
                                    )
                                })}
                            </ul>

                            <button
                                onClick={() => {
                                    signOut()
                                    setOverview(null)
                                    setOpen(false)
                                }}
                                className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition hover:shadow-md"
                                style={{ borderColor: 'var(--border)' }}
                            >
                                <LogOut className="h-4 w-4" />
                                {t('account.signOut')}
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
