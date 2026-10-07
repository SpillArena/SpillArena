import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createRecoveryCode } from '../../account'
import RecoveryCodeNotice from './RecoveryCodeNotice'

interface RecoveryCodeFormProps {
    username: string
    /** Kontoen har en kode fra før, som slutter å virke. */
    replacing: boolean
    onCancel: () => void
    onDone: () => void
}

/**
 * Ny gjenopprettingskode fra kontomenyen.
 *
 * PIN-en spørres om på nytt, som ved navnebytte: tegnet ligger i nettleseren i
 * tretti dager, og en kode er en nøkkel til kontoen. Hvem som helst med en åpen
 * fane skal ikke kunne lage seg en.
 */
export default function RecoveryCodeForm({ username, replacing, onCancel, onDone }: RecoveryCodeFormProps) {
    const { t } = useTranslation()
    const [pin, setPin] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)
    const [code, setCode] = useState<string | null>(null)

    const submit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (busy) return
        setBusy(true)
        setError(null)
        const result = await createRecoveryCode(pin)
        setBusy(false)
        setPin('')
        if (!result.ok) {
            setError(result.error)
            return
        }
        setCode(result.data.recoveryCode)
    }

    if (code) {
        return (
            <div className="mt-3">
                <RecoveryCodeNotice username={username} code={code} onDone={onDone} />
            </div>
        )
    }

    return (
        <form onSubmit={submit} className="mt-3 flex flex-col gap-2.5">
            <p className="text-xs leading-snug" style={{ color: 'var(--text-subtle)' }}>
                {t('account.recovery.createIntro')}
            </p>

            <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--text-subtle)' }}>
                {t('account.confirmPin')}
                <input
                    value={pin}
                    onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
                    type="password"
                    inputMode="numeric"
                    minLength={4}
                    maxLength={6}
                    required
                    autoFocus
                    autoComplete="current-password"
                    className="rounded-lg border px-2.5 py-1.5 text-sm tracking-[0.3em]"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                />
            </label>

            {replacing && (
                <p className="rounded-lg bg-amber-100 px-2.5 py-1.5 text-[11px] leading-snug text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                    {t('account.recovery.replaceWarning')}
                </p>
            )}

            {error && (
                <p role="alert" className="rounded-lg bg-red-100 px-2.5 py-1.5 text-xs text-red-800 dark:bg-red-900/40 dark:text-red-100">
                    {t(`account.errors.${error}`, { defaultValue: t('account.errors.service_failed') })}
                </p>
            )}

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold"
                    style={{ borderColor: 'var(--border)' }}
                >
                    {t('cancel')}
                </button>
                <button
                    type="submit"
                    disabled={busy}
                    className="flex-1 cursor-pointer rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {t('account.recovery.createSubmit')}
                </button>
            </div>
        </form>
    )
}
