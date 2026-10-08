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
        'button secondary flex-1'

    return (
        <div className="recovery-notice">
            <p className="recovery-title">{t('account.recovery.saveTitle')}</p>
            <p className="field-hint">{t('account.recovery.saveIntro')}</p>

            <p
                className="select-all recovery-code"
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

            <label className="recovery-confirm">
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
                className="button primary full-width"
            >
                {t('account.recovery.continue')}
            </button>
        </div>
    )
}
