import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Ban } from 'lucide-react'
import { levelProgress, normalizeProgress } from '../../account'
import { deletePlayer, fetchPlayer, runAction } from '../../admin/api'
import { GAME_IDS, errorText, formatNumber, gameTitle } from '../../admin/format'
import type { ActionBody, AdminErrorCode, PlayerDetail as Detail } from '../../admin/types'
import { formatDate, formatDateTime } from '../../lib/formatDate'
import LogList from './LogList'
import { Badge, Button, Card, ConfirmButton, ErrorNotice, Muted, SectionHeading } from './ui'

interface PlayerDetailProps {
    username: string
    /** Adminen som ser på — noen handlinger kan ikke rettes mot seg selv. */
    selfName: string
    onBack: () => void
    onRenamed: (username: string) => void
    onDeleted: (username: string) => void
}

type FormKind = 'ban' | 'reset-pin' | 'rename' | 'delete'
type Notice = { kind: 'ok' | 'error'; text: string }

const inputClass = 'w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none focus:border-[color:var(--accent)]'
const inputStyle = { borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }

/**
 * Alt om én spiller, og det en admin kan gjøre med kontoen.
 *
 * Grensene for hva som kan gjøres mot seg selv og mot andre admins håndheves på
 * tjeneren (functions/api/admin/player.js). Her skjules bare knappene som uansett
 * ville fått nei, så ingen trykker på noe som ikke kan virke.
 */
