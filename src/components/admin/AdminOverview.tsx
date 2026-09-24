import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Activity, Ban, CalendarDays, Lock, UserPlus, Users } from 'lucide-react'
import { fetchOverview } from '../../admin/api'
import { errorText, formatNumber, gameTitle } from '../../admin/format'
import type { AdminErrorCode, AdminOverview as Overview } from '../../admin/types'
import { formatDate } from '../../lib/formatDate'
import LogList from './LogList'
import { Button, Card, ErrorNotice, Muted, SectionHeading } from './ui'

interface AdminOverviewProps {
    onOpenPlayer: (username: string) => void
    onShowLog: () => void
}

const RECENT = 6

/**
 * Førstesiden i panelet: hvor mange som spiller, hvor, og hva adminene har
 * gjort sist.
 */
export default function AdminOverview({ onOpenPlayer, onShowLog }: AdminOverviewProps) {
    const { t, i18n } = useTranslation()
    const [result, setResult] = useState<{ data?: Overview; error?: AdminErrorCode } | null>(null)
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        let cancelled = false
        void fetchOverview().then((r) => {
            if (!cancelled) setResult(r.ok ? { data: r.data } : { error: r.error })
        })
        return () => {
            cancelled = true
        }
    }, [attempt])

    if (result?.error) {
        return <ErrorNotice onRetry={() => setAttempt((n) => n + 1)}>{errorText(t, result.error)}</ErrorNotice>
    }
    const data = result?.data
    if (!data) return <Muted>{t('admin.loading')}</Muted>

    const n = (value: number) => formatNumber(value, i18n.language)
    const { stats } = data

    const tiles = [
        { key: 'players', value: stats.players, Icon: Users, note: t('admin.stats.admins', { count: stats.admins }) },
        { key: 'activeDay', value: stats.activeDay, Icon: Activity },
        { key: 'activeWeek', value: stats.activeWeek, Icon: CalendarDays },
        { key: 'newWeek', value: stats.newWeek, Icon: UserPlus },
        { key: 'banned', value: stats.banned, Icon: Ban, status: 'text-red-600 dark:text-red-400' },
        { key: 'locked', value: stats.locked, Icon: Lock, status: 'text-amber-600 dark:text-amber-400' },
    ]

    return (
        <div className="flex flex-col gap-8">
            <section>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {tiles.map(({ key, value, Icon, note, status }) => (
                        <li key={key}>
                            <Card className="h-full">
                                <p className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-subtle)' }}>
                                    <Icon
                                        aria-hidden="true"
                                        className={`h-3.5 w-3.5 ${value > 0 && status ? status : ''}`}
                                    />
                                    {t(`admin.stats.${key}`)}
                                </p>
                                <p className="mt-1.5 text-2xl font-semibold">{n(value)}</p>
                                {note && (
                                    <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-subtle)' }}>
                                        {note}
                                    </p>
                                )}
                            </Card>
                        </li>
                    ))}
                </ul>
            </section>

            <section>
                <SectionHeading>{t('admin.gamesHeading')}</SectionHeading>
                <ul className="flex flex-col gap-3">
                    {data.games.map((row) => {
                        // andelen av alle kontoene som har lagret noe i spillet
                        const pct = stats.players ? Math.round((row.players / stats.players) * 100) : 0
                        return (
                            <li key={row.game} className="grid grid-cols-[7.5rem_1fr] items-center gap-x-3 gap-y-1 sm:grid-cols-[9rem_1fr_11rem]">
                                <span className="truncate text-sm font-medium">{gameTitle(row.game)}</span>
                                <span
                                    className="h-2 overflow-hidden rounded-full"
                                    style={{ background: 'color-mix(in srgb, var(--accent) 18%, transparent)' }}
                                    role="img"
                                    aria-label={t('admin.gamePlayers', { count: row.players })}
                                >
                                    <span
                                        className="block h-full rounded-full"
                                        style={{ width: `${pct}%`, background: 'var(--accent)' }}
                                    />
                                </span>
                                <span
                                    className="col-start-2 text-xs tabular-nums sm:col-start-auto sm:text-right"
                                    style={{ color: 'var(--text-subtle)' }}
                                >
                                    {t('admin.gamePlayers', { count: row.players })}
                                    {row.lastAt && ` · ${t('admin.lastActivity', { date: formatDate(row.lastAt) })}`}
                                </span>
                            </li>
                        )
                    })}
                </ul>
                <Muted className="mt-3 text-xs">{t('admin.gamesNote')}</Muted>
            </section>

            <section>
                <SectionHeading
                    aside={
                        data.log.length > RECENT && (
                            <Button onClick={onShowLog}>{t('admin.seeAll')}</Button>
                        )
                    }
                >
                    {t('admin.recentActions')}
                </SectionHeading>
                <LogList entries={data.log.slice(0, RECENT)} onOpenPlayer={onOpenPlayer} />
            </section>
        </div>
    )
}
