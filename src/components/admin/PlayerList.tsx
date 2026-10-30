import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Clock3, Gamepad2, LoaderCircle, Search, Users, X } from 'lucide-react'
import { levelProgress } from '../../account'
import { fetchPlayers } from '../../admin/api'
import { errorText, formatNumber } from '../../admin/format'
import type { AdminErrorCode, PlayerFilter, PlayerPage, PlayerSort } from '../../admin/types'
import { formatDate } from '../../lib/formatDate'
import { Badge, Button, ErrorNotice } from './ui'
import Avatar from '../account/Avatar'
import './admin-players.css'

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
    const searchId = useId()
    const [query, setQuery] = useState(state.query)
    const [page, setPage] = useState<{ key: string; data?: PlayerPage; error?: AdminErrorCode } | null>(null)
    const [loadingMore, setLoadingMore] = useState(false)
    const [attempt, setAttempt] = useState(0)
    const [moreError, setMoreError] = useState<{ key: string; error: AdminErrorCode } | null>(null)

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
        if (!data || loadingMore || loading) return
        setLoadingMore(true)
        setMoreError(null)
        const r = await fetchPlayers({ ...state, offset: data.players.length })
        setLoadingMore(false)
        if (r.ok) {
            setPage((prev) =>
                prev?.key === key && prev.data
                    ? { key, data: { ...r.data, players: [...prev.data.players, ...r.data.players] } }
                    : prev,
            )
        } else setMoreError({ key, error: r.error })
    }

    const n = (value: number) => formatNumber(value, i18n.language)

    return (
        <section className="admin-players" aria-labelledby="admin-players-title">
            <header className="admin-players-heading">
                <div><p className="admin-players-eyebrow">{t('admin.playersPage.eyebrow')}</p><h3 id="admin-players-title">{t('admin.tabs.players')}</h3></div>
                <span className="admin-players-total"><Users size={15} aria-hidden="true" />{data && !loading ? t('admin.playersPage.total', { count: data.total }) : t('admin.loading')}</span>
                <p>{t('admin.playersPage.intro')}</p>
            </header>
            <div className="admin-players-toolbar">
                <div className="admin-player-search">
                    <label className="sr-only" htmlFor={searchId}>{t('admin.search')}</label>
                    <Search
                        aria-hidden="true"
                        size={17}
                    />
                    <input
                        id={searchId}
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t('admin.search')}
                        maxLength={40}
                        autoComplete="off"
                        spellCheck={false}
                    />
                    {query && <button type="button" onClick={() => { setQuery(''); onChange({ ...state, query: '' }) }} aria-label={t('admin.playersPage.clearSearch')}><X size={15} aria-hidden="true" /></button>}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div role="group" aria-label={t('admin.filters.label')} className="admin-player-filters">
                        {FILTERS.map((filter) => (
                            <button
                                key={filter}
                                type="button"
                                aria-pressed={state.filter === filter}
                                onClick={() => onChange({ ...state, query, filter })}
                            >
                                {t(`admin.filters.${filter}`)}
                            </button>
                        ))}
                    </div>
                    <label className="admin-player-sort">
                        {t('admin.sort.label')}
                        <select
                            value={state.sort}
                            onChange={(event) => onChange({ ...state, query, sort: event.target.value as PlayerSort })}
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
                <div className="admin-player-loading" role="status"><LoaderCircle size={20} aria-hidden="true" />{t('admin.loading')}</div>
            ) : (
                <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'} aria-busy={loading}>
                    <p className="admin-player-results" role="status">
                        {t('admin.results', { shown: n(data.players.length), total: n(data.total) })}
                    </p>

                    {data.players.length === 0 ? (
                        <div className="admin-player-empty"><Users size={30} aria-hidden="true" /><h4>{t('admin.noPlayers')}</h4><p>{t('admin.playersPage.emptyHint')}</p><Button onClick={() => { setQuery(''); onChange({ ...state, query: '', filter: 'all' }) }}>{t('admin.playersPage.resetFilters')}</Button></div>
                    ) : (
                        <ul className="admin-player-list">
                            {data.players.map((player) => (
                                <li key={player.username}>
                                    <button
                                        type="button"
                                        onClick={() => onOpen(player.username)}
                                        className="admin-player-row"
                                        disabled={loading}
                                    >
                                        <Avatar username={player.username} avatar={player.avatar} className="admin-player-avatar" />
                                        <span className="admin-player-identity">
                                            <span className="admin-player-name">{player.username}</span>
                                            <span className="admin-player-badges">
                                                {player.admin && <Badge kind="admin" />}
                                                {player.bannedAt && <Badge kind="banned" />}
                                                {player.locked && <Badge kind="locked" />}
                                                {!player.admin && !player.bannedAt && !player.locked && <span className="admin-player-role">{t('admin.playersPage.player')}</span>}
                                            </span>
                                        </span>
                                        <span className="admin-player-progress"><strong>{n(player.xp)} <small>XP</small></strong><span>{t('admin.progress.level', { level: levelProgress(player.xp).level })}<span aria-hidden="true"> · </span><Gamepad2 size={12} aria-hidden="true" />{player.games}<span className="sr-only"> {t('admin.playersPage.savedGames')}</span></span></span>
                                        <span className="admin-player-seen">
                                            <Clock3 size={13} aria-hidden="true" />{t('admin.row.lastSeen', { date: formatDate(player.lastSeen) ?? '—' })}
                                        </span>
                                        <ChevronRight
                                            aria-hidden="true"
                                            className="admin-player-arrow" size={17}
                                        />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {data.players.length < data.total && (
                        <div className="mt-3 flex justify-center">
                            <Button onClick={() => void loadMore()} disabled={loadingMore || loading}>
                                {loadingMore && <LoaderCircle size={14} className="admin-player-spinner" aria-hidden="true" />}{t(loadingMore ? 'admin.loading' : 'admin.loadMore')}
                            </Button>
                        </div>
                    )}
                    {moreError?.key === key && <ErrorNotice onRetry={() => void loadMore()}>{errorText(t, moreError.error)}</ErrorNotice>}
                </div>
            )}
        </section>
    )
}