export default function PlayerDetail({ username, selfName, onBack, onRenamed, onDeleted }: PlayerDetailProps) {
    const { t, i18n } = useTranslation()
    const [version, setVersion] = useState(0)
    const [result, setResult] = useState<{ key: string; data?: Detail; error?: AdminErrorCode } | null>(null)
    const [form, setForm] = useState<FormKind | null>(null)
    const [busy, setBusy] = useState(false)
    const [notice, setNotice] = useState<Notice | null>(null)

    const key = `${username}\u0000${version}`

    useEffect(() => {
        let cancelled = false
        void fetchPlayer(username).then((r) => {
            if (!cancelled) setResult(r.ok ? { key, data: r.data } : { key, error: r.error })
        })
        return () => {
            cancelled = true
        }
    }, [username, key])

    const n = (value: number) => formatNumber(value, i18n.language)

    // forrige svar står til det neste er her, så en handling ikke blanker ut kortet
    const data = result?.data
    const header = (
        <Button onClick={onBack} className="self-start">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t('admin.back')}
        </Button>
    )

    if (result?.error && result.key === key) {
        return (
            <div className="flex flex-col gap-4">
                {header}
                <ErrorNotice onRetry={() => setVersion((v) => v + 1)}>{errorText(t, result.error)}</ErrorNotice>
            </div>
        )
    }
    if (!data || data.account.username.toLowerCase() !== username.toLowerCase()) {
        return (
            <div className="flex flex-col gap-4">
                {header}
                <Muted>{t('admin.loading')}</Muted>
            </div>
        )
    }

    const { account } = data
    const isSelf = account.username.toLowerCase() === selfName.toLowerCase()
    const isAdmin = account.admin
    const isBanned = Boolean(account.bannedAt)

    const run = async (body: ActionBody) => {
        setBusy(true)
        setNotice(null)
        const r = await runAction(account.username, body)
        setBusy(false)
        if (!r.ok) {
            setNotice({ kind: 'error', text: errorText(t, r.error) })
            return
        }
        setForm(null)
        const name = r.data.username ?? account.username
        setNotice({ kind: 'ok', text: t(`admin.done.${body.action}`, { name, count: r.data.removed ?? 0 }) })
        // et nytt navn er en ny adresse til kortet; forelderen bytter, og da
        // hentes det på nytt av seg selv
        if (body.action === 'rename' && name !== account.username) onRenamed(name)
        else setVersion((v) => v + 1)
    }

    const remove = async (scores: boolean) => {
        setBusy(true)
        setNotice(null)
        const r = await deletePlayer(account.username, scores)
        setBusy(false)
        if (!r.ok) {
            setNotice({ kind: 'error', text: errorText(t, r.error) })
            return
        }
        onDeleted(account.username)
    }

    const played = GAME_IDS.filter((id) => data.games[id])
    const unplayed = GAME_IDS.filter((id) => !data.games[id])
    const boardTotal = data.boards.reduce((sum, board) => sum + board.entries, 0)

    return (
        <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-3">
                {header}
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="min-w-0 truncate text-xl font-semibold">{account.username}</h3>
                        {isAdmin && <Badge kind="admin" />}
                        {isBanned && <Badge kind="banned" />}
                        {account.locked && <Badge kind="locked" />}
                    </div>
                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs" style={{ color: 'var(--text-subtle)' }}>
                        <span>{t('admin.created', { date: formatDate(account.createdAt) })}</span>
                        <span>{t('admin.lastSeen', { date: formatDateTime(account.lastSeen) })}</span>
                        {account.failed > 0 && <span>{t('admin.failed', { count: account.failed })}</span>}
                        {account.locked && (
                            <span>{t('admin.lockedUntil', { date: formatDateTime(account.lockedUntil) })}</span>
                        )}
                    </p>
                </div>

                {isBanned && (
                    <div className="flex gap-2.5 rounded-xl bg-red-100 px-3 py-2.5 text-sm text-red-800 dark:bg-red-900/40 dark:text-red-100">
                        <Ban className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <div>
                            <p className="font-semibold">
                                {t('admin.bannedNotice', {
                                    date: formatDateTime(account.bannedAt),
                                    admin: account.bannedBy ?? '—',
                                })}
                            </p>
                            <p className="text-xs">{account.banReason ? `“${account.banReason}”` : t('admin.noReason')}</p>
                        </div>
                    </div>
                )}
            </section>

            <section>
                <SectionHeading>{t('admin.sections.actions')}</SectionHeading>

                {notice && (
                    <p
                        role={notice.kind === 'error' ? 'alert' : 'status'}
                        className={`mb-3 rounded-lg px-3 py-2 text-sm ${
                            notice.kind === 'error'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100'
                                : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100'
                        }`}
                    >
                        {notice.text}
                    </p>
                )}

                {isSelf ? (
                    <Muted className="text-xs">{t('admin.actions.selfHint')}</Muted>
                ) : (
                    <>
                        <div className="flex flex-wrap gap-2">
                            {isBanned ? (
                                <Button disabled={busy} onClick={() => void run({ action: 'unban' })}>
                                    {t('admin.actions.unban')}
                                </Button>
                            ) : (
                                !isAdmin && (
                                    <Button variant="danger" disabled={busy} aria-expanded={form === 'ban'} onClick={() => setForm('ban')}>
                                        {t('admin.actions.ban')}
                                    </Button>
                                )
                            )}
                            {(account.locked || account.failed > 0) && (
                                <Button disabled={busy} onClick={() => void run({ action: 'unlock' })}>
                                    {t('admin.actions.unlock')}
                                </Button>
                            )}
                            {!isAdmin && (
                                <>
                                    <Button disabled={busy} aria-expanded={form === 'reset-pin'} onClick={() => setForm('reset-pin')}>
                                        {t('admin.actions.resetPin')}
                                    </Button>
                                    <Button disabled={busy} aria-expanded={form === 'rename'} onClick={() => setForm('rename')}>
                                        {t('admin.actions.rename')}
                                    </Button>
                                </>
                            )}
                            {/* admin kan gis her, men bare tas bort i databasen —
                                se functions/api/admin/player.js */}
                            {!isAdmin && !isBanned && (
                                <ConfirmButton disabled={busy} onConfirm={() => void run({ action: 'make-admin' })}>
                                    {t('admin.actions.makeAdmin')}
                                </ConfirmButton>
                            )}
                            {!isAdmin && (
                                <Button variant="danger" disabled={busy} aria-expanded={form === 'delete'} onClick={() => setForm('delete')}>
                                    {t('admin.actions.delete')}
                                </Button>
                            )}
                        </div>

                        {isAdmin && <Muted className="mt-2 text-xs">{t('admin.actions.adminHint')}</Muted>}

                        {form === 'ban' && (
                            <TextForm
                                label={t('admin.actions.banReason')}
                                help={t('admin.actions.banHelp')}
                                submitLabel={t('admin.actions.ban')}
                                maxLength={200}
                                optional
                                danger
                                busy={busy}
                                onCancel={() => setForm(null)}
                                onSubmit={(reason) => void run({ action: 'ban', reason })}
                            />
                        )}
                        {form === 'reset-pin' && (
                            <TextForm
                                label={t('admin.actions.newPin')}
                                help={t('admin.actions.resetPinHelp')}
                                submitLabel={t('admin.actions.resetPin')}
                                maxLength={6}
                                digits
                                busy={busy}
                                onCancel={() => setForm(null)}
                                onSubmit={(pin) => void run({ action: 'reset-pin', pin })}
                            />
                        )}
                        {form === 'rename' && (
                            <TextForm
                                label={t('admin.actions.newName')}
                                help={t('admin.actions.renameHelp')}
                                submitLabel={t('admin.actions.rename')}
                                maxLength={20}
                                initial={account.username}
                                busy={busy}
                                onCancel={() => setForm(null)}
                                onSubmit={(newUsername) => void run({ action: 'rename', newUsername })}
                            />
                        )}
                        {form === 'delete' && (
                            <DeleteForm
                                username={account.username}
                                hasScores={boardTotal > 0}
                                busy={busy}
                                onCancel={() => setForm(null)}
                                onSubmit={(scores) => void remove(scores)}
                            />
                        )}
                    </>
                )}
            </section>

            <section>
                <SectionHeading>{t('admin.sections.progress')}</SectionHeading>
                {played.length === 0 ? (
                    <Muted>{t('admin.progress.none')}</Muted>
                ) : (
                    <ul className="grid gap-3 sm:grid-cols-2">
                        {played.map((id) => {
                            const entry = data.games[id]!
                            const readable = entry.progress !== null && typeof entry.progress === 'object'
                            const progress = normalizeProgress(entry.progress)
                            const level = levelProgress(progress.xp)
                            const records = Object.entries(progress.best)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 3)
                            return (
                                <li key={id}>
                                    <Card className="h-full">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <span className="truncate font-semibold">{gameTitle(id)}</span>
                                            <span className="shrink-0 text-[11px]" style={{ color: 'var(--text-subtle)' }}>
                                                {t('admin.progress.updated', { date: formatDateTime(entry.updatedAt) })}
                                            </span>
                                        </div>

                                        {!readable ? (
                                            <Muted className="mt-2 text-xs">{t('admin.progress.unreadable')}</Muted>
                                        ) : (
                                            <>
                                                <div className="mt-2 flex items-baseline gap-2">
                                                    <span className="text-lg font-semibold">{n(progress.xp)} XP</span>
                                                    <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                                                        {t('admin.progress.level', { level: level.level })}
                                                    </span>
                                                </div>
                                                <span
                                                    className="mt-1.5 block h-1.5 overflow-hidden rounded-full"
                                                    style={{ background: 'color-mix(in srgb, var(--accent) 18%, transparent)' }}
                                                    role="img"
                                                    aria-label={t('admin.progress.toNext', { pct: level.pct, level: level.level + 1 })}
                                                >
                                                    <span
                                                        className="block h-full rounded-full"
                                                        style={{ width: `${level.pct}%`, background: 'var(--accent)' }}
                                                    />
                                                </span>

                                                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                                    {(
                                                        [
                                                            ['plays', progress.plays],
                                                            ['bestStreak', progress.stats.bestStreak],
                                                            ['flawless', progress.stats.flawless],
                                                            ['correct', progress.stats.totalCorrect],
                                                        ] as const
                                                    ).map(([label, value]) => (
                                                        <div key={label} className="flex justify-between gap-2">
                                                            <dt style={{ color: 'var(--text-subtle)' }}>{t(`admin.progress.${label}`)}</dt>
                                                            <dd className="font-semibold tabular-nums">{n(value)}</dd>
                                                        </div>
                                                    ))}
                                                </dl>

                                                {records.length > 0 && (
                                                    <div className="mt-3 text-xs">
                                                        <p style={{ color: 'var(--text-subtle)' }}>{t('admin.progress.records')}</p>
                                                        <ul className="mt-1 flex flex-col gap-0.5">
                                                            {records.map(([recordKey, score]) => (
                                                                <li key={recordKey} className="flex items-baseline justify-between gap-2">
                                                                    <span className="truncate font-mono text-[11px]">{recordKey}</span>
                                                                    <span className="font-semibold tabular-nums">{n(score)}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        <details className="mt-3 text-xs">
                                            <summary className="cursor-pointer select-none" style={{ color: 'var(--text-subtle)' }}>
                                                {t('admin.progress.raw')}
                                            </summary>
                                            <pre
                                                className="pp-scroll mt-2 max-h-56 overflow-auto rounded-lg p-2 font-mono text-[11px] leading-snug"
                                                style={{ background: 'var(--surface)' }}
                                            >
                                                {JSON.stringify(entry.progress, null, 2)}
                                            </pre>
                                        </details>
                                    </Card>
                                </li>
                            )
                        })}
                    </ul>
                )}
                {played.length > 0 && unplayed.length > 0 && (
                    <Muted className="mt-3 text-xs">
                        {t('admin.progress.notPlayed', { games: unplayed.map(gameTitle).join(', ') })}
                    </Muted>
                )}
            </section>

            <section>
                <SectionHeading
                    aside={
                        !isSelf &&
                        boardTotal > 0 && (
                            <ConfirmButton
                                variant="danger"
                                disabled={busy}
                                onConfirm={() => void run({ action: 'clear-scores', game: 'all' })}
                            >
                                {t('admin.boards.removeAll')}
                            </ConfirmButton>
                        )
                    }
                >
                    {t('admin.sections.boards')}
                </SectionHeading>
                {data.boards.length === 0 || boardTotal === 0 ? (
                    <Muted>{t('admin.boards.none')}</Muted>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs" style={{ color: 'var(--text-subtle)' }}>
                                <th className="pb-2 font-medium">{t('admin.boards.game')}</th>
                                <th className="pb-2 text-right font-medium">{t('admin.boards.entries')}</th>
                                <th className="pb-2 text-right font-medium">{t('admin.boards.best')}</th>
                                <th className="hidden pb-2 text-right font-medium sm:table-cell">{t('admin.boards.last')}</th>
                                <th className="pb-2">
                                    <span className="sr-only">{t('admin.boards.remove')}</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.boards
                                .filter((board) => board.entries > 0)
                                .map((board) => (
                                    <tr key={board.game} className="border-t" style={{ borderColor: 'var(--border)' }}>
                                        <td className="py-2 pr-2">{gameTitle(board.game)}</td>
                                        <td className="py-2 text-right tabular-nums">{n(board.entries)}</td>
                                        <td className="py-2 text-right tabular-nums">
                                            {board.best === null ? '—' : n(board.best)}
                                        </td>
                                        <td className="hidden py-2 text-right text-xs tabular-nums sm:table-cell" style={{ color: 'var(--text-subtle)' }}>
                                            {formatDate(board.lastAt) ?? '—'}
                                        </td>
                                        <td className="py-2 pl-3 text-right">
                                            {!isSelf && (
                                                <ConfirmButton
                                                    disabled={busy}
                                                    onConfirm={() => void run({ action: 'clear-scores', game: board.game })}
                                                >
                                                    {t('admin.boards.remove')}
                                                </ConfirmButton>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                )}
                <Muted className="mt-3 text-xs">
                    {t('admin.boards.fleetbot')} {t('admin.boards.dailyNote')}
                </Muted>
            </section>

            <section>
                <SectionHeading>{t('admin.sections.history')}</SectionHeading>
                <LogList entries={data.log} />
            </section>
        </div>
    )
}

/**
 * Ett felt, en forklaring og to knapper — utestenging, ny PIN og nytt navn er
 * alle den samme formen. Skjemaet forsvinner når det lukkes, og det som var
 * skrevet i det forsvinner med.
 */
function TextForm({
    label,
    help,
    submitLabel,
    maxLength,
    initial = '',
    optional = false,
    digits = false,
    danger = false,
    busy,
    onCancel,
    onSubmit,
}: {
    label: string
    help: string
    submitLabel: string
    maxLength: number
    initial?: string
    optional?: boolean
    digits?: boolean
    danger?: boolean
    busy: boolean
    onCancel: () => void
    onSubmit: (value: string) => void
}) {
    const { t } = useTranslation()
    const [value, setValue] = useState(initial)

    const submit = (event: FormEvent) => {
        event.preventDefault()
        if (busy) return
        onSubmit(value.trim())
    }

    return (
        <form onSubmit={submit} className="mt-3 flex max-w-md flex-col gap-2.5">
            <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--text-subtle)' }}>
                {label}
                <input
                    value={value}
                    onChange={(event) => setValue(digits ? event.target.value.replace(/\D/g, '') : event.target.value)}
                    maxLength={maxLength}
                    required={!optional}
                    autoFocus
                    autoComplete="off"
                    {...(digits ? { inputMode: 'numeric' as const, pattern: '\\d{4,6}', minLength: 4 } : {})}
                    className={`${inputClass} ${digits ? 'tracking-[0.3em]' : ''}`}
                    style={inputStyle}
                />
            </label>
            <Muted className="text-xs leading-snug">{help}</Muted>
            <div className="flex gap-2">
                <Button onClick={onCancel}>{t('cancel')}</Button>
                <Button type="submit" variant={danger ? 'danger' : 'primary'} disabled={busy}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    )
}

/**
 * Sletting krever at navnet skrives inn. Det er den ene handlingen i panelet
 * som ikke kan gjøres om, og et bekreft-klikk er for lett å gi av vane.
 */
function DeleteForm({
    username,
    hasScores,
    busy,
    onCancel,
    onSubmit,
}: {
    username: string
    hasScores: boolean
    busy: boolean
    onCancel: () => void
    onSubmit: (scores: boolean) => void
}) {
    const { t } = useTranslation()
    const [typed, setTyped] = useState('')
    const [scores, setScores] = useState(false)
    const matches = typed.trim() === username

    const submit = (event: FormEvent) => {
        event.preventDefault()
        if (busy || !matches) return
        onSubmit(scores)
    }

    return (
        <form onSubmit={submit} className="mt-3 flex max-w-md flex-col gap-2.5">
            <p className="rounded-lg bg-red-100 px-3 py-2 text-xs leading-snug text-red-800 dark:bg-red-900/40 dark:text-red-100">
                {t('admin.actions.deleteHelp')}
            </p>
            {hasScores && (
                <label className="flex cursor-pointer items-center gap-2 text-xs">
                    <input
                        type="checkbox"
                        checked={scores}
                        onChange={(event) => setScores(event.target.checked)}
                        className="h-4 w-4 cursor-pointer accent-[color:var(--accent)]"
                    />
                    {t('admin.actions.deleteScores')}
                </label>
            )}
            <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--text-subtle)' }}>
                {t('admin.actions.deleteConfirm', { name: username })}
                <input
                    value={typed}
                    onChange={(event) => setTyped(event.target.value)}
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                    className={inputClass}
                    style={inputStyle}
                />
            </label>
            <div className="flex gap-2">
                <Button onClick={onCancel}>{t('cancel')}</Button>
                <Button type="submit" variant="danger" disabled={busy || !matches}>
                    {t('admin.actions.delete')}
                </Button>
            </div>
        </form>
    )
}
