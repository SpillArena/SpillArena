import { useEffect, useId, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { deleteAccount } from '../../account'
import Dialog from '../../ui/Dialog'

export default function DeleteAccountDialog({ username, onClose, onDeleted }: {
  username: string; onClose: () => void; onDeleted: () => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const pending = useRef(false)
  const cancel = useRef<HTMLButtonElement>(null)
  const [pin, setPin] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { cancel.current?.focus() }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (pending.current || !confirmed || !/^\d{4,6}$/.test(pin)) return
    pending.current = true
    setBusy(true)
    setError(null)
    const result = await deleteAccount(pin)
    if (result.ok) { onDeleted(); return }
    setPin('')
    setError(result.error)
    setBusy(false)
    pending.current = false
  }

  return <Dialog open onClose={onClose} dismissible={!busy} title={t('account.deletion.title')} className="delete-account-dialog">
    <form className="sa-form account-edit-form" onSubmit={submit} aria-busy={busy}>
      <p className="form-intro">{t('account.deletion.description', { username })}</p>
      <p className="dialog-note" id={`${id}-scope`}>{t('account.deletion.scope')}</p>
      <label htmlFor={`${id}-pin`}>{t('account.confirmPin')}
        <input id={`${id}-pin`} type="password" inputMode="numeric" autoComplete="current-password"
          value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, ''))}
          minLength={4} maxLength={6} pattern="[0-9]{4,6}" required disabled={busy} className="pin-input" />
      </label>
      <label className="deletion-confirm" htmlFor={`${id}-confirm`}>
        <input id={`${id}-confirm`} type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)}
          required disabled={busy} aria-describedby={`${id}-scope`} />
        <span>{t('account.deletion.confirm')}</span>
      </label>
      {error && <p role="alert" className="form-error">{t(`account.errors.${error}`, { defaultValue: t('account.errors.service_failed') })}</p>}
      <div className="profile-account-actions deletion-actions">
        <button ref={cancel} type="button" className="button secondary" onClick={onClose} disabled={busy}>{t('cancel')}</button>
        <button type="submit" className="button danger" disabled={busy || !confirmed || !/^\d{4,6}$/.test(pin)}>
          <Trash2 size={16} aria-hidden="true" /><span role={busy ? 'status' : undefined}>{t(busy ? 'account.deletion.deleting' : 'account.deletion.submit')}</span>
        </button>
      </div>
    </form>
  </Dialog>
}
