import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Activity, Database, ExternalLink, Eye, RefreshCw, Users } from 'lucide-react'
import { fetchTraffic } from '../../admin/api'
import { errorText, formatNumber } from '../../admin/format'
import type { AdminErrorCode, TrafficData, TrafficDays, TrafficResponse } from '../../admin/types'
import { Button, Card, ErrorNotice, Muted, SectionHeading } from './ui'

const PERIODS: TrafficDays[] = [1, 7, 30]

export default function AdminTraffic() {
    const { t } = useTranslation()
    const [days, setDays] = useState<TrafficDays>(7)
    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold">{t('admin.traffic.title')}</h3>
                    <Muted className="text-xs">{t('admin.traffic.source')}</Muted>
                </div>
                <div className="flex gap-1" role="group" aria-label={t('admin.traffic.period')}>
                    {PERIODS.map(value => (
                        <Button key={value} aria-pressed={days === value} onClick={() => setDays(value)}
                            style={days === value ? { background: 'color-mix(in srgb, var(--accent) 20%, transparent)' } : undefined}>
                            {t(`admin.traffic.periods.${value}`)}
                        </Button>
                    ))}
                </div>
            </div>
            <TrafficPeriod key={days} days={days} />
        </div>
    )
}

function TrafficPeriod({ days }: { days: TrafficDays }) {
    const { t, i18n } = useTranslation()
    const [result, setResult] = useState<TrafficResponse | null>(null)
    const [error, setError] = useState<AdminErrorCode | null>(null)
    const [loading, setLoading] = useState(true)
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        let cancelled = false
        let pending = false
        const load = async () => {
            if (pending) return
            pending = true
            const response = await fetchTraffic(days)
            pending = false
            if (cancelled) return
            setLoading(false)
            if (response.ok) {
                setResult(response.data)
                setError(null)
            } else setError(response.error)
        }
        void load()
        const timer = window.setInterval(() => {
            if (document.visibilityState === 'visible') void load()
        }, 60000)
        return () => { cancelled = true; window.clearInterval(timer) }
    }, [days, attempt])

    const refresh = () => { setLoading(true); setAttempt(value => value + 1) }
    const locale = i18n.language === 'no' ? 'nb-NO' : 'en-GB'

    return (
        <div className="flex flex-col gap-5" aria-busy={loading}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Muted className="text-xs" >
                    {result?.configured && t('admin.traffic.updated', {
                        time: new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(result.fetchedAt)),
                    })}
                    {!result && loading && t('admin.loading')}
                </Muted>
                <Button onClick={refresh} disabled={loading}>
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                    {t('admin.traffic.refresh')}
                </Button>
            </div>
            {error && <ErrorNotice onRetry={refresh}>{errorText(t, error)}{result?.configured && ` ${t('admin.traffic.stale')}`}</ErrorNotice>}
            {result?.configured === false && (
                <Card>
                    <h4 className="font-semibold">{t('admin.traffic.setupTitle')}</h4>
                    <Muted className="mt-2">{t('admin.traffic.setupBody')}</Muted>
                    <a href="https://dash.cloudflare.com/" target="_blank" rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold underline">
                        {t('admin.traffic.openCloudflare')}<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                </Card>
            )}
            {result?.configured && <TrafficReport data={result} />}
        </div>
    )
}

