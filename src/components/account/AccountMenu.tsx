import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LogOut, User } from 'lucide-react'
import { fetchAccount, useAccount } from '../../account'
import type { AccountOverview, GameId } from '../../account'
import { games } from '../../data/games'
import AuthModal from './AuthModal'

/** Spillnavnet slik forsiden viser det, ut fra id-en tjeneren lagrer. */
const TITLES: Record<GameId, string> = {
    atlasmaster: 'AtlasMaster',
    scribblebot: 'ScribbleBot',
    hangbot: 'HangBot',
    proportionpanic: 'ProportionPanic',
    fleetbot: 'FleetBot',
}

const idOf = (title: string) => title.toLowerCase() as GameId

/**
 * Kontoen i toppen av forsiden: logg inn, eller se hvilke spill kontoen har
 * spilt og når.
 *
 * Forsiden viser BARE når hvert spill sist lagret noe. Hva som står inni et
 * profil-dokument er spillets sak — forsiden kjenner ikke formen, og skal ikke
 * måtte rulles ut på nytt hver gang et spill legger til et felt.
 */
export default function AccountMenu() {
    const { t } = useTranslation()
    const { username, isSignedIn, signOut } = useAccount()
    const [open, setOpen] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [overview, setOverview] = useState<AccountOverview | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const onPointerDown = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
        }
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false)
        }
        window.addEventListener('mousedown', onPointerDown)
        window.addEventListener('keydown', onKeyDown)
        return () => {
            window.removeEventListener('mousedown', onPointerDown)
            window.removeEventListener('keydown', onKeyDown)
        }
    }, [open])

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
                    className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border p-4 shadow-xl backdrop-blur-md"
                    style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface) 95%, transparent)' }}
                >
                    <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-subtle)' }}>
                        {t('account.yourProfile')}
                    </p>

                    <ul className="mt-3 flex flex-col gap-2">
                        {games.map((game) => {
                            const id = idOf(game.title)
                            const entry = overview?.games?.[id]
                            return (
                                <li key={game.id} className="flex items-center justify-between gap-3 text-sm">
                                    <span>{TITLES[id] ?? game.title}</span>
                                    <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                                        {entry
                                            ? new Date(entry.updatedAt).toLocaleDateString()
                                            : t('account.notPlayed')}
                                    </span>
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
                </div>
            )}
        </div>
    )
}
