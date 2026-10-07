import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy, Download } from 'lucide-react'

interface RecoveryCodeNoticeProps {
    username: string
    code: string
    onDone: () => void
}

/**
 * Gjenopprettingskoden, vist ÉN gang.
 *
 * Tjeneren har bare hashen, så dette er det eneste øyeblikket koden finnes i
 * klartekst noe sted. «Fortsett» er derfor låst til spilleren har krysset av
 * for at den er lagret — et klikk forbi av vane ville gjort koden verdiløs, og
 * spilleren ville ikke merket det før PIN-en var glemt.
 *
 * Brukes både i innloggingsvinduet og i kontomenyen.
 */
export default function RecoveryCodeNotice({ username, code, onDone }: RecoveryCodeNoticeProps) {
    const { t } = useTranslation()
    const [saved, setSaved] = useState(false)
    const [copied, setCopied] = useState(false)

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(code)
            setCopied(true)
        } catch {
            // uten tilgang til utklippstavla står koden der fortsatt og kan skrives av
        }
    }

    const download = () => {
        const text = t('account.recovery.fileText', { username, code })
        const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
        const link = document.createElement('a')
        link.href = url
        link.download = t('account.recovery.fileName')
        link.click()
        URL.revokeObjectURL(url)
    }

    const buttonClass =
        'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:shadow-sm dark:border-slate-700 dark:text-slate-200'

    return (
        <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('account.recovery.saveTitle')}</p>
            <p className="text-xs leading-snug text-slate-600 dark:text-slate-300">{t('account.recovery.saveIntro')}</p>

            <p
                className="select-all rounded-lg border-2 border-dashed border-[color:var(--accent)] px-3 py-3 text-center font-mono text-lg font-semibold tracking-wider text-slate-900 dark:text-slate-100"
                aria-label={t('account.recovery.codeLabel')}
            >
                {code}
            </p>

            <div className="flex gap-2">
                <button type="button" onClick={() => void copy()} className={buttonClass}>
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {t(copied ? 'account.recovery.copied' : 'account.recovery.copy')}
                </button>
                <button type="button" onClick={download} className={buttonClass}>
                    <Download className="h-3.5 w-3.5" />
                    {t('account.recovery.download')}
                </button>
            </div>

            <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-700 dark:text-slate-200">
                <input
                    type="checkbox"
                    checked={saved}
                    onChange={(event) => setSaved(event.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[color:var(--accent)]"
                />
                {t('account.recovery.confirmSaved')}
            </label>

            <button
                type="button"
                onClick={onDone}
                disabled={!saved}
                className="cursor-pointer rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
                {t('account.recovery.continue')}
            </button>
        </div>
    )
}
