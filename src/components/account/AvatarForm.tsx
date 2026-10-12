import { useId, useState } from 'react'
import { RotateCcw, Shuffle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getToken, signOut } from '../../account'
import Avatar from './Avatar'
import { AVATAR_CUSTOMIZATION, avatarColors, avatarStyles, type AvatarChoice, type AvatarOption } from './avatar-options'

function ColorControl({ option, value, disabled, onChange }: {
  option: AvatarOption; value?: string; disabled: boolean; onChange: (value?: string) => void
}) {
  const { t } = useTranslation()
  const id = useId()
  return <fieldset className="avatar-color-control" disabled={disabled}>
    <legend>{t(`profile.avatar.parts.${option}`)}</legend>
    <div className="avatar-colors">
      <button type="button" className="avatar-color-auto" aria-pressed={!value} onClick={() => onChange()}>{t('profile.avatar.automatic')}</button>
      {avatarColors.map(color => <button key={color} type="button" className="avatar-swatch" style={{ backgroundColor: color }} aria-label={t('profile.avatar.colorValue', { color })} aria-pressed={value?.toLowerCase() === color} onClick={() => onChange(color)} />)}
      <label className="avatar-custom-color" htmlFor={id}><span>{t('profile.avatar.customColor')}</span><input id={id} type="color" value={value ?? avatarColors[0]} onChange={event => onChange(event.target.value)} /></label>
    </div>
  </fieldset>
}

export default function AvatarForm({ username, current, onCancel, onDone }: {
  username: string; current?: AvatarChoice | null; onCancel: () => void; onDone: (avatar: AvatarChoice | null) => void
}) {
  const { t } = useTranslation()
  const formId = useId()
  const [choice, setChoice] = useState<AvatarChoice | null>(current ?? null)
  const [seed, setSeed] = useState(() => current?.seed ?? crypto.randomUUID())
  const [drafts, setDrafts] = useState<Partial<Record<AvatarChoice['style'], AvatarChoice>>>(() => current ? { [current.style]: current } : {})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selectChoice = (next: AvatarChoice | null) => {
    setChoice(next)
    if (next) {
      setSeed(next.seed)
      setDrafts(value => ({ ...value, [next.style]: next }))
    }
  }
  const customize = (option: AvatarOption, value?: string) => {
    if (!choice) return
    const options = { ...choice.options }
    if (value) options[option] = value
    else delete options[option]
    selectChoice({ ...choice, options })
  }
  const shuffle = () => {
    const next = crypto.randomUUID()
    selectChoice({ ...choice, style: choice?.style ?? 'bottts', seed: next })
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
    <div className="avatar-editor-scroll">
      <div className="avatar-options" role="group" aria-label={t('profile.avatar.style')}>
        <button type="button" className="avatar-option" aria-pressed={choice === null} disabled={busy} onClick={() => selectChoice(null)}><Avatar username={username} /><span>{t('profile.avatar.initial')}</span></button>
        {avatarStyles.map(style => <button key={style} type="button" className="avatar-option" aria-pressed={choice?.style === style} disabled={busy} onClick={() => selectChoice(drafts[style] ?? { style, seed })}><Avatar username={username} avatar={drafts[style] ?? { style, seed }} /><span>{t(`profile.avatar.styles.${style}`)}</span></button>)}
      </div>
      {choice && <div className="avatar-customization">
        <div className="avatar-details">
          {Object.entries(AVATAR_CUSTOMIZATION[choice.style].variants).map(([key, variants]) => {
            const option = key as AvatarOption
            return <div key={`${choice.style}-${option}`}><label htmlFor={`${formId}-${option}`}>{t(`profile.avatar.parts.${option}`)}</label><select id={`${formId}-${option}`} disabled={busy} value={choice.options?.[option] ?? ''} onChange={event => customize(option, event.target.value)}>
              <option value="">{t('profile.avatar.automatic')}</option>
              {variants.map((value, index) => <option key={value} value={value}>{t('profile.avatar.variant', { count: index + 1 })}</option>)}
            </select></div>
          })}
        </div>
        {AVATAR_CUSTOMIZATION[choice.style].colors.map(option => <ColorControl key={option} option={option} value={choice.options?.[option]} disabled={busy} onChange={value => customize(option, value)} />)}
      </div>}
      <div className="avatar-tools"><button type="button" className="button secondary" onClick={shuffle} disabled={busy}><Shuffle size={16} aria-hidden="true" />{t('profile.avatar.shuffle')}</button>{choice && <button type="button" className="button secondary" onClick={() => selectChoice({ style: choice.style, seed: choice.seed })} disabled={busy || !Object.keys(choice.options ?? {}).length}><RotateCcw size={16} aria-hidden="true" />{t('profile.avatar.reset')}</button>}</div>
      <p className="avatar-credit">{t('profile.avatar.credit')} <a href="https://www.dicebear.com/" target="_blank" rel="noreferrer">DiceBear</a> · <a href="https://www.dicebear.com/styles/bottts/" target="_blank" rel="noreferrer">Bottts / Pablo Stanley</a> (<a href="https://bottts.com/" target="_blank" rel="noreferrer">{t('profile.avatar.freeUse')}</a>) · <a href="https://www.dicebear.com/styles/fun-emoji/" target="_blank" rel="noreferrer">Fun Emoji / Davis Uche</a> (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>) · <a href="https://www.dicebear.com/styles/pixel-art/" target="_blank" rel="noreferrer">Pixel Art / DiceBear</a> (<a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">CC0</a>)</p>
    </div>
    {error && <p className="form-error" role="alert">{t(`account.errors.${error}`)}</p>}
    <div className="profile-account-actions"><button type="button" className="button primary" disabled={busy} onClick={() => void save()}>{t(busy ? 'profile.avatar.saving' : 'profile.avatar.save')}</button><button type="button" className="button secondary" disabled={busy} onClick={onCancel}>{t('profile.avatar.cancel')}</button></div>
  </div>
}
