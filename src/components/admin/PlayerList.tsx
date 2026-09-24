import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Search } from 'lucide-react'
import { fetchPlayers } from '../../admin/api'
import { errorText, formatNumber } from '../../admin/format'
import type { AdminErrorCode, PlayerFilter, PlayerPage, PlayerSort } from '../../admin/types'
import { formatDate } from '../../lib/formatDate'
import { Badge, Button, ErrorNotice, Muted } from './ui'

export interface ListState {
    query: string
    filter: PlayerFilter
    sort: PlayerSort
}

interface PlayerListProps {
    state: ListState
    onChange: (next: ListState) => void
    onOpen: (username: string) => void
}

const FILTERS: PlayerFilter[] = ['all', 'banned', 'admins', 'locked']
const SORTS: PlayerSort[] = ['seen', 'created', 'name', 'xp']
const DEBOUNCE_MS = 250

/**
 * Alle kontoene, med søk, filter og rekkefølge.
 *
 * Søk, filter og rekkefølge bor hos forelderen, ikke her: lista forsvinner når
 * et spillerkort åpnes, og skal stå som den stod når man går tilbake.
 */
export default function PlayerList({ state, onChange, onOpen }: PlayerListProps) {
    const { t, i18n } = useTranslation()
    const [query, setQuery] = useState(state.query)
    const [page, setPage] = useState<{ key: string; data?: PlayerPage; error?: AdminErrorCode } | null>(null)
    const [loadingMore, setLoadingMore] = useState(false)
    const [attempt, setAttempt] = useState(0)

    // søket sendes når skrivingen tar en pause, ikke for hvert tastetrykk
    useEffect(() => {
        if (query === state.query) return
        const timer = setTimeout(() => onChange({ ...state, query }), DEBOUNCE_MS)
        return () => clearTimeout(timer)
    }, [query, state, onChange])

    const key = `${state.query}\u0000${state.filter}\u0000${state.sort}\u0000${attempt}`

    useEffect(() => {
        let cancelled = false
        void fetchPlayers(state).then((r) => {
            if (!cancelled) setPage(r.ok ? { key, data: r.data } : { key, error: r.error })
        })
        return () => {
            cancelled = true
        }
        // `key` dekker alt i `state` som et kall avhenger av
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key])

    const loading = page?.key !== key
    const data = page?.data

    const loadMore = async () => {
        if (!data || loadingMore) return
        setLoadingMore(true)
        const r = await fetchPlayers({ ...state, offset: data.players.length })
        setLoadingMore(false)
        if (r.ok) {
            setPage((prev) =>
                prev?.key === key && prev.data
                    ? { key, data: { ...r.data, players: [...prev.data.players, ...r.data.players] } }
                    : prev,
            )
        }
    }

    const n = (value: number) => formatNumber(value, i18n.language)

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
                <label className="relative block">
                    <span className="sr-only">{t('admin.search')}</span>
                    <Search
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                        style={{ color: 'var(--text-subtle)' }}
                    />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t('admin.search')}
                        maxLength={40}
                        autoComplete="off"
                        spellCheck={false}
                        className="w-full rounded-xl border py-2 pl-9 pr-3 text-sm outline-none focus:border-[color:var(--accent)]"
                        style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                    />
                </label>

                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div role="group" aria-label={t('admin.filters.label')} className="flex flex-wrap gap-1.5">
                        {FILTERS.map((filter) => (
                            <button
                                key={filter}
                                type="button"
                                aria-pressed={state.filter === filter}
                                onClick={() => onChange({ ...state, query, filter })}
                                className="pp-dropdown-item cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold"
                                style={{ borderColor: 'var(--border)' }}
                            >
                                {t(`admin.filters.${filter}`)}
                            </button>
                        ))}
                    </div>
                    <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-subtle)' }}>
                        {t('admin.sort.label')}
                        <select
                            value={state.sort}
                            onChange={(event) => onChange({ ...state, query, sort: event.target.value as PlayerSort })}
                            className="cursor-pointer rounded-lg border px-2 py-1 text-xs font-semibold"
                            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                        >
                            {SORTS.map((sort) => (
                                <option key={sort} value={sort}>
                                    {t(`admin.sort.${sort}`)}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>

            {page?.error && page.key === key ? (
                <ErrorNotice onRetry={() => setAttempt((a) => a + 1)}>{errorText(t, page.error)}</ErrorNotice>
            ) : !data ? (
                <Muted>{t('admin.loading')}</Muted>
            ) : (
                <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'} aria-busy={loading}>
                    <Muted className="mb-2 text-xs">
                        {t('admin.results', { shown: n(data.players.length), total: n(data.total) })}
                    </Muted>

                    {data.players.length === 0 ? (
                        <Muted>{t('admin.noPlayers')}</Muted>
                    ) : (
                        <ul className="flex flex-col gap-1.5">
                            {data.players.map((player) => (
                                <li key={player.username}>
                                    <button
                                        type="button"
                                        onClick={() => onOpen(player.username)}
                                        className="pp-dropdown-item group flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left hover:bg-[var(--surface)]"
                                        style={{ borderColor: 'var(--border)' }}
                                    >
                                        <span className="min-w-0 flex-1">
                                            <span className="flex flex-wrap items-center gap-1.5">
                                                <span className="truncate text-sm font-semibold">{player.username}</span>
                                                {player.admin && <Badge kind="admin" />}
                                                {player.bannedAt && <Badge kind="banned" />}
                                                {player.locked && <Badge kind="locked" />}
                                            </span>
                                            <span className="mt-0.5 block text-xs tabular-nums" style={{ color: 'var(--text-subtle)' }}>
                                                {t('admin.row.xpGames', { xp: n(player.xp), count: player.games })}
                                            </span>
                                        </span>
                                        <span className="hidden shrink-0 text-right text-xs tabular-nums sm:block" style={{ color: 'var(--text-subtle)' }}>
                                            {t('admin.row.lastSeen', { date: formatDate(player.lastSeen) })}
                                        </span>
                                        <ChevronRight
                                            aria-hidden="true"
                                            className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                                            style={{ color: 'var(--text-subtle)' }}
                                        />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {data.players.length < data.total && (
                        <div className="mt-3 flex justify-center">
                            <Button onClick={() => void loadMore()} disabled={loadingMore}>
                                {t('admin.loadMore')}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
