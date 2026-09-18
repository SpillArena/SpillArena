import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { renameAccount } from '../../account'

interface RenameFormProps {
    current: string
    onDone: () => void
    onCancel: () => void
}

/**
 * Bytte av brukernavn.
 *
 * PIN-en spørres om på nytt. Tegnet ligger i nettleseren i tretti dager, så
 * uten den kunne hvem som helst med en åpen fane døpt om kontoen — og navnet er
 * det eneste en topplassering henger på.
 *
 * ADVARSELEN ER IKKE PYNT. Ledertavlene ligger i hver sitt spill sin egen
 * database, og navnebyttet her når dem ikke. Resultater som alt er sendt inn
 * blir stående under det gamle navnet for alltid. Det er en ærlig konsekvens
 * spilleren bør kjenne FØR byttet, ikke oppdage etterpå på en tavle.
 */
export default function RenameForm({ current, onDone, onCancel }: RenameFormProps) {
    const { t } = useTranslation()
    const [name, setName] = useState(current)
    const [pin, setPin] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)

    const unchanged = name.trim() === current

    const submit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (busy || unchanged) return
        setBusy(true)
        setError(null)
        const result = await renameAccount(pin, name)
        setBusy(false)
        if (result.ok) {
            setPin('')
            onDone()
            return
        }
        setError(result.error)
    }

    return (
        <form onSubmit={submit} className="mt-3 flex flex-col gap-2.5">
            <label className="flex flex-col gap-1 text-xs font-medium" style={{ color: 'var(--text-subtle)' }}>
                {t('account.newUsername')}
                <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={20}
                    autoFocus
                    required
                    className="rounded-lg border px-2.5 py-1.5 text-sm"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                />
            </label>

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
                    autoComplete="current-password"
                    className="rounded-lg border px-2.5 py-1.5 text-sm tracking-[0.3em]"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                />
            </label>

            <p className="rounded-lg bg-amber-100 px-2.5 py-1.5 text-[11px] leading-snug text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                {t('account.renameWarning')}
            </p>

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
                    disabled={busy || unchanged}
                    className="flex-1 cursor-pointer rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {t('account.saveName')}
                </button>
            </div>
        </form>
    )
}
