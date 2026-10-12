import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail } from 'lucide-react'
import { deleteMessage, fetchMessages, setMessageStatus } from '../../admin/api'
import { errorText } from '../../admin/format'
import type { ContactMessage } from '../../admin/types'
import { formatDateTime } from '../../lib/formatDate'
import { Button, Card, ConfirmButton, ErrorNotice, Muted } from './ui'

/** Messages sent through the contact form, newest first. */
export default function AdminMessages() {
    const { t } = useTranslation()
    const [messages, setMessages] = useState<ContactMessage[] | null>(null)
    const [open, setOpen] = useState(0)
    const [error, setError] = useState<string | null>(null)

    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        let cancelled = false
        void fetchMessages().then(result => {
            if (cancelled) return
            if (result.ok) { setMessages(result.data.messages); setOpen(result.data.open); setError(null) }
            else setError(result.error)
        })
        return () => { cancelled = true }
    }, [attempt])

    const act = async (run: () => Promise<{ ok: boolean; error?: string }>) => {
        const result = await run()
        if (result.ok) setAttempt(value => value + 1)
        else setError(result.error ?? 'service_failed')
    }

    if (error) return <ErrorNotice onRetry={() => { setError(null); setAttempt(value => value + 1) }}>{errorText(t, error)}</ErrorNotice>
    if (!messages) return <Muted>{t('admin.loading')}</Muted>

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold">{t('admin.messages.open', { count: open })}</p>
            {messages.length === 0 && <Muted>{t('admin.messages.empty')}</Muted>}
            {messages.map(message => (
                <Card key={message.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs" style={{ color: 'var(--text-subtle)' }}>
                        <span>
                            <strong style={{ color: 'var(--text)' }}>{message.name || message.email}</strong>
                            {message.name ? ` · ${message.email}` : ''}
                            {message.username ? ` · ${t('admin.messages.account')}: ${message.username}` : ''}
                        </span>
                        <span className="tabular-nums">{formatDateTime(message.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>
                        {t(`contact.topics.${message.topic}`, { defaultValue: message.topic })} · {t(`admin.messages.status.${message.status}`)}
                    </p>
                    {/* the message is plain text from a stranger: rendered as text, never as HTML */}
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{message.message}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <a
                            href={`mailto:${message.email}?subject=${encodeURIComponent('Re: SpillArena')}`}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold"
                            style={{ borderColor: 'var(--border)' }}
                        >
                            <Mail className="h-3.5 w-3.5" aria-hidden="true" />{t('admin.messages.reply')}
                        </a>
                        <Button onClick={() => void act(() => setMessageStatus(message.id, message.status === 'new' ? 'done' : 'new'))}>
                            {message.status === 'new' ? t('admin.messages.markDone') : t('admin.messages.reopen')}
                        </Button>
                        <ConfirmButton variant="danger" onConfirm={() => void act(() => deleteMessage(message.id))}>
                            {t('admin.messages.delete')}
                        </ConfirmButton>
                    </div>
                </Card>
            ))}
        </div>
    )
}
