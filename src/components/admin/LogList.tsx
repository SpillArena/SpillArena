import { useTranslation } from 'react-i18next'
import { formatDateTime } from '../../lib/formatDate'
import { gameTitle } from '../../admin/format'
import type { LogEntry } from '../../admin/types'
import { Muted } from './ui'

interface LogListProps {
    entries: LogEntry[]
    /** Gjør navnet på den handlingen gjaldt til en lenke inn i spillerkortet. */
    onOpenPlayer?: (username: string) => void
}

/**
 * Hva adminene har gjort, nyeste først.
 *
 * `details` er det handlingen selv skrev ned (se functions/api/admin/player.js)
 * og leses felt for felt her. Et felt som ikke finnes, blir bare ikke vist.
 */
export default function LogList({ entries, onOpenPlayer }: LogListProps) {
    const { t } = useTranslation()

    if (entries.length === 0) return <Muted>{t('admin.noLog')}</Muted>

    const describe = (entry: LogEntry): string | null => {
        const d = entry.details ?? {}
        switch (entry.action) {
            case 'ban':
                return typeof d.reason === 'string' ? `“${d.reason}”` : null
            case 'rename':
                return `${String(d.from)} → ${String(d.to)}`
            case 'clear-scores':
                return d.game === 'all' ? t('admin.log.allBoards') : gameTitle(String(d.game))
            case 'delete':
                return d.scores ? t('admin.log.withScores') : null
            default:
                return null
        }
    }

    return (
        <ul className="flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
            {entries.map((entry) => {
                const detail = describe(entry)
                // en slettet konto har ikke noe kort å åpne
                const canOpen = Boolean(onOpenPlayer && entry.target && entry.action !== 'delete')
                return (
                    <li
                        key={entry.id}
                        className="flex flex-col gap-0.5 py-2.5 text-sm sm:flex-row sm:items-baseline sm:gap-4"
                        style={{ borderColor: 'var(--border)' }}
                    >
                        <span className="shrink-0 text-xs tabular-nums sm:w-32" style={{ color: 'var(--text-subtle)' }}>
                            {formatDateTime(entry.at)}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="font-semibold">{entry.admin}</span>{' '}
                            {t(`admin.log.${entry.action}`)}{' '}
                            {canOpen ? (
                                <button
                                    type="button"
                                    onClick={() => onOpenPlayer?.(entry.target!)}
                                    className="cursor-pointer font-semibold underline decoration-[color:var(--accent)] underline-offset-2"
                                >
                                    {entry.target}
                                </button>
                            ) : (
                                <span className="font-semibold">{entry.target}</span>
                            )}
                            {detail && (
                                <span className="block truncate text-xs sm:inline sm:pl-2" style={{ color: 'var(--text-subtle)' }}>
                                    {detail}
                                </span>
                            )}
                        </span>
                    </li>
                )
            })}
        </ul>
    )
}