function TrafficReport({ data }: { data: TrafficData }) {
    const { t, i18n } = useTranslation()
    const locale = i18n.language === 'no' ? 'nb-NO' : 'en-GB'
    const n = (value: number) => formatNumber(value, i18n.language)
    const pct = (value: number) => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(value)
    const date = (value: string) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
    const displayNames = new Intl.DisplayNames([locale], { type: 'region' })
    const country = (code: string) => {
        if (code === 'T1') return t('admin.traffic.tor')
        if (!/^[A-Z]{2}$/.test(code) || code === 'XX') return t('admin.traffic.unknownCountry')
        return displayNames.of(code) ?? code
    }
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const unit = Math.min(4, Math.floor(Math.log(Math.max(1, data.totals.bytes)) / Math.log(1000)))
    const bytes = `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(data.totals.bytes / 1000 ** unit)} ${units[unit]}`
    const tiles = [
        { key: 'visitors', value: n(data.totals.visitors), Icon: Users },
        { key: 'requests', value: n(data.totals.requests), Icon: Activity },
        { key: 'pageViews', value: n(data.totals.pageViews), Icon: Eye },
        { key: 'bytes', value: bytes, Icon: Database },
    ]
    const max = Math.max(1, ...data.daily.map(row => row.requests))

    return (
        <>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {tiles.map(({ key, value, Icon }) => (
                    <li key={key}><Card className="h-full">
                        <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-subtle)' }}>
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />{t(`admin.traffic.metrics.${key}`)}
                        </p>
                        <p className="mt-2 text-xl font-semibold tabular-nums sm:text-2xl">{value}</p>
                    </Card></li>
                ))}
            </ul>
            <Muted className="text-xs">{t('admin.traffic.measurementNote')}</Muted>
            <Card>
                <SectionHeading aside={<span className="text-xs" style={{ color: 'var(--text-subtle)' }}>{date(data.from)} – {date(data.to)} · UTC</span>}>
                    {t('admin.traffic.chartTitle')}
                </SectionHeading>
                {data.totals.requests === 0 ? <Muted>{t('admin.traffic.empty')}</Muted> : (
                    <>
                        <div className="flex h-40 items-end gap-1 sm:gap-2" role="img" aria-label={t('admin.traffic.chartLabel', { count: data.totals.requests })}>
                            {data.daily.map(row => (
                                <div key={row.date} className="group relative flex h-full min-w-0 flex-1 items-end">
                                    <div className="w-full rounded-t-sm" style={{ height: `${row.requests / max * 100}%`, background: 'var(--accent)' }} />
                                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md border px-2 py-1 text-xs shadow-sm group-hover:block"
                                        style={{ background: 'var(--surface-card)', borderColor: 'var(--border)' }}>
                                        {date(row.date)}: {n(row.requests)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-2 flex justify-between text-xs" style={{ color: 'var(--text-subtle)' }}>
                            <span>{date(data.from)}</span><span>{date(data.to)}</span>
                        </div>
                    </>
                )}
                <Muted className="mt-3 text-xs">{t('admin.traffic.periodNote')}</Muted>
                <details className="mt-3 text-xs">
                    <summary className="cursor-pointer font-semibold">{t('admin.traffic.showDaily')}</summary>
                    <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-left tabular-nums">
                            <thead><tr><th className="pb-2">{t('admin.traffic.date')}</th><th className="pb-2 text-right">{t('admin.traffic.metrics.requests')}</th><th className="pb-2 text-right">{t('admin.traffic.metrics.visitors')}</th></tr></thead>
                            <tbody>{data.daily.map(row => <tr key={row.date}><td className="py-1">{date(row.date)}</td><td className="text-right">{n(row.requests)}</td><td className="text-right">{n(row.visitors)}</td></tr>)}</tbody>
                        </table>
                    </div>
                </details>
            </Card>
            <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                    <SectionHeading>{t('admin.traffic.countries')}</SectionHeading>
                    <Muted className="mb-3 text-xs">{t('admin.traffic.byRequests')}</Muted>
                    {data.countries.length === 0 ? <Muted>{t('admin.traffic.empty')}</Muted> : (
                        <ul className="flex flex-col gap-3">{data.countries.map(row => (
                            <li key={row.country}>
                                <div className="mb-1 flex justify-between gap-2 text-xs"><span>{country(row.country)}</span><span className="tabular-nums">{n(row.requests)}</span></div>
                                <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--border)' }}>
                                    <div className="h-full rounded-full" style={{ width: `${data.totals.requests ? row.requests / data.totals.requests * 100 : 0}%`, background: 'var(--accent)' }} />
                                </div>
                            </li>
                        ))}</ul>
                    )}
                </Card>
                <Card>
                    <SectionHeading>{t('admin.traffic.health')}</SectionHeading>
                    <dl className="flex flex-col gap-3 text-sm">
                        {[
                            ['cache', pct(data.totals.requests ? data.totals.cachedRequests / data.totals.requests : 0)],
                            ['threats', n(data.totals.threats)],
                            ['clientErrors', n(data.totals.clientErrors)],
                            ['serverErrors', n(data.totals.serverErrors)],
                        ].map(([key, value]) => <div key={key} className="flex justify-between gap-3"><dt>{t(`admin.traffic.metrics.${key}`)}</dt><dd className="font-semibold tabular-nums">{value}</dd></div>)}
                    </dl>
                    <details className="mt-5 text-xs">
                        <summary className="cursor-pointer font-semibold">{t('admin.traffic.showStatuses')}</summary>
                        <ul className="mt-3 flex flex-col gap-2">{data.statuses.map(row => <li key={row.status} className="flex justify-between"><span>HTTP {row.status}</span><span className="tabular-nums">{n(row.requests)}</span></li>)}</ul>
                    </details>
                </Card>
            </div>
        </>
    )
}
