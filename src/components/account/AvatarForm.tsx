import { useState } from 'react'
import { Shuffle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getToken, signOut } from '../../account'
import Avatar from './Avatar'
import { avatarStyles, type AvatarChoice } from './avatar-options'

export default function AvatarForm({ username, current, onCancel, onDone }: {
  username: string; current?: AvatarChoice | null; onCancel: () => void; onDone: (avatar: AvatarChoice | null) => void
}) {
  const { t } = useTranslation()
  const [choice, setChoice] = useState<AvatarChoice | null>(current ?? null)
  const [seed, setSeed] = useState(() => current?.seed ?? crypto.randomUUID())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const shuffle = () => {
    const next = crypto.randomUUID()
    setSeed(next)
    setChoice({ style: choice?.style ?? 'bottts', seed: next })
  }
  const save = async () => {
    const token = getToken()
    if (!token) { signOut(); return }
    setBusy(true)
    setError(null)
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 8000)
    try {
      const base = (import.meta.env.VITE_ACCOUNT_API as string | undefined) ?? '/api'
      const response = await fetch(`${base}/account/avatar`, {
        method: 'PUT', signal: controller.signal,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: choice }),
      })
      if (response.status === 401) { signOut(); return }
      if (!response.ok) { setError('service_failed'); return }
      const body = await response.json() as { avatar: AvatarChoice | null }
      window.dispatchEvent(new CustomEvent('spillarena:avatar-changed', { detail: { username, avatar: body.avatar } }))
      onDone(body.avatar)
    } catch { setError('unreachable') }
    finally { window.clearTimeout(timer); setBusy(false) }
  }
  return <div className="avatar-editor" aria-busy={busy}>
    <p>{t('profile.avatar.intro')}</p>
    <div className="avatar-preview"><Avatar username={username} avatar={choice} /></div>
    <div className="avatar-options" role="group" aria-label={t('profile.avatar.style')}>
      <button type="button" className="avatar-option" aria-pressed={choice === null} disabled={busy} onClick={() => setChoice(null)}><Avatar username={username} /><span>{t('profile.avatar.initial')}</span></button>
      {avatarStyles.map(style => <button key={style} type="button" className="avatar-option" aria-pressed={choice?.style === style} disabled={busy} onClick={() => setChoice({ style, seed })}><Avatar username={username} avatar={{ style, seed }} /><span>{t(`profile.avatar.styles.${style}`)}</span></button>)}
    </div>
    <button type="button" className="button secondary" onClick={shuffle} disabled={busy}><Shuffle size={16} aria-hidden="true" />{t('profile.avatar.shuffle')}</button>
    <p className="avatar-credit">{t('profile.avatar.credit')} <a href="https://www.dicebear.com/" target="_blank" rel="noreferrer">DiceBear</a> · <a href="https://www.dicebear.com/styles/bottts/" target="_blank" rel="noreferrer">Bottts / Pablo Stanley</a> · <a href="https://www.dicebear.com/styles/fun-emoji/" target="_blank" rel="noreferrer">Fun Emoji / Davis Uche</a> (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>) · <a href="https://www.dicebear.com/styles/pixel-art/" target="_blank" rel="noreferrer">Pixel Art / DiceBear</a> (<a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">CC0</a>)</p>
    {error && <p className="form-error" role="alert">{t(`account.errors.${error}`)}</p>}
    <div className="profile-account-actions"><button type="button" className="button primary" disabled={busy} onClick={() => void save()}>{t(busy ? 'profile.avatar.saving' : 'profile.avatar.save')}</button><button type="button" className="button secondary" disabled={busy} onClick={onCancel}>{t('profile.avatar.cancel')}</button></div>
  </div>
}
